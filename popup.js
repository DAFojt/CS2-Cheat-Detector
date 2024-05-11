// Chrome bug. https://stackoverflow.com/questions/66406672/how-do-i-import-scripts-into-a-service-worker-using-chrome-extension-manifest-ve

document.onreadystatechange = () => {
    if (document.readyState === "complete") {
        run();
    }
}

function run() {
    document.getElementById("showAllSpraysCheckbox").addEventListener("click", showAllSpraysChanged);
    document.getElementById("cheaterPercentageAtTheTopCheckbox").addEventListener("click", cheaterPercentageAtTheTopChanged);
    document.getElementById("fancyAnimationsCheckbox").addEventListener("click", fancyAnimationsChanged);
    document.getElementById("suspiciousPointsCustomOrderCheckbox").addEventListener("click", suspiciousPointsCustomOrderChanged);
    document.getElementById("top10hltvCustomCheckbox").addEventListener("click", top10hltvCustomChanged);

    document.getElementById("suspiciousPointsCustomOrderSaveButton").addEventListener("click", suspiciousPointsCustomOrderSaveClick);
    document.getElementById("top10hltvCustomSaveButton").addEventListener("click", top10hltvCustomSaveClick);

    const settings = new Settings();
    console.log('settings', settings)
    settings.extensionSettings.then(es => {
        console.log(es);
        document.getElementById("showAllSpraysCheckbox").checked = es.showAllSpraysEnabled;
        document.getElementById("cheaterPercentageAtTheTopCheckbox").checked = es.cheaterPercentageAtTheTopEnabled;
        document.getElementById("fancyAnimationsCheckbox").checked = es.fancyAnimationsEnabled;
        document.getElementById("suspiciousPointsCustomOrderCheckbox").checked = es.suspiciousPointsCustomOrderEnabled;
        document.getElementById("top10hltvCustomCheckbox").checked = es.top10hltvCustomEnabled;
        document.getElementById("suspiciousPointsCustomOrderEditable").hidden = !es.suspiciousPointsCustomOrderEnabled;
        document.getElementById("top10hltvCustomEditable").hidden = !es.top10hltvCustomEnabled;
        document.getElementById("top10hltvCustomTextArea").value = JSON.stringify(es.top10hltvPlayers);
    })
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

function suspiciousPointsCustomOrderSaveClick() {

}

function top10hltvCustomSaveClick() {
    console.log('clicked');
    let top10hltvPlayers = JSON.parse(document.getElementById("top10hltvCustomTextArea").value);
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        console.log('area parsed', top10hltvPlayers)
        st.top10hltvPlayers = top10hltvPlayers;
        settings.saveSettings();
    });
}



// to do use dedicated scripts instead of this, after finding a way to do it for a popup in manifest v3
class Settings {
    defaultSettings = {
        showAllSpraysEnabled: false,
        cheaterPercentageAtTheTopEnabled: false,
        fancyAnimationsEnabled: true,
        minMatchesCount: 10,
        maxMatchesCount: 60
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
}

async function getTop10HltvPlayers() {
    return await fetch(chrome.runtime.getURL('data/top10HltvPlayers.json')).then(response => { return response.json() });
}

function setCache(key, data) {
    let obj = {};
    obj[key] = JSON.stringify(data);

    chrome.storage.local.set(obj).then(() => console.info("Data cached"));
}

async function getCache(key) {
    return chrome.storage.local.get([key]).then((result) => {
        if (result[key] === undefined) {
            return null;
        } else {
            return JSON.parse(result[key]);
        }
    });
}