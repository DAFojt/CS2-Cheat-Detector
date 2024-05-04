run();

var playerData;
var playerDetailsPromise;

var dataSource = 'all';
const maxMatchesCount = 60;
const minMatchesCount = 10;

async function run() {
    playerData = playerData ?? await getPlayerData(window.location.toString());
    if (!playerData || playerData.player.length === 0) {
        console.warn("Cheat detector: No api data");
        return;
    }

    if(!playerDetailsPromise) {
        const playerDataDetailsPromise = getPlayerDetailsData(playerData.player.steam64Id);
        playerDetailsPromise = playerDetailsPromise ?? getPlayerDetails(playerDataDetailsPromise);
    }

    const topNHltvPlayersDataPromise = getTopNHltvPlayersData();
    const skillCalculationsPromise = calculate(playerData, topNHltvPlayersDataPromise);

    createInterface(playerData, skillCalculationsPromise, playerDetailsPromise);
}

async function createInterface(playerData, skillCalculationsPromise, playerDetailsPromise) {
    let mainDiv = document.createElement('div');
    mainDiv.className = 'cheat-detector-main';

    let infoDiv = document.createElement('div');
    mainDiv.appendChild(infoDiv);

    let detailsDiv = document.createElement('div');
    mainDiv.appendChild(detailsDiv);

    let platformBansDiv = document.createElement('div');
    mainDiv.appendChild(platformBansDiv);

    let suspiciousPointsDiv = document.createElement('div');
    mainDiv.appendChild(suspiciousPointsDiv);

    let cheaterDiv = document.createElement('div');
    mainDiv.appendChild(cheaterDiv);

    let buttonsDiv = document.createElement('div');
    mainDiv.appendChild(buttonsDiv);

    let uiPromises = [
        createInfoTab(playerData).then(tab => {
            if(tab) infoDiv.appendChild(tab);
        }),
        createBannedTeammatesTab(playerDetailsPromise).then(tab => {
            if(tab) detailsDiv.appendChild(tab);
        }),
        createPlatformBansTab(playerDetailsPromise).then(tab => {
            if(tab) platformBansDiv.appendChild(tab);
        }),
        createSuspiciousTab(playerData, skillCalculationsPromise).then(tab => {
            if(tab) suspiciousPointsDiv.appendChild(tab);
        }),
        createCheaterDiv(playerData, skillCalculationsPromise).then(div => {
            if(div) cheaterDiv.appendChild(div);
        }),
        createButtonsDiv(playerData, skillCalculationsPromise).then(div => {
            if(div) buttonsDiv.appendChild(div);
        }),
    ];

    // removing ui shuttering when user changes data source
    if(isOldMainDivExist()) {
        Promise.all(uiPromises).then(() => {
            removeOldMainDiv();

            let extDiv = getExtDiv();
            extDiv.appendChild(mainDiv);
        });
    }
    else {
        let extDiv = getExtDiv();
        extDiv.appendChild(mainDiv);
    }
}

async function calculate(player, topNHltvPlayers) {
    return topNHltvPlayers.then(c => {
        const result = betterThan(player, c);
        const suspiciousPoints = getSuspiciousPoints(result.comparisons);

        let spSum = 0;
        let all = 0;
        let sp = suspiciousPoints.filter(x => x.include).sort(function(a, b){return b.points - a.points}).slice(0, Math.round(suspiciousPoints.filter(x => x.include).length / 2));
        sp.forEach(sp => {
            spSum += sp.points;
            all += sp.all;
        })
        const cheaterPercentage = result.info.matchesCount ? Math.round(sigmoidFilter(spSum / all * 100) * 100) : 0;

        return { suspiciousPoints, matchesCount: result.info.matchesCount, cheaterPercentage: cheaterPercentage }
    })
}

function sigmoidFilter(input) {
    return  1/(1+Math.pow(Math.E, (-(input/10-5))));
}

async function getPlayerDetails(playerDetailsPromise) {
    return playerDetailsPromise.then(pd => {
        return {
            bannedTeammates: pd.teammates.filter(x => x.isBanned).map(x => {
                return {
                    steam64Id: x.steam64Id,
                    steamNickname: x.steamNickname,
                    steamAvatarUrl: x.steamAvatarUrl,
                    matchesPlayedTogether: x.matchesPlayedTogether
                };
            }),
            platformBans: pd.meta.platformBans,
            faceitNickname: pd.meta.faceitNickname
        }});
}

