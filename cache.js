function setCache(key, data) {
    let obj = {};
    obj[key] = JSON.stringify(data);

    chrome.storage.local.set(obj).then(() => console.info("Data " + key + " cached")).catch(e => console.error("Error while trying to cache data: " + key + " Error: " + e));
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

function removeCache(key) {
    chrome.storage.local.remove([key]).then(() => console.log("Data " + key + " removed from cache"))
}