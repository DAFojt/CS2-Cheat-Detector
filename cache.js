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