async function getTopNHltvPlayersData() {
    const topNHltvPlayersDataFromCachePromise = getCache('topNHltvPlayersData');
    const lastCalculationsDateFromCachePromise = getCache('lastCalculationsDate');
    let dateMinusDay = new Date();
    dateMinusDay.setDate(dateMinusDay.getDate() - 1);

    return await Promise.all([topNHltvPlayersDataFromCachePromise, lastCalculationsDateFromCachePromise]).then(async cacheData => {
        if (!cacheData[0] || !cacheData[1] || new Date(cacheData[1]) < dateMinusDay) {
            const topNHltvPlayers = (await getTop10HltvPlayers()).map(x => x.steam64Id);
            const topNHltvPlayersDataFromApi = getPlayersDataFromApi(topNHltvPlayers);
            return await Promise.all(topNHltvPlayersDataFromApi).then(apiData => {
                setCache('topNHltvPlayersData', apiData);
                setCache('lastCalculationsDate', new Date());
                return apiData;
            })
        } else {
            return cacheData[0];
        }
    })
}

function getTop10HltvPlayers() {
    return fetch(chrome.runtime.getURL('data/top10HltvPlayers.json')).then(response => {return response.json()});
}

function getPlayersDataFromApi(steamIds64) {
    let topNHltvPlayersData = [];
    steamIds64.forEach(steam64Id => topNHltvPlayersData.push(getPlayerData(steam64Id)));
    return topNHltvPlayersData;
}

function getExtDiv() {
    let extDiv = document.getElementsByClassName('responsive_status_info')[0];
    if (!extDiv)
        extDiv = document.getElementsByClassName('profile_rightcol')[0];
    return extDiv;
}

function isOldMainDivExist(){
    const oldMainDiv = document.getElementsByClassName('cheat-detector-main');
    return oldMainDiv && oldMainDiv.length > 0;
}

function removeOldMainDiv() {
    const oldMainDiv = document.getElementsByClassName('cheat-detector-main');
    if (oldMainDiv) {
        while (oldMainDiv.length > 0) {
            oldMainDiv[0].parentNode.removeChild(oldMainDiv[0]);
        }
    }
}

async function createTabWithContent(tabName) {
    const className = tabName.replaceAll(' ', '-').toLowerCase();
    const tab = document.createElement('div');
    tab.className = ('cheat-detector ' + className);

    const tabContent = document.createElement('div');
    tabContent.className = (className + '-content');

    const tittleBox = document.createElement('div');
    tittleBox.className = 'box';

    const h3 = document.createElement('h3');
    h3.textContent = tabName;

    tittleBox.appendChild(h3);
    tab.appendChild(tittleBox);
    tab.appendChild(tabContent);

    await getCache(tabContent.className).then(v => {
        tabContent.hidden = v;

        let showHide = document.createElement('img');
        showHide.className = 'show-hide-img-button';
        showHide.id = ('show-hide-' + tabContent.className);
        showHide.src = chrome.runtime.getURL('images/eye' + (v ? '-off' : '') + '.svg');
        showHide.onclick = () => hideTabContent(tabContent.className, showHide.id);
        tittleBox.appendChild(showHide);
    });
    return {tab, tabContent};
}

function hideTabContent(contentClassName, imgId) {
    let hidden = document.getElementsByClassName(contentClassName)[0].hidden;
    document.getElementsByClassName(contentClassName)[0].hidden = !hidden;
    document.getElementById(imgId).src = chrome.runtime.getURL('images/eye' + (!hidden ? '-off' : '') + '.svg');
    setCache(contentClassName, !hidden);
}

