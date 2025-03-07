//steam cors bypass
chrome.runtime.onMessage.addListener(function (message, sender, senderResponse) {
    if (message.type === "getFaceitPlayerData") {
      if(!message.faceitNickname)
        senderResponse(null);
      getPlayerFaceitData(message.faceitNickname).then(res => senderResponse(res?.payload));
    }
    return true
  });

  async function getPlayerFaceitData(faceitNickname) {
    return await fetch(`https://www.faceit.com/api/users/v1/nicknames/${faceitNickname}`).then(res => res.json()).catch(err => { console.info(err); throw err; }).finally(() => console.info('Player Faceit API called'));
}