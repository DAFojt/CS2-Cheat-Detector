// Chrome bug. https://stackoverflow.com/questions/66406672/how-do-i-import-scripts-into-a-service-worker-using-chrome-extension-manifest-ve
try {
    importScripts('repository.js', 'interface.js', 'calculator.js');
  } catch (e) {}

//very crazy fix, without it the scripts won't load, some chrome bug? or am I an idiot?
setTimeout(() => {
    if(isValidUrl()) {
        run();
    }
}, 0)


//for data that we don't want to refresh after changing the source of the matches data, prevents the data from being downloaded again for changes that don't require refreshing the browser window
var playerDataPromiseSimpleCache;
var playerDetailsPromiseSimpleCache;
var playerFaceitDataPromiseSimpleCache;

var dataSource = 'all';

function run() {
    playerDataPromiseSimpleCache = playerDataPromiseSimpleCache ?? PlayerRepository.getPlayerData(window.location.toString());
    playerDataPromiseSimpleCache.then(pd => {
        if (!pd || pd.player.length === 0) {
            console.info("Cheat detector: No api data");
        }
    })
    
    if(!playerDetailsPromiseSimpleCache) {
        playerDetailsPromiseSimpleCache = PlayerRepository.getPlayerDetailsData(playerDataPromiseSimpleCache.then(pd => pd.player.steam64Id));
        playerDetailsPromiseSimpleCache.then(pd => {
            if (!pd) {
                console.info("Cheat detector: No player details data")
            };
        });
    }
    if(!playerFaceitDataPromiseSimpleCache) {
        playerFaceitDataPromiseSimpleCache = PlayerRepository.getPlayerFaceitData(playerDetailsPromiseSimpleCache.then(pd => pd?.faceitNickname));
        playerFaceitDataPromiseSimpleCache.then(fd => {
            if (!fd) {
                console.info("Cheat detector: No Faceit api data");
            };
        });
    }

    const topNHltvPlayersDataPromise = PlayerRepository.getTopNHltvPlayersData();
    const skillCalculationsPromise = SkillCalculator.comparePlayerToTopNHltvPlayers(playerDataPromiseSimpleCache, topNHltvPlayersDataPromise);

    createInterface(playerDataPromiseSimpleCache, skillCalculationsPromise, playerDetailsPromiseSimpleCache, playerFaceitDataPromiseSimpleCache);
}

async function catchCheater(steam64Id, suspiciousPoints, cheaterPercentage) {
    if(cheaterPercentage >= 80 && !Checkers.isBanned()) {
        StorageProvider.get('caughtCheaters').then(caughtCheaters => {
            if(!caughtCheaters) {
                caughtCheaters = [];
            }
            const cheater = caughtCheaters.find(c => c.steam64Id === steam64Id);
            let rewrite = false;
            if(!!cheater && cheater.cheaterPercentage < cheaterPercentage) {
                const index = caughtCheaters.indexOf(cheater);
                caughtCheaters.splice(index, 1);
                rewrite = true;
            }
            if(!cheater || rewrite) {
                caughtCheaters.push({
                    steam64Id,
                    cheaterPercentage,
                    suspiciousPoints: suspiciousPoints.map(x => {x.points, x.all, x.name}),
                    date: new Date()
                });
                StorageProvider.set('caughtCheaters', caughtCheaters);
            }
        });
    }
}

//additional validation to manifest v3 matches
function isValidUrl() {
    const url = window.location.toString().split('/');
    const validUrl = url.length < 6 || url.length === 6 && url[5] === ''; 
    if(!validUrl) {
        console.info('Cheat detector: Not valid URL');
    }
    return validUrl;
}