async function createInfoTab(player) {
    if(!player?.player || player.player.length === 0)
        return;

    let {tab, tabContent} = await createTabWithContent('Player info');

    let faceitDiv = document.createElement('div');
    faceitDiv.className = 'box';
    let text = document.createElement('p');
    text.textContent = 'Faceit highest rank: ' + (player.player.highestRanks.faceit ? '' : '-');
    faceitDiv.appendChild(text);
    if(player.player.highestRanks.faceit && player.player.highestRanks.faceit > 0) {
        const faceitImg = document.createElement('img');
        faceitImg.src = chrome.runtime.getURL('images/faceit/faceit' + player.player.highestRanks.faceit + '.svg');
        faceitImg.style.maxWidth = '10%';
        faceitImg.style.height = 'auto';
        faceitDiv.appendChild(faceitImg);
    }
    tabContent.appendChild(faceitDiv);

    let premierDiv = document.createElement('div');
    premierDiv.className = 'box';
    text = document.createElement('p');
    text.textContent = 'Premier highest rank:';
    premierDiv.appendChild(text);
    text = document.createElement('p');
    text.textContent = player.player.highestRanks.matchmaking > 18 ? player.player.highestRanks.matchmaking : '-';
    text.style.maxWidth = '15%';
    premierDiv.appendChild(text);
    tabContent.appendChild(premierDiv);

    faceitDiv = document.createElement('div');
    faceitDiv.className = 'box';
    const inneriP = document.createElement('p');
    inneriP.textContent = 'Faceit current rank: ' + (player.player.currentRanks.faceit ? '' : '-');
    faceitDiv.appendChild(inneriP);
    if(player.player.highestRanks.faceit && player.player.currentRanks.faceit > 0) {
        let faceitImg = document.createElement('img');
        faceitImg.src = chrome.runtime.getURL('images/faceit/faceit' + player.player.currentRanks.faceit + '.svg');
        faceitImg.style.maxWidth = '10%';
        faceitImg.style.height = 'auto';
        faceitDiv.appendChild(faceitImg);
    }
    tabContent.appendChild(faceitDiv);

    premierDiv = document.createElement('div');
    premierDiv.className = 'box';
    text = document.createElement('p');
    text.textContent = 'Premier current rank:';
    premierDiv.appendChild(text);
    text = document.createElement('p');
    text.textContent = player.player.currentRanks.matchmaking > 18 ? player.player.currentRanks.matchmaking : '-';
    text.style.maxWidth = '15%';
    premierDiv.appendChild(text);
    tabContent.appendChild(premierDiv);
    tab.appendChild(tabContent);
    return tab;
}

async function createBannedTeammatesTab(detailsPromise) {
    return detailsPromise.then(async detailsData => {
        if(!detailsData || detailsData.bannedTeammates.length === 0)
            return;

        const {tab, tabContent} = await createTabWithContent('Banned teammates (' + detailsData.bannedTeammates.length + ')');

        const bannedTeammatesDiv = document.createElement('div');
        bannedTeammatesDiv.className = 'profile_topfriends profile_count_link_preview';
        for(const bannedTeammate of detailsData.bannedTeammates) {
            const bannedRow = document.createElement('div');
            bannedRow.className = 'friendBlock persona offline';
            bannedRow['data-panel'] = '{"flow-children":"column"}';
            const friendBlockLinkOverlay = document.createElement('a');
            friendBlockLinkOverlay.className = 'friendBlockLinkOverlay';
            friendBlockLinkOverlay.href = 'https://steamcommunity.com/profiles/' + bannedTeammate.steam64Id;

            const playerAvatar = document.createElement('div');
            playerAvatar.className = 'playerAvatar offline';
            const avatarImg = document.createElement('img');
            avatarImg.src = bannedTeammate.steamAvatarUrl;
            playerAvatar.appendChild(avatarImg);

            const friendBlockContent = document.createElement('div');
            friendBlockContent.textContent = bannedTeammate.steamNickname;
            const br = document.createElement('br');
            const friendSmallText = document.createElement('span');
            friendSmallText.textContent = 'Matches played together: ' + bannedTeammate.matchesPlayedTogether;
            friendBlockContent.appendChild(br);
            friendBlockContent.appendChild(friendSmallText);

            friendBlockLinkOverlay.appendChild(playerAvatar);
            bannedRow.appendChild(playerAvatar);
            bannedRow.appendChild(friendBlockContent);
            bannedRow.appendChild(friendBlockLinkOverlay);
            bannedTeammatesDiv.appendChild(bannedRow);
        }

        tabContent.appendChild(bannedTeammatesDiv);
        return tab;
    })
}

async function createPlatformBansTab(detailsPromise) {
    return detailsPromise.then(async detailsData => {
        if(!detailsData || !detailsData.platformBans || detailsData.platformBans.length <= 1)
            return;

        const {tab, tabContent} = await createTabWithContent('Bans (' + detailsData.platformBans.length + ')');

        for(const platform of detailsData.platformBans.filter(x => x !== 'matchmaking')) {
            const row = document.createElement('a');
            // row.href = 'https://www.faceit.com/en/players/' + details.faceitNickname; //to do
            const img = document.createElement('img');
            img.title = platform;
            img.src = chrome.runtime.getURL('images/platform-logo/' + platform + '.png');
            img.className = 'badge_icon small';

            row.appendChild(img);
            tabContent.appendChild(row);
        }

        return tab;
    })
}

