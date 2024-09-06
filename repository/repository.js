try {
    importScripts('storageProvider.js', 'settings.js');
  } catch (e) {
}

class PlayerRepository {
    static async getPlayerData(id) {
        return fetch(`https://api.leetify.com/api/compare?friendName=${id}&period=2`).then(res => res.ok ? res.json() : null).then(x => {x.games = x?.games.filter(x => x.isCs2); return x;}).catch(err => { console.info('getPlayerData ERROR', err); return null; }).finally(() => console.info('Player data API called'));
    }
    
    static async getPlayerDetailsData(idPromise) {
        const id = await idPromise;
        return fetch(`https://api.leetify.com/api/profile/${id}`).then(res => res.ok ? this.parsePlayerDetails(res.json()) : null).catch(err => { console.info('getPlayerDetails ERROR', err); return null; }).finally(() => console.info('Player details API called'));
    }
    
    static async parsePlayerDetails(playerDetailsPromise) {
        return playerDetailsPromise.then(pd => {
            return pd ? {
                bannedTeammates: pd.teammates === false ? [] : pd.teammates.filter(x => x.isBanned).map(x => {
                    return {
                        steam64Id: x.steam64Id,
                        steamNickname: x.steamNickname,
                        steamAvatarUrl: x.steamAvatarUrl,
                        matchesPlayedTogether: x.matchesPlayedTogether
                    };
                }),
                platformBans: pd.meta.platformBans,
                faceitNickname: pd.meta.faceitNickname,
                esportalNickname: pd.meta.esportalNickname,
                cs2MatchesCount: pd.games.filter(g => g.isCs2).length,
                csgoMatchesCount: pd.games.filter(g => !g.isCs2).length
            } : null});
    }
    
    static async getPlayerFaceitData(faceitNicknamePromise) {
        //steam cors bypass, code is in background.js
        if(!faceitNicknamePromise)
            return;
        return faceitNicknamePromise.then(faceitNickname => {
            console.info('Faceit API called', faceitNickname)
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ type: 'getFaceitPlayerData', faceitNickname: faceitNickname }, response => {
                    if(response) {
                        resolve(response);
                    }
                    else{
                        console.info('No Faceit API data');
                        resolve(null);
                    }
                })
            });
        })
    }
    
    static async getTopNHltvPlayersData() {
        const extensionSettings = await (new Settings().extensionSettings);
    
        const topNHltvPlayersDataFromCachePromise = StorageProvider.get('topNHltvPlayersData');
        const lastCalculationsDateFromCachePromise = StorageProvider.get('lastCalculationsDate');
        const recalculateDataPromise = StorageProvider.get('recalculateData');
        let dateMinusDay = new Date();
        dateMinusDay.setDate(dateMinusDay.getDate() - 1);
    
        return await Promise.all([topNHltvPlayersDataFromCachePromise, lastCalculationsDateFromCachePromise, recalculateDataPromise]).then(async cacheData => {
            if (!cacheData[0] || !cacheData[1] || new Date(cacheData[1]) < dateMinusDay || cacheData[2] === true) {
                const topNHltvPlayers = extensionSettings.top10hltvPlayers.map(x => x.steam64Id);
                const topNHltvPlayersDataFromApi = PlayerRepository.getPlayersDataFromApi(topNHltvPlayers);
                StorageProvider.set('recalculateData', false);
                return await Promise.all(topNHltvPlayersDataFromApi).then(apiData => {
                    StorageProvider.set('topNHltvPlayersData', apiData);
                    StorageProvider.set('lastCalculationsDate', new Date());
                    return apiData;
                })
            } else {
                return cacheData[0];
            }
        });
    }
    
    static getDefaultTop10HltvPlayers() {
        return fetch(chrome.runtime.getURL('../resources/defaultTop10HltvPlayers.json')).then(response => {return response.json()});
    }
    
    static getPlayersDataFromApi(steamIds64) {
        let topNHltvPlayersData = [];
        steamIds64.forEach(steam64Id => topNHltvPlayersData.push(PlayerRepository.getPlayerData(steam64Id)));
        return topNHltvPlayersData;
    }
}

