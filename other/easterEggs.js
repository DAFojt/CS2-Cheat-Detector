try {
    importScripts('storageProvider.js');
  } catch (e) {
}

async function nicePokemonEasterEgg() {
    if(!Checkers.isBanned()) {
        const isGabenHappy = await StorageProvider.get('happyGabenAchivementCompleted');
        const showHappyGabenForEachNewObvCheaterEnabled = await StorageProvider.get('showHappyGabenForEachNewObvCheaterEnabled');
        if(!isGabenHappy || showHappyGabenForEachNewObvCheaterEnabled) {
            const happyGaben = document.createElement('img');
            happyGaben.className = 'happy-gaben show-from-bottom';
            happyGaben.src = chrome.runtime.getURL('../resources/images/eggs/gaben.png');
            const gabenPlace = document.getElementsByClassName('flat_page profile_page has_profile_background MidnightTheme responsive_page')[0];
            gabenPlace.prepend(happyGaben);
            setTimeout(() => {
                gabenPlace.removeChild(happyGaben);
            }, 8000);
            StorageProvider.set('happyGabenAchivementCompleted', true);
        }
    }
}