async function createSuspiciousTab(player, skillCalculationsPromise) {
    return skillCalculationsPromise.then(async skillCalculations => {
        const matchesCount = skillCalculations.matchesCount;
        const suspiciousPoints = skillCalculations.suspiciousPoints;
        const { tab, tabContent } = await createTabWithContent('Suspicious points');
        const top10HltvPlayers = await getTop10HltvPlayers();
        if (player.games.some(g => g.dataSource === 'hltv')) {
            return;
        }
        else if(matchesCount > 10) {
            suspiciousPoints.forEach(sp => {
                const innerDiv =  document.createElement('div');
                const innerP = document.createElement('p');
                innerP.className = 'cheat-detector-paragraph';
                innerP.textContent = sp.name + ': ' + sp.points + "/" + sp.all + " (" + sp.suspiciousBehaviour + ")";
                innerDiv.appendChild(innerP)

                const percent = sp.all / 100 * sp.points * 100;
                const innerPb = document.createElement('div');
                innerPb.className = 'progress_bar';
                innerPb.style.width = percent + '%';

                if(sp.include) {
                    if(percent < 40)
                        innerPb.style.background = 'linear-gradient(180deg, rgba(255, 255, 255, .3) 0%, rgb(0 200 0) 80%)';
                    else if(percent >= 40 && percent < 70)
                        innerPb.style.background = 'linear-gradient(180deg, rgba(255, 255, 255, .3) 0%, rgb(200 200 0) 80%)';
                    else if(percent >= 70)
                        innerPb.style.background = 'linear-gradient(180deg, rgba(255, 255, 255, .3) 0%, rgb(200 0 0) 80%)';
                } else {
                    innerPb.style.background = 'linear-gradient(180deg, rgba(255, 255, 255, .3) 0%, rgb(0 0 120) 80%)';
                }
                
                const innerAPb = document.createElement('div');
                innerAPb.className = 'achievement_progress_bar_ctn';
                innerAPb.style.width = '97%';
                innerDiv.title = 'Better ' + sp.name.toLowerCase() + ' than ' + sp.points + ' of TOP ' + sp.all +' HLTV players' + (sp.points > 0 ? '\nBetter than:' + sp.betterThan.map(bt => {
                    hltvPlayerNickname = top10HltvPlayers.find(t => t.steam64Id === bt.enemySteamId64).nickname;
                    return '\n' + hltvPlayerNickname + ' ' + bt.enemyValue + bt.unit + ' vs ' + bt.playerValue + bt.unit;
                }) : '');
                if(!sp.include) {
                    innerDiv.title += '\nThis statistic is not included in cheater percentage calculations';
                }
                innerAPb.appendChild(innerPb);
                innerDiv.appendChild(innerAPb);
                tabContent.appendChild(innerDiv);
            })
            const innerP = document.createElement('p');
            innerP.textContent = 'Source data: ' + dataSource + ', Matches: ' + matchesCount;
            innerP.style.textAlign = 'center';
            tabContent.appendChild(innerP);
            return tab;
        }
        else {
            return;
        }
    })
}

async function createCheaterDiv(player, skillCalculationsPromise) {
    return skillCalculationsPromise.then(v => {
        const matchesCount = v.matchesCount;
        const cheaterPercentage = v.cheaterPercentage > 1 ? v.cheaterPercentage : 0;
        const isHltvPlayer = player.games.some(g => g.dataSource === 'hltv');
        const cheaterInfoTextElement = document.createElement((cheaterPercentage < 50 || isHltvPlayer) ? 'h2' : 'h1');
        cheaterInfoTextElement.className = 'cheat-percentage-value';
        cheaterInfoTextElement.textContent = 'Cheater ' + cheaterPercentage + '%';

        if(matchesCount > minMatchesCount) {
            let cheaterDiv = document.createElement('div');
            cheaterDiv.className = 'cheat-detector cheat-percentage-div'
            
            if (isHltvPlayer) {
                cheaterInfoTextElement.textContent = 'HLTV PRO';
            }
            else if (cheaterPercentage < 50) {
                cheaterInfoTextElement.classList.add('cheat-percentage-low');
            }
            else if(cheaterPercentage >= 50 && cheaterPercentage < 80) {
                cheaterInfoTextElement.classList.add('cheat-percentage-mid');
            }
            else if(cheaterPercentage >= 80) {
                cheaterInfoTextElement.classList.add('cheat-percentage-high');
            }
            cheaterDiv.appendChild(cheaterInfoTextElement);

            cheaterDiv.title = 'Algorithm:\nTake the top half of the statistics\nCalculate the average score\nPass through a sigmoid filter'
            return cheaterDiv;

        }
        else {
            let h2 = document.createElement('h2');
            h2.textContent = 'Not enough data';
            h2.style.textAlign = 'center';
            return h2;
        }
    })
}

