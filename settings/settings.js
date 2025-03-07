try {
    importScripts('storageProvider.js, repository.js');
  } catch (e) {
}

class Settings {
    defaultSettings = {
        showAllSpraysEnabled: false,
        cheaterPercentageAtTheTopEnabled: true,
        fancyAnimationsEnabled: true,
        minMatchesCount: 10,
        maxMatchesCount: 60,
        min10matchesDisabled: false,
        accuracyOverallEnabled: false,
        showHappyGabenForEachNewObvCheaterEnabled: false,
    }

    constructor() {
        this.extensionSettings = StorageProvider.get('extensionSettings').then(s => s ? s : this.defaultSettings).then(async s => {
            if (!s.top10hltvPlayers)
                s.top10hltvPlayers = await PlayerRepository.getDefaultTop10HltvPlayers();
            return s;
        });
    }

    saveSettings() {
        this.extensionSettings.then(es => {
            StorageProvider.set('extensionSettings', es);
        })
    }

    resetSettings() {
        StorageProvider.set('extensionSettings', this.defaultSettings);
        StorageProvider.set('recalculateData', true);
        console.info('All settings reseted');
    }
}