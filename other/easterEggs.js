try {
    importScripts('cache.js');
  } catch (e) {
}

async function nicePokemonEasterEgg() {
    if(!isBanned()) {
        const isGabenHappy = await getCache('happyGabenAchivementCompleted');
        const showHappyGabenForEachNewObvCheaterEnabled = await getCache('showHappyGabenForEachNewObvCheaterEnabled');
        if(!isGabenHappy || showHappyGabenForEachNewObvCheaterEnabled) {
            const happyGaben = document.createElement('img');
            happyGaben.className = 'happy-gaben show-from-bottom';
            happyGaben.src = chrome.runtime.getURL('../resources/images/eggs/gaben.png');
            const gabenPlace = document.getElementsByClassName('flat_page profile_page has_profile_background MidnightTheme responsive_page')[0];
            gabenPlace.prepend(happyGaben);
            setTimeout(() => {
                gabenPlace.removeChild(happyGaben);
            }, 8000);
            setCache('happyGabenAchivementCompleted', true);
        }
    }
}