document.onreadystatechange = () => {
    if (document.readyState === "complete") {
        run();
    }
}

function run() {
    addEventListeners();

    const settings = new Settings();
    settings.extensionSettings.then(es => {
        initValues(es);
        StorageProvider.get('caughtCheaters').then(cc => {
            initAchivementsTab(cc, es);
        });
    })
}

function initAchivementsTab(cheaters, settings) {
    const pc80CheatersTd = document.getElementById("cheaters80percent");
    const pc95CheatersTd = document.getElementById("cheaters95percent");
    const pc100CheatersTd = document.getElementById("cheaters100percent");
    const statsTable = document.getElementById('statsTable');

    const pc80Cheaters = cheaters?.filter(c => c.cheaterPercentage >= 80 && c.cheaterPercentage < 95);
    const pc95Cheaters = cheaters?.filter(c => c.cheaterPercentage >= 95 && c.cheaterPercentage < 100);
    const pc100Cheaters = cheaters?.filter(c => c.cheaterPercentage === 100);

    pc80CheatersTd.textContent = pc80Cheaters?.length ?? 0;
    pc95CheatersTd.textContent = pc95Cheaters?.length ?? 0;
    pc100CheatersTd.textContent = pc100Cheaters?.length ?? 0;

    statsTable.title = 'Steam ids:\n80%-94%:\n' + (pc80Cheaters?.length > 0 ? pc80Cheaters.map(c => c.steam64Id).join('\n') : '-') + '\n95-99%:\n' + (pc95Cheaters?.length > 0 ? pc95Cheaters.map(c => c.steam64Id).join('\n') : '-') + '\n100%:\n' + (pc100Cheaters?.length > 0 ? pc100Cheaters.map(c => c.steam64Id).join('\n') : '-');
    if ((pc100Cheaters?.length ?? 0) > 0)
        document.getElementById('hiddenOptions').hidden = false;


    //if (settings.expandCheatersTable) {
        // pc80Cheaters.forEach(pc80 => {
        //     let row = statsTable.insertRow(1);
        //     let cell1 = row.insertCell(0);
        //     let cell2 = row.insertCell(1);
        //     let link = document.createElement('a');
        //     link.text = 'Profile';
        //     link.href = 'https://steamcommunity.com/profiles/' + pc80.steam64Id;
        //     cell1.textContent = pc80.steam64Id;
        //     cell2.appendChild(link);
        // });
        // pc95Cheaters.forEach(pc95 => {
        //     let row = statsTable.insertRow(2 + pc80Cheaters.length);
        //     let cell1 = row.insertCell(0);
        //     let cell2 = row.insertCell(1);
        //     let link = document.createElement('a');
        //     link.text = 'Profile';
        //     link.href = 'https://steamcommunity.com/profiles/' + pc95.steam64Id;
        //     cell1.textContent = pc95.steam64Id;
        //     cell2.appendChild(link);
        // });
        // pc100Cheaters.forEach(pc100 => {
        //     let row = statsTable.insertRow(2 + pc95Cheaters.length + 2 + pc80Cheaters.length);
        //     let cell1 = row.insertCell(0);
        //     let cell2 = row.insertCell(1);
        //     let link = document.createElement('a');
        //     link.text = 'Profile';
        //     link.href = 'https://steamcommunity.com/profiles/' + pc100.steam64Id;
        //     cell1.textContent = pc100.steam64Id;
        //     cell2.appendChild(link);
        // });
    //}
}

function initValues(es) {
    document.getElementById("showAllSpraysCheckbox").checked = es.showAllSpraysEnabled;
    document.getElementById("cheaterPercentageAtTheTopCheckbox").checked = es.cheaterPercentageAtTheTopEnabled;
    document.getElementById("fancyAnimationsCheckbox").checked = es.fancyAnimationsEnabled;
    //document.getElementById("suspiciousPointsCustomOrderCheckbox").checked = es.suspiciousPointsCustomOrderEnabled;
    document.getElementById("top10hltvCustomCheckbox").checked = es.top10hltvCustomEnabled;
    document.getElementById("accuracyOverallCheckbox").checked = es.accuracyOverallEnabled;
    document.getElementById("instantCommentCheckbox").checked = es.instantCommentEnabled;
    document.getElementById("disableMin10MatchesRestrictCheckbox").checked = es.min10matchesDisabled;
    document.getElementById("happyGabenCheckbox").checked = es.showHappyGabenForEachNewObvCheaterEnabled;
    //document.getElementById("suspiciousPointsCustomOrderEditable").hidden = !es.suspiciousPointsCustomOrderEnabled;
    document.getElementById("top10hltvCustomEditable").hidden = !es.top10hltvCustomEnabled;
    document.getElementById("top10hltvCustomTextArea").value = JSON.stringify(es.top10hltvPlayers);
}

