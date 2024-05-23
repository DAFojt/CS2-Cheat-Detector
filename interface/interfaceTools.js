try {
    importScripts('storageProvider.js');
  } catch (e) {
}

class InterfaceTools{
    static async createTabWithContent(tabName, notificationsCount) {
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
    
        await StorageProvider.get(tabContent.className).then(v => {
            tabContent.hidden = v;
    
            let showHide = document.createElement('img');
            showHide.className = 'show-hide-img-button';
            showHide.id = ('show-hide-' + tabContent.className);
            showHide.src = chrome.runtime.getURL('../resources/images/eye' + (tabContent.hidden ? '-off' : '-on') + '.svg');
            showHide.onclick = () => this.showHideTabContent(tabContent.className, showHide.id);
            tittleBox.appendChild(showHide);
        });
        return {tab, tabContent};
    }

    static showHideTabContent(contentClassName, imgId) {
        const element = document.getElementsByClassName(contentClassName)[0]
        let hidden = element.hidden;
        element.hidden = !hidden;
        document.getElementById(imgId).src = chrome.runtime.getURL('../resources/images/eye' + (element.hidden ? '-off' : '-on') + '.svg');
        StorageProvider.set(contentClassName, element.hidden);
    }
}

class ElementTextTools {
    static addTextFancy(element, line, startDelay = 0, charDelay = 50, additionalLineStartDelay = 0) {
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
    
    static addTextLineAfterDelay(element, line, startDelay = 0, delay = 500) {
        setTimeout(function(){        
            element.value += line;
            element.click();
        }, startDelay + delay);
        return delay;
    }
    
    static newLine(element, startDelay, lines = 1) {
        setTimeout(function(){        
            for(let i = 0; i < lines; i++) element.value += '\n';
        }, startDelay);
    }
}