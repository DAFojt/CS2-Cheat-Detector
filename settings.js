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
        accuracyOverallEnabled: true
    }

    constructor() {
        this.extensionSettings = getCache('extensionSettings').then(s => s ? s : this.defaultSettings).then(async s => {
            if(!s.top10hltvPlayers)
                s.top10hltvPlayers = await getTop10HltvPlayers();
            return s;
        });
    }

    saveSettings() {
        this.extensionSettings.then(st => {
            setCache('extensionSettings', st);
        })
    }

    resetSettings() {
        setCache('extensionSettings', this.defaultSettings);
    }
}

async function getTop10HltvPlayers() {
    return await fetch(chrome.runtime.getURL('data/top10HltvPlayers.json')).then(response => { return response.json() });
}