function addEventListeners() {
    document.getElementById("showAllSpraysCheckbox").addEventListener("click", showAllSpraysChanged);
    document.getElementById("cheaterPercentageAtTheTopCheckbox").addEventListener("click", cheaterPercentageAtTheTopChanged);
    document.getElementById("fancyAnimationsCheckbox").addEventListener("click", fancyAnimationsChanged);
    //document.getElementById("suspiciousPointsCustomOrderCheckbox").addEventListener("click", suspiciousPointsCustomOrderChanged);
    document.getElementById("top10hltvCustomCheckbox").addEventListener("click", top10hltvCustomChanged);
    document.getElementById("accuracyOverallCheckbox").addEventListener("click", accuracyOverallChanged);
    document.getElementById("instantCommentCheckbox").addEventListener("click", instantCommentChanged);
    document.getElementById("disableMin10MatchesRestrictCheckbox").addEventListener("click", min10MatchesRestrict);
    document.getElementById("happyGabenCheckbox").addEventListener("click", happyGabenChanged);
    //document.getElementById("suspiciousPointsCustomOrderSaveButton").addEventListener("click", suspiciousPointsCustomOrderSaveOnClick);
    document.getElementById("top10hltvCustomSaveButton").addEventListener("click", top10hltvCustomSaveOnClick);
    document.getElementById("resetSettingsButton").addEventListener("click", resetSettingsOnClick);
}

async function showAllSpraysChanged() {
    let v = document.getElementById("showAllSpraysCheckbox").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.showAllSpraysEnabled = v;
        settings.saveSettings();
        showConfirmationText();
    });
}

function cheaterPercentageAtTheTopChanged() {
    let v = document.getElementById("cheaterPercentageAtTheTopCheckbox").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.cheaterPercentageAtTheTopEnabled = v;
        settings.saveSettings();
        showConfirmationText();
    });
}

function fancyAnimationsChanged() {
    let v = document.getElementById("fancyAnimationsCheckbox").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.fancyAnimationsEnabled = v;
        settings.saveSettings();
        showConfirmationText();
    });
}

function accuracyOverallChanged() {
    let v = document.getElementById("accuracyOverallCheckbox").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.accuracyOverallEnabled = v;
        settings.saveSettings();
        showConfirmationText();
    });
}

function suspiciousPointsCustomOrderChanged() {
    let v = document.getElementById("suspiciousPointsCustomOrderCheckbox").checked;
    document.getElementById("suspiciousPointsCustomOrderEditable").hidden = !v;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.suspiciousPointsCustomOrderEnabled = v;
        settings.saveSettings();
        showConfirmationText();
    });
}

function top10hltvCustomChanged() {
    let v = document.getElementById("top10hltvCustomCheckbox").checked;
    document.getElementById("top10hltvCustomEditable").hidden = !v;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.top10hltvCustomEnabled = v;
        settings.saveSettings();
        showConfirmationText();
    });
}

function instantCommentChanged() {
    let v = document.getElementById("instantCommentCheckbox").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.instantCommentEnabled = v;
        settings.saveSettings();
        showConfirmationText();
    });
}

function min10MatchesRestrict() {
    let v = document.getElementById("disableMin10MatchesRestrictCheckbox").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.min10matchesDisabled = v;
        st.minMatchesCount = v ? 1 : 10;
        settings.saveSettings();
        showConfirmationText();
    });
}

function happyGabenChanged() {
    let v = document.getElementById("happyGabenCheckbox").checked;
    let settings = new Settings();
    settings.extensionSettings.then((st) => {
        st.showHappyGabenForEachNewObvCheaterEnabled = v;
        settings.saveSettings();
        showConfirmationText();
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
            StorageProvider.set('recalculateData', true);
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

function showConfirmationText() {
    document.getElementById('saveInfo').hidden = false;
}