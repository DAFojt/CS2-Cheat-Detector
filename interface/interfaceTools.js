try {
    importScripts('cache.js');
  } catch (e) {
}

async function createTabWithContent(tabName, notificationsCount) {
    const className = tabName.replaceAll(' ', '-').toLowerCase();
    const tab = document.createElement('div');
    tab.className = ('cheat-detector ' + className);

    const tabContent = document.createElement('div');
    tabContent.className = (className + '-content');
    
    const tittleBox = document.createElement('div');
    tittleBox.className = 'box';

    const h3 = document.createElement('h3');
    h3.textContent = notificationsCount > 0 ? `${tabName} (${notificationsCount})` : tabName;

    tittleBox.appendChild(h3);
    tab.appendChild(tittleBox);
    tab.appendChild(tabContent);

    await getCache(tabContent.className).then(v => {
        tabContent.hidden = v;

        let showHide = document.createElement('img');
        showHide.className = 'show-hide-img-button';
        showHide.id = ('show-hide-' + tabContent.className);
        showHide.src = chrome.runtime.getURL('../resources/images/eye' + (v ? '-off' : '') + '.svg');
        showHide.onclick = () => hideTabContent(tabContent.className, showHide.id);
        tittleBox.appendChild(showHide);
    });
    return {tab, tabContent};
}

function hideTabContent(contentClassName, imgId) {
    const element = document.getElementsByClassName(contentClassName)[0]
    let hidden = element.hidden;
    element.hidden = !hidden;
    document.getElementById(imgId).src = chrome.runtime.getURL('../resources/images/eye' + (!hidden ? '-off' : '') + '.svg');
    setCache(contentClassName, !hidden);
}

function addTextFancy(element, line, startDelay = 0, charDelay = 50, additionalLineStartDelay = 0) {
    setTimeout(function() {
        for(let i = 0; i < line.length; i++){
            setTimeout(function(){
                element.value += line[i];
                element.click();
            }, i * charDelay);
        }
    }, startDelay + additionalLineStartDelay);
    
    return charDelay * line.length + additionalLineStartDelay;
}

function addTextLineAfterDelay(element, line, startDelay = 0, delay = 500) {
    setTimeout(function(){        
        element.value += line;
        element.click();
    }, startDelay + delay);
    return delay;
}

function newLine(element, startDelay, lines = 1) {
    setTimeout(function(){        
        for(let i = 0; i < lines; i++) element.value += '\n';
    }, startDelay);
}