async function createButtonsDiv(player, skillCalculationsPromise) {
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.marginTop = '5px';

    const buttonsDiv1 = document.createElement('div');
    buttonsDiv1.className = 'cheat-detector-buttons center'

    const buttonSwitchDataSource = createSwitchButton();
    buttonsDiv1.appendChild(buttonSwitchDataSource);
    const buttonComment = createCommentButton(player, skillCalculationsPromise);
    buttonsDiv1.appendChild(buttonComment);
    const buttonLeetify = createLeetifyButton(player);
    buttonsDiv1.appendChild(buttonLeetify);
    buttonsDiv.appendChild(buttonsDiv1);

    const buttonsDiv2 = document.createElement('div');
    buttonsDiv2.className = 'cheat-detector-buttons center'
    buttonsDiv2.style.marginTop = '3px';

    const allButton = createSwitchButton('All');
    buttonsDiv2.appendChild(allButton);
    const premierButton = createSwitchButton('Premier');
    buttonsDiv2.appendChild(premierButton);
    const faceitButton = createSwitchButton('Faceit');
    buttonsDiv2.appendChild(faceitButton);
    const wingmanButton = createSwitchButton('Wingman');
    buttonsDiv2.appendChild(wingmanButton);
    const premierWgmButton = createSwitchButton('Premier+Wgm');
    buttonsDiv2.appendChild(premierWgmButton);
    buttonsDiv.appendChild(buttonsDiv2);

    if (player.games.some(g => g.dataSource === 'hltv')) {
        buttonSwitchDataSource.disabled = true;
        buttonComment.disabled = true;
        allButton.disabled = true;
        premierButton.disabled = true;
        faceitButton.disabled = true;
        wingmanButton.disabled = true;
        premierWgmButton.disabled = true;
    }

    return buttonsDiv;
}

