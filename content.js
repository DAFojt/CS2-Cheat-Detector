// Chrome bug. https://stackoverflow.com/questions/66406672/how-do-i-import-scripts-into-a-service-worker-using-chrome-extension-manifest-ve
try {
    importScripts('repository.js', 'interface.js', 'calculator.js');
  } catch (e) {
}

//very crazy fix, without it scripts dont have time to load, fix it
setTimeout(() => {
    run();
}, 1)


//for data that we don't want to refresh after changing the source of the matching data, prevents the data from being downloaded again for changes that don't require refreshing the browser window
var playerDataPromiseSimpleCache;
var playerDetailsPromiseSimpleCache;
var playerFaceitDataPromiseSimpleCache;

var dataSource = 'all';

async function run() {
    playerDataPromiseSimpleCache = playerDataPromiseSimpleCache ?? getPlayerData(window.location.toString());
    playerDataPromiseSimpleCache.then(pd => {
        if (!pd || pd.player.length === 0) {
            console.info("Cheat detector: No api data");
        }
    })
    
    if(!playerDetailsPromiseSimpleCache) {
        const playerDataDetailsPromise = getPlayerDetailsData(playerDataPromiseSimpleCache.then(pd => pd.player.steam64Id));
        playerDetailsPromiseSimpleCache = parsePlayerDetails(playerDataDetailsPromise);
        playerDetailsPromiseSimpleCache.then(pd => {
            if (!pd) {
                console.info("Cheat detector: No player details data")
            };
        });
    }
    if(!playerFaceitDataPromiseSimpleCache) {
        playerFaceitDataPromiseSimpleCache = getPlayerFaceitData(playerDetailsPromiseSimpleCache.then(pd => pd?.faceitNickname));
    }

    const topNHltvPlayersDataPromise = getTopNHltvPlayersData();
    const skillCalculationsPromise = calculate(playerDataPromiseSimpleCache, topNHltvPlayersDataPromise);

    createInterface(playerDataPromiseSimpleCache, skillCalculationsPromise, playerDetailsPromiseSimpleCache, playerFaceitDataPromiseSimpleCache);
}

async function catchCheater(steam64Id, cheaterPercentage) {
    if(cheaterPercentage >= 80 && !isBanned()) {
        getCache('caughtCheaters').then(cc => {
            if(!cc) {
                cc = [];
            }
            const cheater = cc.find(c => c.steam64Id === steam64Id);
            let rewrite = false;
            if(!!cheater && cheater.cheaterPercentage < cheaterPercentage) {
                const index = cc.indexOf(cheater);
                cc.splice(index, 1);
                rewrite = true;
            }
            if(!cheater || rewrite) {
                cc.push({
                    steam64Id,
                    cheaterPercentage
                });
                setCache('caughtCheaters', cc);
            }
        });
    }
}