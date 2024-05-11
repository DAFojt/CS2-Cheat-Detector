document.onreadystatechange = () => {
    if (document.readyState === "complete") {
        run();
    }
}

function run() {
    document.getElementById("showAllSpraysCheckbox").addEventListener("click", showAllSpraysChanged);
    document.getElementById("cheaterPercentageAtTheTopCheckbox").addEventListener("click", cheaterPercentageAtTheTopChanged);
    document.getElementById("fancyAnimationsCheckbox").addEventListener("click", fancyAnimationsChanged);
    //document.getElementById("suspiciousPointsCustomOrderCheckbox").addEventListener("click", suspiciousPointsCustomOrderChanged);
    document.getElementById("top10hltvCustomCheckbox").addEventListener("click", top10hltvCustomChanged);
    document.getElementById("accuracyOverallCheckbox").addEventListener("click", accuracyOverallChanged);
    document.getElementById("instantCommentCheckbox").addEventListener("click", instantCommentChanged);
    document.getElementById("happyGabenCheckbox").addEventListener("click", happyGabenChanged);


    //document.getElementById("suspiciousPointsCustomOrderSaveButton").addEventListener("click", suspiciousPointsCustomOrderSaveOnClick);
    document.getElementById("top10hltvCustomSaveButton").addEventListener("click", top10hltvCustomSaveOnClick);

    document.getElementById("resetSettingsButton").addEventListener("click", resetSettingsOnClick);

    const settings = new Settings();
    settings.extensionSettings.then(es => {
        document.getElementById("showAllSpraysCheckbox").checked = es.showAllSpraysEnabled;
        document.getElementById("cheaterPercentageAtTheTopCheckbox").checked = es.cheaterPercentageAtTheTopEnabled;
        document.getElementById("fancyAnimationsCheckbox").checked = es.fancyAnimationsEnabled;
        //document.getElementById("suspiciousPointsCustomOrderCheckbox").checked = es.suspiciousPointsCustomOrderEnabled;
        document.getElementById("top10hltvCustomCheckbox").checked = es.top10hltvCustomEnabled;
        document.getElementById("accuracyOverallCheckbox").checked = es.accuracyOverallEnabled;
        document.getElementById("instantCommentCheckbox").checked = es.instantCommentEnabled;
        document.getElementById("happyGabenCheckbox").checked = es.showHappyGabenForEachNewObvCheaterEnabled;

        //document.getElementById("suspiciousPointsCustomOrderEditable").hidden = !es.suspiciousPointsCustomOrderEnabled;
        document.getElementById("top10hltvCustomEditable").hidden = !es.top10hltvCustomEnabled;
        document.getElementById("top10hltvCustomTextArea").value = JSON.stringify(es.top10hltvPlayers);
    })

    getCache('caughtCheaters').then(cc => {
        const pc80CheatersTd = document.getElementById("cheaters80percent");
        const pc100CheatersTd = document.getElementById("cheaters100percent");
        const statsTable = document.getElementById('statsTable');

        const pc80Cheaters = cc?.filter(c => c.cheaterPercentage >= 80 && c.cheaterPercentage < 100);
        const pc100Cheaters = cc?.filter(c => c.cheaterPercentage === 100);

        console.log(pc80Cheaters, pc100Cheaters);
        pc80CheatersTd.textContent = pc80Cheaters?.length ?? 0;
        pc100CheatersTd.textContent = pc100Cheaters?.length ?? 0;

        statsTable.title = 'Steam ids:\n80%-99%:\n' + (pc80Cheaters?.length > 0 ? pc80Cheaters.map(c => c.steam64Id).join('\n') : '-') + '\n100%:\n' + (pc100Cheaters?.length > 0 ? pc100Cheaters.map(c => c.steam64Id).join('\n') : '-');
        if((pc100Cheaters?.length ?? 0) > 0)
            document.getElementById('hiddenOptions').hidden = false;
    });
}

function showAllSpraysChanged() {
    let v = document.getElementById("showAllSpraysCheckbox").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.showAllSpraysEnabled = v;
        settings.saveSettings();
    });
}

