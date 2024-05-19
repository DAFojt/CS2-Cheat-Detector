try {
    importScripts('cache.js');
  } catch (e) {
}

class Settings {
    defaultSettings = {
        showAllSpraysEnabled: false,
        cheaterPercentageAtTheTopEnabled: true,
        fancyAnimationsEnabled: true,
        minMatchesCount: 10,
        maxMatchesCount: 60,
        accuracyOverallEnabled: false,
        showHappyGabenForEachNewObvCheaterEnabled: false,
    }

    constructor() {
        this.extensionSettings = getCache('extensionSettings').then(s => s ? s : this.defaultSettings).then(async s => {
            if (!s.top10hltvPlayers)
                s.top10hltvPlayers = await getTop10HltvPlayers();
            return s;
        });
    }

    saveSettings() {
        this.extensionSettings.then(es => {
            setCache('extensionSettings', es);
        })
    }

    resetSettings() {
        setCache('extensionSettings', this.defaultSettings);
        setCache('recalculateData', true);
        console.info('All settings reseted');
    }
}

async function getTop10HltvPlayers() {
    return await fetch(chrome.runtime.getURL('../resources/defaultTop10HltvPlayers.json')).then(response => { return response.json() });
}