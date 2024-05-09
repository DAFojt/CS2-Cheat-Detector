document.getElementById("showAllSprays").addEventListener("click", showAllSpraysChanged);
document.getElementById("cheaterPercentageAtTheTop").addEventListener("click", cheaterPercentageAtTheTopChanged);
document.getElementById("fancyAnimations").addEventListener("click", fancyAnimationsChanged);

document.onreadystatechange = () => {
    if (document.readyState === "complete") {
        run();
    }
}

function run() {
    const settings = new Settings();
    settings.extensionSettings.then(es => {
        document.getElementById("showAllSprays").checked = es.showAllSprays;
        document.getElementById("cheaterPercentageAtTheTop").checked = es.cheaterPercentageAtTheTop;
        document.getElementById("fancyAnimations").checked = es.fancyAnimations;
    })
}


function showAllSpraysChanged() {
    let v = document.getElementById("showAllSprays").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.showAllSprays = v;
        settings.saveSettings();
    });
}

function cheaterPercentageAtTheTopChanged() {
    let v = document.getElementById("cheaterPercentageAtTheTop").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.cheaterPercentageAtTheTop = v;
        settings.saveSettings();
    });
}

function fancyAnimationsChanged() {
    let v = document.getElementById("fancyAnimations").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.fancyAnimations = v;
        settings.saveSettings();
    });
}

class Settings {
    defaultSettings = {
        showAllSprays: false,
        cheaterPercentageAtTheTop: false,
        fancyAnimations: true
    }

    constructor() {
        this.extensionSettings = getCache('extensionSettings').then(s => {console.log('ds', s ? s : this.defaultSettings); return s ? s : this.defaultSettings} );
    }

    saveSettings() {
        this.extensionSettings.then(st => {
            setCache('extensionSettings', st);
        })
    }
}

function setCache(key, data) {
    let obj = {};
    obj[key] = JSON.stringify(data);

    chrome.storage.local.set(obj).then(() => console.info("Data cached", key, data));
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