function cheaterPercentageAtTheTopChanged() {
    let v = document.getElementById("cheaterPercentageAtTheTopCheckbox").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.cheaterPercentageAtTheTopEnabled = v;
        settings.saveSettings();
    });
}

function fancyAnimationsChanged() {
    let v = document.getElementById("fancyAnimationsCheckbox").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.fancyAnimationsEnabled = v;
        settings.saveSettings();
    });
}

function accuracyOverallChanged() {
    let v = document.getElementById("accuracyOverallCheckbox").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.accuracyOverallEnabled = v;
        settings.saveSettings();
    });
}

function suspiciousPointsCustomOrderChanged() {
    let v = document.getElementById("suspiciousPointsCustomOrderCheckbox").checked;
    document.getElementById("suspiciousPointsCustomOrderEditable").hidden = !v;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.suspiciousPointsCustomOrderEnabled = v;
        settings.saveSettings();
    });
}

function top10hltvCustomChanged() {
    let v = document.getElementById("top10hltvCustomCheckbox").checked;
    document.getElementById("top10hltvCustomEditable").hidden = !v;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.top10hltvCustomEnabled = v;
        settings.saveSettings();
    });
}

function instantCommentChanged() {
    let v = document.getElementById("instantCommentCheckbox").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.instantCommentEnabled = v;
        settings.saveSettings();
    });
}

function happyGabenChanged() {
    let v = document.getElementById("happyGabenCheckbox").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.showHappyGabenForEachNewObvCheaterEnabled = v;
        settings.saveSettings();
    });
}
function suspiciousPointsCustomOrderSaveOnClick() {

}

function top10hltvCustomSaveOnClick() {
    const error = document.getElementById("top10hltvCustomError");
    try {
        let top10hltvPlayers;
        top10hltvPlayers = JSON.parse(document.getElementById("top10hltvCustomTextArea").value);
        if (top10hltvPlayers.length > 10)
            throw 'Maximum number of top players: 10. Remove excessive records before saving.';
        var reg = /^\d+$/;
        top10hltvPlayers.forEach(element => {
            if (element.steam64Id.length != 17 || !reg.test(element.steam64Id))
                throw 'Wrong steam ID for ' + element.nickname;
        });
        let settings = new Settings();
        settings.extensionSettings.then((st) => {
            st.top10hltvPlayers = top10hltvPlayers;
            settings.saveSettings();
            error.value = '';
            error.hidden = true;
            setCache('recalculateData', true);
        });
    } catch (e) {
        console.error(e);
        error.textContent = e;
        error.hidden = false;
    }
}

function resetSettingsOnClick() {
    let settings = new Settings();
    settings.resetSettings();
    window.close();
}



// to do use dedicated scripts instead of this, after finding a way to do it for a popup in manifest v3
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
        this.extensionSettings.then(st => {
            setCache('extensionSettings', st);
        })
    }

    resetSettings() {
        setCache('extensionSettings', this.defaultSettings);
        setCache('recalculateData', true);
        console.info('All settings reseted');
    }
}

async function getTop10HltvPlayers() {
    return await fetch(chrome.runtime.getURL('data/top10HltvPlayers.json')).then(response => { return response.json() });
}

function setCache(key, data) {
    let obj = {};
    obj[key] = JSON.stringify(data);

    chrome.storage.local.set(obj)
        .then(() => console.info("Data " + key + " cached"))
        .catch(e => console.error("Error while trying to cache data: " + key + " Error: " + e));
}

async function getCache(key) {
    return chrome.storage.local.get([key])
        .then((result) => {
            if (result[key] === undefined) {
                return null;
            } else {
                return JSON.parse(result[key]);
            }
        })
        .catch(e => console.error("Error while trying to get cache data: " + key + " Error: " + e));;
}

function removeCache(key) {
    chrome.storage.local.remove([key])
        .then(() => console.infp("Data " + key + " removed from cache"))
        .catch(e => console.error("Error while trying to remove cache data: " + key + " Error: " + e));
}