try {
    importScripts('settings.js');
  } catch (e) {
}

class SkillCalculator {
    static async comparePlayerToTopNHltvPlayers(player, topNHltvPlayers) {
        return Promise.all([player, topNHltvPlayers]).then(async c => {
            const result = await this.betterThan(c[0], c[1]);
            let spSum = 0;
            let all = 0;
            let newSp = result.getAllSuspiciousPoints();
            newSp.sort(function(a, b){return b.points - a.points}).slice(0, Math.round(newSp.length / 2)).forEach(sp => {
                spSum += sp.points;
                all += sp.all;
            })
            let percentage = spSum / all * 100;
            const cheaterPercentage = result.matchesCount ? Math.round(this.halfSigmoidFilter(percentage)) : 0;
    
            return { result, matchesCount: result.matchesCount, cheaterPercentage: cheaterPercentage }
        })
    }
    
    static halfSigmoidFilter(input) {
        let sgmdv = input < 50 ? 1/(1+Math.pow(Math.E, (-(input/10-5)))) * 100 : input;
        if(sgmdv < 2) sgmdv = 0;
        return sgmdv;
    }
    
    static getCordErrorForWeapon(s, cordLimit) {
        let sum = 0;
        const nonEmptyCords = s.coords.filter(c => c.playerX !== null && c.playerY !== null);
        const limitedCords = nonEmptyCords.slice(0, cordLimit ?? nonEmptyCords.length - 1);
        for (const c of limitedCords) {
            sum += this.getCordErrorValue(c);
        }
        return {
            weaponLabel: s.weaponLabel,
            avgError: Math.round(sum / nonEmptyCords.length * 100) / 100,
            coordsCount: limitedCords.length
        };
    }
    
    static getCordErrorValue(coord) {
        return Math.sqrt(Math.pow(coord.weaponX - coord.playerX, 2) + Math.pow(coord.weaponY - coord.playerY, 2));
    }
    