function createCommentButton(player, skillCalculationsPromise) {
    const commentButton = document.createElement('button');
    commentButton.innerText = 'Add comment';
    commentButton.className = 'btn_green_white_innerfade btn_large';
    const steamCommentArea = document.getElementsByClassName('commentthread_textarea')[0];
    const steamCommentButton = document.getElementById('commentthread_Profile_'+player.player.steam64Id+'_submit');

    skillCalculationsPromise.then(async scp => {
        if(!steamCommentArea || !steamCommentButton || scp.cheaterPercentage < 70 || scp.matchesCount < minMatchesCount) {
            commentButton.disabled = true;
            return commentButton;
        }

        const sp = scp.suspiciousPoints.filter(x => x.points > 0);
        let comment = [];
        const top10HltvPlayers = await getTop10HltvPlayers();
        sp.sort(function(a, b){return b.points - a.points}).forEach(x => {
            comment.push(x.name + ' ' + x.points + ' / ' + x.all + ' (' + x.suspiciousBehaviour + ')');
        })
        const betterThan = '\nBetter than:' + [... new Set(sp.flatMap(x => x.betterThan.map(z => z.enemySteamId64)))].map(x => {
            return ' ' + top10HltvPlayers.find(t => t.steam64Id === x).nickname;
        });
        commentButton.onclick = () => {
            steamCommentArea.focus();
            
            let delay = 0;
            delay += addTextFancy(steamCommentArea, 'Cheat detector audit:', delay, 50);
            newLine(steamCommentArea, delay);
            delay += addTextFancy(steamCommentArea, 'This account has better statistics than TOP ' + sp[0].all + ' HLTV players in the:', delay, 25);
            newLine(steamCommentArea, delay);
            for(let i = 0; i < comment.length; i++) {
                newLine(steamCommentArea, delay + 500);
                delay += addTextLineAfterDelay(steamCommentArea, comment[i], delay, 500);
            }
            delay += addTextLineAfterDelay(steamCommentArea, betterThan, delay, 500);
            newLine(steamCommentArea, delay, 2);
            delay += addTextFancy(steamCommentArea, 'He is '+ scp.cheaterPercentage +'% cheater, checked automatically by CS2 Cheat Detector Chrome extension', delay, 35, 500);
            newLine(steamCommentArea, delay + 500);
            delay += addTextLineAfterDelay(steamCommentArea, 'Data source: ' + dataSource + ' matches, demos analyzed: ' + scp.matchesCount, delay, 500);

            commentButton.disabled = true;
        }
    })
    return commentButton;
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

function createLeetifyButton(player) {
    const leetifyAnchor = document.createElement('a');
    leetifyAnchor.href = 'https://leetify.com/app/profile/' + player.player.steam64Id
    const leetifyButton = document.createElement('button');
    leetifyButton.innerText = '  Leetify profile  ';
    leetifyButton.className = 'btn_green_white_innerfade btn_large';
    leetifyAnchor.appendChild(leetifyButton);
    return leetifyAnchor;
}

function createSwitchButton(requestedDataSource) {
    const sourceButton = document.createElement('button');

    if(!requestedDataSource) {
        const sources = ['all', 'premier', 'faceit', 'wingman', 'premier+wgm'];
        sourceButton.innerText = 'Switch source';
        sourceButton.className = 'btn_green_white_innerfade btn_large';
        sourceButton.onclick = () => {
            const newSourceIndex = sources.indexOf(dataSource) + 1;
            if (newSourceIndex === sources.length) newSourceIndex = 0;
            dataSource = sources[newSourceIndex];
            this.run();
        }
    }
    else {
        sourceButton.innerText = requestedDataSource;
        sourceButton.className = 'btn_green_white_innerfade btn_large';
        sourceButton.onclick = () => {
            dataSource = requestedDataSource.toLowerCase();
            this.run();
        }
    }

    return sourceButton;
}

async function getPlayerData(id) {
    return fetch(`https://api.leetify.com/api/compare?friendName=${id}&period=2`).then(res => res.json()).catch(err => { console.error(err); throw err; }).finally(() => console.info('Player data API called'));
}

async function getPlayerDetailsData(id) {
    return fetch(`https://api.leetify.com/api/profile/${id}`).then(res => res.json()).catch(err => { console.error(err); throw err; }).finally(() => console.info('Player details API called'));
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

function getSuspiciousPoints(comparisonResult) {
    let suspPoints = [];
    comparisonResult.forEach(singleComparison => {
        singleComparison.stats.forEach(stats => {
            const sp = suspPoints.find(s => s.key == stats.key);
            if (sp) {
                sp.all++;
                if (stats.checkingMethod == "biggerBetter" && stats.playerValue >= stats.topNHltvPlayerValue) {
                    sp.points++;
                    sp.betterThan.push({
                        enemySteamId64: stats.hltvPlayerSteam64Id,
                        playerValue: stats.playerValue,
                        enemyValue: stats.topNHltvPlayerValue,
                        unit: stats.unit
                    });
                }
                else if (stats.checkingMethod == "smallerBetter" && stats.playerValue <= stats.topNHltvPlayerValue) {
                    sp.points++;
                    sp.betterThan.push({
                        enemySteamId64: stats.hltvPlayerSteam64Id,
                        playerValue: stats.playerValue,
                        enemyValue: stats.topNHltvPlayerValue,
                        unit: stats.unit
                    });
                }
            } else {
                let n = {
                    key: stats.key,
                    name: stats.name,
                    unit: stats.unit,
                    suspiciousBehaviour: stats.suspiciousBehaviour,
                    all: 1,
                    betterThan: [],
                    include: stats.includeInCalculations
                };

                if (stats.checkingMethod == "biggerBetter" && stats.playerValue >= stats.topNHltvPlayerValue) {
                    n.points = 1;
                    n.betterThan = [{
                        enemySteamId64: stats.hltvPlayerSteam64Id,
                        playerValue: stats.playerValue,
                        enemyValue: stats.topNHltvPlayerValue,
                        unit: stats.unit
                    }];
                }
                else if (stats.checkingMethod == "smallerBetter" && stats.playerValue <= stats.topNHltvPlayerValue) {
                    n.points = 1;
                    n.betterThan = [{
                        enemySteamId64: stats.hltvPlayerSteam64Id,
                        playerValue: stats.playerValue,
                        enemyValue: stats.topNHltvPlayerValue,
                        unit: stats.unit
                    }];
                }
                else n.points = 0;

                suspPoints.push(n);
            }
        })
    })
    return suspPoints;
}

function getCordErrorForWeapon(s, cordLimit) {
    let sum = 0;
    const nonEmptyCords = s.coords.filter(c => c.playerX !== null && c.playerY !== null);
    const limitedCords = nonEmptyCords.slice(0, cordLimit ?? nonEmptyCords.length - 1);
    for (const c of limitedCords) {
        sum += this.getCordErrorValue(c);
    }
    return {
        WeaponLabel: s.weaponLabel,
        avgError: Math.round(sum / nonEmptyCords.length * 100) / 100,
        coordsCount: nonEmptyCords.length
    };
}

function getCordErrorValue(coord) {
    return Math.sqrt(Math.pow(coord.weaponX - coord.playerX, 2) + Math.pow(coord.weaponY - coord.playerY, 2));
}

function betterThan(player, topNHltvPlayersPromise) {
    let playerComparisons = {
        comparisons: [],
        info: {}
    };
    let matches = player?.games.filter(x => x.isCs2);
    if(!matches || matches.length === 0) {
        playerComparisons.stats = [];
        playerComparisons.info.matchesCount = 0;
        return playerComparisons;
    }
    let matchesCount;
    const allMatchesCount = player?.games.filter(x => x.isCs2).length;

    topNHltvPlayersPromise.forEach(async (topNHltvPlayer) => {
        let playerComparison = {
            stats: [],
            info: {}
        };

        playerComparison.playerNickname = player.player.nickname;
        playerComparison.topNHltvPlayerNickname = topNHltvPlayer.player.nickname;
        playerComparison.sprayComparisons = [];

        topNHltvPlayer.sprays.forEach((topNHltvPlayerspray) => {
            const weaponLabel = topNHltvPlayerspray.weaponLabel;
            const playerSpray = player.sprays.find(s => s.weaponLabel === weaponLabel);
            if (!playerSpray)
                return;
            const max = playerSpray.coords.length > topNHltvPlayerspray.coords.length ? topNHltvPlayerspray.coords.length : playerSpray.coords.length;

            const playerRecoil = getCordErrorForWeapon(playerSpray, max);
            const topNHltvPlayerRecoil = getCordErrorForWeapon(topNHltvPlayerspray, max);

            playerComparison.sprayComparisons.push({
                WeaponLabel: weaponLabel,
                PlayerError: playerRecoil.avgError,
                topNHltvPlayerError: topNHltvPlayerRecoil.avgError,
                Max: max
            });
        });

        const sprayControlOverall = toValue(playerComparison.sprayComparisons.map(sc => sc.PlayerError), playerComparison.sprayComparisons.map(sc => sc.topNHltvPlayerError), false);
        const sprayControlAK = [playerComparison.sprayComparisons.find(sc => sc.WeaponLabel === 'AK-47').PlayerError, playerComparison.sprayComparisons.find(sc => sc.WeaponLabel === 'AK-47').topNHltvPlayerError];


        if (dataSource !== 'all' && dataSource !== 'premier+wgm') {
            let src = (dataSource === 'premier' ? 'matchmaking' : dataSource);
                src = (dataSource === 'wingman' ? 'matchmaking_wingman' : src);
            matches = matches.filter(m => m.dataSource === src);
        } else if (dataSource === 'premier+wgm') {
            matches = matches.filter(m => m.dataSource === 'matchmaking' || m.dataSource === 'matchmaking_wingman');
        }
        const reactionTimes = toMs(matches.map(g => g.playerStats[0].reactionTime), topNHltvPlayer.games.map(g => g.playerStats[0].reactionTime));
        const preaaim = toValue(matches.map(g => g.playerStats[0].preaim), topNHltvPlayer.games.map(g => g.playerStats[0].preaim), false);
        const accuracyEnemySpotted = toValue(matches.map(g => g.playerStats[0].accuracyEnemySpotted), topNHltvPlayer.games.map(g => g.playerStats[0].accuracyEnemySpotted), true);
        const accuracy = toValue(matches.map(g => g.playerStats[0].accuracy), topNHltvPlayer.games.map(g => g.playerStats[0].accuracy), true);
        const accuracyHead = toValue(matches.map(g => g.playerStats[0].accuracyHead), topNHltvPlayer.games.map(g => g.playerStats[0].accuracyHead), true);
        const sprayAccuracy = toValue(matches.map(g => g.playerStats[0].sprayAccuracy), topNHltvPlayer.games.map(g => g.playerStats[0].sprayAccuracy), true);
        matchesCount = matches.length;

        if(dataSource === 'all' || matchesCount === maxMatchesCount || matchesCount === allMatchesCount) {
            playerComparison.stats.push({
                key: "spray_control_ak",
                name: "Spray control AK-47",
                unit: "*",
                suspiciousBehaviour: "Norecoil",
                playerValue: sprayControlAK[0],
                topNHltvPlayerValue: sprayControlAK[1],
                hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
                checkingMethod: "smallerBetter",
                includeInCalculations: true
            });

            playerComparison.stats.push({
                key: "spray_control_overall",
                name: "Spray control overall",
                unit: "*",
                suspiciousBehaviour: "Norecoil",
                playerValue: sprayControlOverall[0],
                topNHltvPlayerValue: sprayControlOverall[1],
                hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
                checkingMethod: "smallerBetter",
                includeInCalculations: true
            });
        }

        playerComparison.stats.push({
            key: "spray_accuracy",
            name: "Spray accuracy",
            unit: "*",
            suspiciousBehaviour: "Aimbot",
            playerValue: sprayAccuracy[0],
            topNHltvPlayerValue: sprayAccuracy[1],
            hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
            checkingMethod: "biggerBetter",
            includeInCalculations: true
        });

        playerComparison.stats.push({
            key: "preaim",
            name: "Preaim",
            unit: "*",
            suspiciousBehaviour: "Wallhack",
            playerValue: preaaim[0],
            topNHltvPlayerValue: preaaim[1],
            hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
            checkingMethod: "smallerBetter",
            includeInCalculations: true
        });

        playerComparison.stats.push({
            key: "tdm",
            name: "Reaction time(TDM)",
            unit: "ms",
            suspiciousBehaviour: "Aimbot",
            playerValue: reactionTimes[0],
            topNHltvPlayerValue: reactionTimes[1],
            hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
            checkingMethod: "smallerBetter",
            includeInCalculations: true
        });

        playerComparison.stats.push({
            key: "accuracy_enemy_spotted",
            name: "Accuracy enemy spotted",
            suspiciousBehaviour: "Aimbot",
            unit: "%",
            playerValue: accuracyEnemySpotted[0],
            topNHltvPlayerValue: accuracyEnemySpotted[1],
            hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
            checkingMethod: "biggerBetter",
            includeInCalculations: true
        });

        playerComparison.stats.push({
            key: "accuracy_head",
            name: "Accuracy head",
            unit: "%",
            suspiciousBehaviour: "Aimbot",
            playerValue: accuracyHead[0],
            topNHltvPlayerValue: accuracyHead[1],
            hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
            checkingMethod: "biggerBetter",
            includeInCalculations: true
        });
        
        playerComparison.stats.push({
            key: "accuracy",
            name: "Accuracy overall",
            unit: "%",
            suspiciousBehaviour: "Aimbot",
            playerValue: accuracy[0],
            topNHltvPlayerValue: accuracy[1],
            hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
            checkingMethod: "biggerBetter",
            includeInCalculations: false
        });
        playerComparisons.comparisons.push(playerComparison);
    });
    playerComparisons.info = {};
    playerComparisons.info.matchesCount = matchesCount;
    return playerComparisons;
}

function toMs(playerValueData, hltvPlayerValueData) {
    const playerValue = Math.round(playerValueData.reduce((a, b) => a + b, 0) / playerValueData.length * 1000);
    const hltvPlayerValue = Math.round(hltvPlayerValueData.reduce((a, b) => a + b, 0) / hltvPlayerValueData.length * 1000);

    return [playerValue, hltvPlayerValue];
}

function toValue(playerValueData, hltvPlayerValueData, percent = false) {
    const playerValue = Math.round(playerValueData.reduce((a, b) => a + b, 0) / playerValueData.length * (percent ? 100 : 1) * 100) / 100;
    const hltvPlayerValue = Math.round(hltvPlayerValueData.reduce((a, b) => a + b, 0) / hltvPlayerValueData.length * (percent ? 100 : 1) * 100) / 100;

    return [playerValue, hltvPlayerValue];
}