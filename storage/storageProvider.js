class StorageProvider {
    static set(key, data) {
        let obj = {};
        obj[key] = JSON.stringify(data);
    
        chrome.storage.local.set(obj)
            .then(() => console.info("Data " + key + " stored"))
            .catch(e => console.error("Error while trying to store data: " + key + " Error: " + e));
    }
    
    static async get(key) {
        return chrome.storage.local.get([key])
            .then((result) => {
                if (result[key] === undefined) {
                    return null;
                } else {
                    return JSON.parse(result[key]);
                }
            })
            .catch(e => console.error("Error while trying to get storage data: " + key + " Error: " + e));;
    }
    
    static remove(key) {
        chrome.storage.local.remove([key])
            .then(() => console.info("Data " + key + " removed from storage"))
            .catch(e => console.error("Error while trying to remove storage data: " + key + " Error: " + e));
    }
}