    static async betterThan(player, topNHltvPlayersPromise) {
        const extensionSettings = await new Settings().extensionSettings;
        let matches = player?.games;
        const allMatchesCount = matches.length;
    
        let playerComparisons = {
            comparisons: [],
            info: {},
            _avaiableStats: [],
            avaiableStats: () => {
                if(playerComparisons._avaiableStats.length === 0) {
                    playerComparisons._avaiableStats = playerComparisons.comparisons.flatMap(r => r.stats).map(s => ({ key: s.key, name: s.name, includeInCheaterPercentage: s.includeInCheaterPercentage, suspiciousBehaviour: s.suspiciousBehaviour, unit: s.unit, order: s.order })).filter((obj, index, arr) =>{return arr.findIndex(o =>{return JSON.stringify(o) === JSON.stringify(obj)}) === index}).sort(function(a, b) {return a.order - b.order;})
                }
                return playerComparisons._avaiableStats;
            },
            getStatNameByKey: (key) => playerComparisons.avaiableStats().find(s => s.key === key).name,
            getStatSuspiciousBehaviourByKey: (key) => playerComparisons.avaiableStats().find(s => s.key === key).suspiciousBehaviour,
            getAllStats: () => playerComparisons.comparisons.flatMap(c => c.stats).reduce((stats, st) => {const key = st.key;if (!stats[key]) {stats[key] = []} stats[key].push(st); return stats;}, {}),
            getStatsByKey: (key) => playerComparisons.comparisons.flatMap(c => c.stats).filter(s => s.key === key),
            getStatsByKeyLength: (key) => playerComparisons.comparisons.flatMap(c => c.stats).filter(s => s.key === key).length,
            getStatByKeyAndEnemySteamId64: (key, hltvPlayerSteam64Id) => playerComparisons.comparisons.flatMap(c => c.stats).find(s => s.key === key && s.hltvPlayerSteam64Id === hltvPlayerSteam64Id),
            getStatsByKeyWherePlayerIsBetter: (key) => playerComparisons.getStatsByKey(key).filter(s => s.isPlayerBetter()),
            getStatsByKeyWherePlayerIsBetterLength: (key) => playerComparisons.getStatsByKey(key).filter(s => s.isPlayerBetter()).length,
            getStatsByKeyWherePlayerIsWorse: (key) => playerComparisons.getStatsByKey(key).filter(s => !s.isPlayerBetter()),
            getStatsByKeyWherePlayerIsWorseLength: (key) => playerComparisons.getStatsByKey(key).filter(s => !s.isPlayerBetter()).length,
            getEnemysSteamId64FromStatByKeyWherePlayerIsBetter: (key) => playerComparisons.getStatsByKey(key).filter(s => s.isPlayerBetter()).map(s => s.hltvPlayerSteam64Id),
            getEnemysSteamId64FromStatByKeyWherePlayerIsWorse: (key) => playerComparisons.getStatsByKey(key).filter(s => !s.isPlayerBetter()).map(s => s.hltvPlayerSteam64Id),
            getAllSuspiciousPoints: () => playerComparisons.avaiableStats().filter(av => av.includeInCheaterPercentage).map(av => playerComparisons.getSuspiciousPointsByKey(av.key)),
            getSuspiciousPointsByKey: (key) => { return {points: playerComparisons.getStatsByKeyWherePlayerIsBetterLength(key), all: playerComparisons.getStatsByKeyLength(key), name: playerComparisons.getStatNameByKey(key), suspiciousBehaviour: playerComparisons.getStatSuspiciousBehaviourByKey(key)} },
        };
    
    
        if(!matches || matches.length === 0) {
            playerComparisons.stats = [];
            playerComparisons.matchesCount = 0;
            return playerComparisons;
        }
        let matchesCount;
        topNHltvPlayersPromise.forEach(async (topNHltvPlayer) => {
            let playerComparison = {
                stats: [],
                info: {}
            };
    
            playerComparison.playerNickname = player.player.nickname;
            playerComparison.topNHltvPlayerNickname = topNHltvPlayer.player.nickname;
            let sprayComparisons = [];
    
            topNHltvPlayer.sprays.forEach((topNHltvPlayerspray) => {
                const weaponLabel = topNHltvPlayerspray.weaponLabel;
                const playerSpray = player.sprays.find(s => s.weaponLabel === weaponLabel);
                if (!playerSpray)
                    return;
                const coordsLimit = playerSpray.coords.length > topNHltvPlayerspray.coords.length ? topNHltvPlayerspray.coords.length : playerSpray.coords.length;
    
                const playerRecoil = this.getCordErrorForWeapon(playerSpray, coordsLimit);
                const topNHltvPlayerRecoil = this.getCordErrorForWeapon(topNHltvPlayerspray, coordsLimit);
    
                sprayComparisons.push({
                    weaponLabel: weaponLabel,
                    playerError: playerRecoil.avgError,
                    topNHltvPlayerError: topNHltvPlayerRecoil.avgError,
                    coordsLimit: coordsLimit
                });
            });
    
            const weaponsList = ['AK-47', 'M4A4', 'M4A1-S', 'M4A4', 'FAMAS', 'Galil AR'];
            const sprayControlOverall = this.toValue(sprayComparisons.filter(sc => weaponsList.includes(sc.weaponLabel)).map(sc => sc.playerError), sprayComparisons.filter(sc => weaponsList.includes(sc.weaponLabel)).map(sc => sc.topNHltvPlayerError), false);
            const sprayControlAK = [sprayComparisons.find(sc => sc.weaponLabel === 'AK-47').playerError, sprayComparisons.find(sc => sc.weaponLabel === 'AK-47').topNHltvPlayerError, sprayComparisons.find(sc => sc.weaponLabel === 'AK-47').coordsLimit];
    
    
            if (dataSource !== 'all' && dataSource !== 'premier+wgm') {
                let src = (dataSource === 'premier' ? 'matchmaking' : dataSource);
                    src = (dataSource === 'wingman' ? 'matchmaking_wingman' : src);
                matches = matches.filter(m => m.dataSource === src);
            } else if (dataSource === 'premier+wgm') {
                matches = matches.filter(m => m.dataSource === 'matchmaking' || m.dataSource === 'matchmaking_wingman');
            }
            const reactionTimes = this.toMs(matches.map(g => g.playerStats[0].reactionTime), topNHltvPlayer.games.map(g => g.playerStats[0].reactionTime));
            const preaaim = this.toValue(matches.map(g => g.playerStats[0].preaim), topNHltvPlayer.games.map(g => g.playerStats[0].preaim), false);
            const accuracyEnemySpotted = this.toValue(matches.map(g => g.playerStats[0].accuracyEnemySpotted), topNHltvPlayer.games.map(g => g.playerStats[0].accuracyEnemySpotted), true);
            const accuracy = this.toValue(matches.map(g => g.playerStats[0].accuracy), topNHltvPlayer.games.map(g => g.playerStats[0].accuracy), true);
            const accuracyHead = this.toValue(matches.map(g => g.playerStats[0].accuracyHead), topNHltvPlayer.games.map(g => g.playerStats[0].accuracyHead), true);
            const sprayAccuracy = this.toValue(matches.map(g => g.playerStats[0].sprayAccuracy), topNHltvPlayer.games.map(g => g.playerStats[0].sprayAccuracy), true);
            matchesCount = matches.length;
    

            const isAllMatches = dataSource === 'all' || matchesCount === allMatchesCount || matchesCount === extensionSettings.allMatchesCount;
            if(isAllMatches) { // to do dont hide it when calculations are not for all matches, change ui to inform user that this statistic is not included in calculations when calculated matches count is smaller than all matches count(for 0/10 too, for this case it can be strange for user)
                playerComparison.stats.push({
                    key: "spray_control_overall",
                    name: "Spray control overall",
                    unit: "*",
                    order: 0,
                    suspiciousBehaviour: "Norecoil",
                    playerValue: sprayControlOverall[0],
                    topNHltvPlayerValue: sprayControlOverall[1],
                    hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
                    checkingMethod: "smallerBetter",
                    isPlayerBetter: () => sprayControlOverall[0] < sprayControlOverall[1],
                    includeInCheaterPercentage: isAllMatches
                });
    
                playerComparison.stats.push({
                    key: "spray_control_ak",
                    name: "Spray control AK-47",
                    unit: "*",
                    order: 1,
                    suspiciousBehaviour: "Norecoil",
                    playerValue: sprayControlAK[0],
                    topNHltvPlayerValue: sprayControlAK[1],
                    hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
                    checkingMethod: "smallerBetter",
                    isPlayerBetter: () => sprayControlAK[0] < sprayControlAK[1],
                    includeInCheaterPercentage: isAllMatches,
                    samplesLimit: sprayControlAK[2]
                });
    
                if(extensionSettings.showAllSpraysEnabled) {
                    let internalOrder = 0;
                    sprayComparisons.filter(x => x.weaponLabel != "AK-47").forEach(spray => {
                        playerComparison.stats.push({
                            key: "spray_control_" + spray.weaponLabel,
                            name: "Spray control " + spray.weaponLabel,
                            unit: "*",
                            order: 2 + ([...spray.weaponLabel].map(char => char.charCodeAt(0)).reduce((accumulator, currentValue) => accumulator + currentValue, 0) / 10000),
                            suspiciousBehaviour: "Norecoil",
                            playerValue: spray.playerError,
                            topNHltvPlayerValue: spray.topNHltvPlayerError,
                            hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
                            checkingMethod: "smallerBetter",
                            isPlayerBetter: () => spray.playerError < spray.topNHltvPlayerError,
                            includeInCheaterPercentage: false,
                            samplesLimit: spray.coordsLimit
                        });
                        internalOrder++;
                    })
                }
            }            
    
            playerComparison.stats.push({
                key: "spray_accuracy",
                name: "Spray accuracy",
                unit: "%",
                order: 3,
                suspiciousBehaviour: "Aimbot",
                playerValue: sprayAccuracy[0],
                topNHltvPlayerValue: sprayAccuracy[1],
                hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
                checkingMethod: "biggerBetter",
                isPlayerBetter: () => sprayAccuracy[0] > sprayAccuracy[1],
                includeInCheaterPercentage: true
            });
    
            playerComparison.stats.push({
                key: "preaim",
                name: "Preaim",
                unit: "*",
                order: 4,
                suspiciousBehaviour: "Wallhack",
                playerValue: preaaim[0],
                topNHltvPlayerValue: preaaim[1],
                hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
                checkingMethod: "smallerBetter",
                isPlayerBetter: () => preaaim[0] < preaaim[1],
                includeInCheaterPercentage: true
            });
    
            playerComparison.stats.push({
                key: "tdm",
                name: "Reaction time(TDM)",
                unit: "ms",
                order: 5,
                suspiciousBehaviour: "Aimbot",
                playerValue: reactionTimes[0],
                topNHltvPlayerValue: reactionTimes[1],
                hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
                checkingMethod: "smallerBetter",
                isPlayerBetter: () => reactionTimes[0] < reactionTimes[1],
                includeInCheaterPercentage: true
            });
    
            playerComparison.stats.push({
                key: "accuracy_enemy_spotted",
                name: "Accuracy enemy spotted",
                suspiciousBehaviour: "Aimbot",
                unit: "%",
                order: 6,
                playerValue: accuracyEnemySpotted[0],
                topNHltvPlayerValue: accuracyEnemySpotted[1],
                hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
                checkingMethod: "biggerBetter",
                isPlayerBetter: () => accuracyEnemySpotted[0] > accuracyEnemySpotted[1],
                includeInCheaterPercentage: true
            });
    
            playerComparison.stats.push({
                key: "accuracy_head",
                name: "Accuracy head",
                unit: "%",
                order: 7,
                suspiciousBehaviour: "Aimbot",
                playerValue: accuracyHead[0],
                topNHltvPlayerValue: accuracyHead[1],
                hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
                checkingMethod: "biggerBetter",
                isPlayerBetter: () => accuracyHead[0] > accuracyHead[1],
                includeInCheaterPercentage: true
            });
            
            if(extensionSettings.accuracyOverallEnabled) {
                playerComparison.stats.push({
                    key: "accuracy",
                    name: "Accuracy overall",
                    unit: "%",
                    order: 8,
                    suspiciousBehaviour: "Aimbot",
                    playerValue: accuracy[0],
                    topNHltvPlayerValue: accuracy[1],
                    hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
                    checkingMethod: "biggerBetter",
                    isPlayerBetter: () => accuracy[0] > accuracy[1],
                    includeInCheaterPercentage: false
                });
            }
        playerComparisons.comparisons.push(playerComparison);
        });
        playerComparisons.matchesCount = matchesCount;
    
        return playerComparisons;
    }
    
    static toMs(playerValueData, hltvPlayerValueData) {
        const playerValue = Math.round(playerValueData.reduce((a, b) => a + b, 0) / playerValueData.length * 1000);
        const hltvPlayerValue = Math.round(hltvPlayerValueData.reduce((a, b) => a + b, 0) / hltvPlayerValueData.length * 1000);
    
        return [playerValue, hltvPlayerValue];
    }
    
    static toValue(playerValueData, hltvPlayerValueData, percent = false) {
        const playerValue = Math.round(playerValueData.reduce((a, b) => a + b, 0) / playerValueData.length * (percent ? 100 : 1) * 100) / 100;
        const hltvPlayerValue = Math.round(hltvPlayerValueData.reduce((a, b) => a + b, 0) / hltvPlayerValueData.length * (percent ? 100 : 1) * 100) / 100;
    
        return [playerValue, hltvPlayerValue];
    }
}