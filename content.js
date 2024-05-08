run();

var playerData;
var playerDetailsPromise;

var dataSource = 'all';
const maxMatchesCount = 60;
const minMatchesCount = 10;

var showAllSprays = false; //to do move to global settings

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

        let spSum = 0;
        let all = 0;
        let newSp = result.getAllSuspiciousPoints();
        newSp.sort(function(a, b){return b.points - a.points}).slice(0, Math.round(newSp.length / 2)).forEach(sp => {
            spSum += sp.points;
            all += sp.all;
        })
        const cheaterPercentage = result.matchesCount ? Math.round(sigmoidFilter(spSum / all * 100) * 100) : 0;

        return { result, matchesCount: result.matchesCount, cheaterPercentage: cheaterPercentage }
    })
}

function sigmoidFilter(input) {
    let sgmdv = 1/(1+Math.pow(Math.E, (-(input/10-5))));
    if(sgmdv < 0.02) sgmdv = 0;
    if(sgmdv === 0.9933071490757153) sgmdv = 1; //max value can be passed to filter, a little bit szpachla
    return sgmdv;
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
        const platformBans = detailsData.platformBans.filter(x => x !== 'matchmaking');
        if(!detailsData || !detailsData.platformBans || platformBans.length === 0)
            return;

        const {tab, tabContent} = await createTabWithContent('Bans (' + platformBans.length + ')');

        for(const platform of platformBans.filter(x => x !== 'matchmaking')) {
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
        const result = skillCalculations.result;
        const { tab, tabContent } = await createTabWithContent('Suspicious points');
        const top10HltvPlayers = await getTop10HltvPlayers();
        if (isHltvProPlayer(player)) {
            return;
        }
        else if(matchesCount > 10) {
            result.avaiableStats.forEach(statistic => {
                const suspiciousPoints = skillCalculations.result.getSuspiciousPointsByKey(statistic.key);
                const innerDiv =  document.createElement('div');
                const innerP = document.createElement('p');
                innerP.className = 'cheat-detector-paragraph';
                innerP.textContent = suspiciousPoints.name + ': ' + suspiciousPoints.points + "/" + suspiciousPoints.all + " (" + suspiciousPoints.suspiciousBehaviour + ")";
                innerDiv.appendChild(innerP)

                const percent = 100 / suspiciousPoints.all * suspiciousPoints.points;

                const innerPb = document.createElement('div');
                innerPb.className = 'progress_bar';
                innerPb.style.width = '0%';

                for(let i = 0; i <= percent; i++) {
                    setTimeout(function(){
                        innerPb.style.width = i + '%';

                        if(statistic.includeInCheaterPercentage) {
                            if(i < 40)
                                innerPb.style.background = 'linear-gradient(180deg, rgba(255, 255, 255, .3) 0%, rgb(0 200 0) 80%)';
                            else if(i >= 40 && i < 70)
                                innerPb.style.background = 'linear-gradient(180deg, rgba(255, 255, 255, .3) 0%, rgb(200 200 0) 80%)';
                            else if(i >= 70)
                                innerPb.style.background = 'linear-gradient(180deg, rgba(255, 255, 255, .3) 0%, rgb(200 0 0) 80%)';
                        } else {
                            innerPb.style.background = 'linear-gradient(180deg, rgba(255, 255, 255, .3) 0%, rgb(0 0 120) 80%)';
                        }
                    }, i * 25);
                }
                
                
                const innerAPb = document.createElement('div');
                innerAPb.className = 'achievement_progress_bar_ctn';
                innerAPb.style.width = '97%';
                const betterThan = skillCalculations.result.getEnemysSteamId64FromStatByKeyWherePlayerIsBetter(statistic.key);
                innerDiv.title = 'Better ' + statistic.name.toLowerCase() + ' than ' + statistic.points + ' of TOP ' + statistic.all +' HLTV players' 
                + (suspiciousPoints.points > 0 ? '\nBetter than:' + betterThan.map(bt => {
                    hltvPlayerNickname = top10HltvPlayers.find(t => t.steam64Id === bt).nickname;
                    const stat = skillCalculations.result.getStatByKeyAndEnemySteamId64(statistic.key, bt);
                    return '\n' + hltvPlayerNickname + ' ' + stat.topNHltvPlayerValue + stat.unit + ' vs ' + stat.playerValue + stat.unit + 
                    (bt.samplesLimit ? ' (samples: ' + bt.samplesLimit + ')' : '');
                }) : '')
                ;
                if(!statistic.includeInCheaterPercentage) {
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
        const cheaterPercentage = v.cheaterPercentage;
        const isHltvPlayer = player.games.some(g => g.dataSource === 'hltv');
        const cheaterInfoTextElement = document.createElement((cheaterPercentage < 50 || isHltvPlayer) ? 'h2' : 'h1');
        cheaterInfoTextElement.className = 'cheat-percentage-value';

        if(matchesCount > minMatchesCount) {
            let cheaterDiv = document.createElement('div');
            if (isHltvPlayer) {
                cheaterInfoTextElement.textContent = 'HLTV PRO';
            }
            else {
                for(let i = 0; i <= cheaterPercentage; i++){
                    setTimeout(function(){
                        cheaterInfoTextElement.textContent = 'Cheater ' + i + '%';
                        cheaterDiv.className = 'cheat-detector cheat-percentage-div'
                        if (i < 50) {
                            cheaterInfoTextElement.classList.add('cheat-percentage-low');
                        }
                        else if(i >= 50 && i < 80) {
                            cheaterInfoTextElement.classList.add('cheat-percentage-mid');
                        }
                        else if(i >= 80) {
                            cheaterInfoTextElement.classList.add('cheat-percentage-high');
                        }

                        if(i === 100) {
                            for(let j = 0; j <= 26; j++) {
                                setTimeout(function(){
                                    if (j%2 === 0) {
                                        cheaterInfoTextElement.className = 'cheat-percentage-value cheat-percentage-high';
                                    }
                                    else {
                                        cheaterInfoTextElement.className = 'cheat-percentage-value cheat-percentage-critical';
                                    }
                                }, 500 * j);
                            }
                        }
                    }, i * 25);
                }
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

    const buttonsRow = document.createElement('div');
    buttonsRow.className = 'cheat-detector-buttons'

    const allButton = createSwitchButton('All', player.games.length);
    buttonsRow.appendChild(allButton);
    const premierButton = createSwitchButton('Premier', player.games.filter(g => g.dataSource === 'matchmaking').length);
    buttonsRow.appendChild(premierButton);
    const faceitButton = createSwitchButton('Faceit', player.games.filter(g => g.dataSource === 'faceit').length);
    buttonsRow.appendChild(faceitButton);
    const wingmanButton = createSwitchButton('Wingman', player.games.filter(g => g.dataSource === 'matchmaking_wingman').length);
    buttonsRow.appendChild(wingmanButton);
    const premierWgmButton = createSwitchButton('Premier+Wgm', player.games.filter(g => g.dataSource === 'matchmaking').length + player.games.filter(g => g.dataSource === 'matchmaking_wingman').length);
    buttonsRow.appendChild(premierWgmButton);
    buttonsDiv.appendChild(buttonsRow);

    const buttonsRow1 = document.createElement('div');
    buttonsRow1.className = 'cheat-detector-buttons'
    buttonsRow1.style.marginTop = '3px';

    const buttonComment = createCommentButton(player, skillCalculationsPromise);
    buttonsRow1.appendChild(buttonComment);
    const reportButton = createReportButton(player, skillCalculationsPromise);
    buttonsRow1.appendChild(reportButton);
    const buttonLeetify = createLeetifyButton(player);
    buttonsRow1.appendChild(buttonLeetify);
    buttonsDiv.appendChild(buttonsRow1);

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

function createReportButton(player, skillCalculationsPromise) {
    const reportButton = document.createElement('button');
    reportButton.innerText = 'Steam report';
    reportButton.className = 'btn_green_white_innerfade btn_large';

    skillCalculationsPromise.then(skillCalculations => {
        const suspiciousPoints = skillCalculations.result.getAllSuspiciousPoints();
        const suspiciousBehaviours = [...new Set(suspiciousPoints.filter(sp => 100/sp.all*sp.points >= 80).map(sp => sp.suspiciousBehaviour))];
        if(suspiciousBehaviours.length === 0 || isUserProfile() || !isLoggedIn() || isHltvProPlayer(player)) {
            reportButton.disabled = true;
            return;
        }
    
        reportButton.onclick = () => {
            const dropdownButton = document.getElementById('profile_action_dropdown_link');
            dropdownButton.click();
            const dropdown = (document.getElementsByClassName('popup_body popup_menu shadow_content'))[0];
            const reportButton = Array.from(dropdown.children).find(c => (c.children[0].src+'').includes('notification_icon_flag.png'));
            reportButton.click();
            setTimeout(() => {
                const reportReasonsList = document.getElementById('step_content');
                const reportCheaterRow = reportReasonsList.children[5];
                reportCheaterRow.click();
                setTimeout(() => {
                    let reportButton = document.getElementById('report_button');
                    reportButton.click();
                    const textArea = document.getElementById('report_txt_input');
                    textArea.value = suspiciousBehaviours.join(', ');
                    textArea.focus();
                    textArea.click();
                    const gamesList = document.getElementById('select_recently_played');
                    Array.from(gamesList.children).find(x => x.outerText === 'Counter-Strike 2').click();
                    const finalReportButton = document.getElementById('btn_submit_report');
                    finalReportButton.click();
                }, 1000);
            }, 1000);
        }
    });

    return reportButton;
}

function isUserProfile() {
    return !!Array.from(document.getElementsByClassName('btn_profile_action btn_medium'))?.some(btn => btn.href?.includes('edit/info') ?? false);
}

function isLoggedIn() {
    return !Array.from(document.getElementsByClassName('global_action_link'))?.some(btn => btn.href?.includes('https://steamcommunity.com/login/') ?? false);
}

function isHltvProPlayer(player) {
    return !!player.games.some(g => g.dataSource === 'hltv');
}

function createCommentButton(player, skillCalculationsPromise) {
    const commentButton = document.createElement('button');
    commentButton.innerText = 'Add comment';
    commentButton.className = 'btn_green_white_innerfade btn_large';
    const steamCommentArea = document.getElementsByClassName('commentthread_textarea')[0];
    const steamCommentButton = document.getElementById('commentthread_Profile_'+player.player.steam64Id+'_submit');

    skillCalculationsPromise.then(async scp => {
        if(!steamCommentArea || !steamCommentButton || isUserProfile() || !isLoggedIn() || scp.cheaterPercentage < 70 || scp.matchesCount < minMatchesCount) {
            commentButton.disabled = true;
            return commentButton;
        }
        const suspiciousPoints = scp.result.getAllSuspiciousPoints().filter(x => x.points > 0);
        let comment = [];
        const top10HltvPlayers = await getTop10HltvPlayers();
        suspiciousPoints.sort(function(a, b){return b.points - a.points}).forEach(x => {
            comment.push(x.name + ' ' + x.points + ' / ' + x.all + ' (' + x.suspiciousBehaviour + ')');
        })
        const betterThan = '\nBetter than:' + [... new Set(scp.result.avaiableStats.flatMap(av => scp.result.getEnemysSteamId64FromStatByKeyWherePlayerIsBetter(av.key)))].map(x => {
            return ' ' + top10HltvPlayers.find(t => t.steam64Id === x).nickname;
        });
        commentButton.onclick = () => {
            steamCommentArea.focus();
            let delay = 0;
            delay += addTextFancy(steamCommentArea, 'Cheat detector audit:', delay, 50);
            newLine(steamCommentArea, delay);
            delay += addTextFancy(steamCommentArea, 'This account has better statistics than TOP ' + suspiciousPoints[0].all + ' HLTV players in the:', delay, 25);
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

            commentButton.click();
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

function createSwitchButton(requestedDataSource, matchesCount) {
    const sourceButton = document.createElement('button');
    sourceButton.innerText = requestedDataSource;
    sourceButton.classList.add('btn_green_white_innerfade');
    sourceButton.classList.add('btn_large');
    if(matchesCount < minMatchesCount){ 
        sourceButton.classList.add('superfluousButton');
    }
    sourceButton.onclick = () => {
        dataSource = requestedDataSource.toLowerCase();
        this.run();
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

function getCordErrorForWeapon(s, cordLimit) {
    let sum = 0;
    const nonEmptyCords = s.coords.filter(c => c.playerX !== null && c.playerY !== null);
    const limitedCords = nonEmptyCords.slice(0, cordLimit ?? nonEmptyCords.length - 1);
    for (const c of limitedCords) {
        sum += this.getCordErrorValue(c);
    }
    return {
        weaponLabel: s.weaponLabel,
        avgError: Math.round(sum / nonEmptyCords.length * 100) / 100,
        coordsCount: limitedCords.length
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
        playerComparisons.matchesCount = 0;
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
        let sprayComparisons = [];

        topNHltvPlayer.sprays.forEach((topNHltvPlayerspray) => {
            const weaponLabel = topNHltvPlayerspray.weaponLabel;
            const playerSpray = player.sprays.find(s => s.weaponLabel === weaponLabel);
            if (!playerSpray)
                return;
            const coordsLimit = playerSpray.coords.length > topNHltvPlayerspray.coords.length ? topNHltvPlayerspray.coords.length : playerSpray.coords.length;

            const playerRecoil = getCordErrorForWeapon(playerSpray, coordsLimit);
            const topNHltvPlayerRecoil = getCordErrorForWeapon(topNHltvPlayerspray, coordsLimit);

            sprayComparisons.push({
                weaponLabel: weaponLabel,
                playerError: playerRecoil.avgError,
                topNHltvPlayerError: topNHltvPlayerRecoil.avgError,
                coordsLimit: coordsLimit
            });
        });

        const sprayControlOverall = toValue(sprayComparisons.map(sc => sc.playerError), sprayComparisons.map(sc => sc.topNHltvPlayerError), false);
        const sprayControlAK = [sprayComparisons.find(sc => sc.weaponLabel === 'AK-47').playerError, sprayComparisons.find(sc => sc.weaponLabel === 'AK-47').topNHltvPlayerError, sprayComparisons.find(sc => sc.weaponLabel === 'AK-47').coordsLimit];


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
                key: "spray_control_overall",
                name: "Spray control overall",
                unit: "*",
                suspiciousBehaviour: "Norecoil",
                playerValue: sprayControlOverall[0],
                topNHltvPlayerValue: sprayControlOverall[1],
                hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
                checkingMethod: "smallerBetter",
                isPlayerBetter: () => sprayControlOverall[0] < sprayControlOverall[1],
                includeInCheaterPercentage: true
            });

            playerComparison.stats.push({
                key: "spray_control_ak",
                name: "Spray control AK-47",
                unit: "*",
                suspiciousBehaviour: "Norecoil",
                playerValue: sprayControlAK[0],
                topNHltvPlayerValue: sprayControlAK[1],
                hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
                checkingMethod: "smallerBetter",
                isPlayerBetter: () => sprayControlAK[0] < sprayControlAK[1],
                includeInCheaterPercentage: true,
                samplesLimit: sprayControlAK[2]
            });

            if(showAllSprays) {
                sprayComparisons.filter(x => x.weaponLabel != "AK-47").forEach(spray => {
                    playerComparison.stats.push({
                        key: "spray_control_" + spray.weaponLabel,
                        name: "Spray control " + spray.weaponLabel,
                        unit: "*",
                        suspiciousBehaviour: "Norecoil",
                        playerValue: spray.playerError,
                        topNHltvPlayerValue: spray.topNHltvPlayerError,
                        hltvPlayerSteam64Id: topNHltvPlayer.player.steam64Id,
                        checkingMethod: "smallerBetter",
                        isPlayerBetter: () => spray.playerError < spray.topNHltvPlayerError,
                        includeInCheaterPercentage: false,
                        samplesLimit: spray.coordsLimit
                    });
                })
            }
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
            isPlayerBetter: () => sprayAccuracy[0] > sprayAccuracy[1],
            includeInCheaterPercentage: true
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
            isPlayerBetter: () => preaaim[0] < preaaim[1],
            includeInCheaterPercentage: true
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
            isPlayerBetter: () => reactionTimes[0] < reactionTimes[1],
            includeInCheaterPercentage: true
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
            isPlayerBetter: () => accuracyEnemySpotted[0] > accuracyEnemySpotted[1],
            includeInCheaterPercentage: true
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
            isPlayerBetter: () => accuracyHead[0] > accuracyHead[1],
            includeInCheaterPercentage: true
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
            isPlayerBetter: () => accuracy[0] > accuracy[1],
            includeInCheaterPercentage: false
        });
        playerComparisons.comparisons.push(playerComparison);
    });
    playerComparisons.info = {};
    playerComparisons.matchesCount = matchesCount;
    playerComparisons.avaiableStats = playerComparisons.comparisons.flatMap(r => r.stats).map(s => ({ key: s.key, name: s.name, includeInCheaterPercentage: s.includeInCheaterPercentage, suspiciousBehaviour: s.suspiciousBehaviour, unit: s.unit })).filter((obj, index, arr) =>{return arr.findIndex(o =>{return JSON.stringify(o) === JSON.stringify(obj)}) === index});
    playerComparisons.getStatNameByKey = (key) => playerComparisons.avaiableStats.find(s => s.key === key).name
    playerComparisons.getStatSuspiciousBehaviourByKey = (key) => playerComparisons.avaiableStats.find(s => s.key === key).suspiciousBehaviour
    playerComparisons.getAllStats = () => playerComparisons.comparisons.flatMap(c => c.stats).reduce((stats, st) => {const key = st.key;if (!stats[key]) {stats[key] = []} stats[key].push(st); return stats;}, {});;
    playerComparisons.getStatsByKey = (key) => playerComparisons.comparisons.flatMap(c => c.stats).filter(s => s.key === key)
    playerComparisons.getStatsByKeyLength = (key) => playerComparisons.comparisons.flatMap(c => c.stats).filter(s => s.key === key).length
    playerComparisons.getStatByKeyAndEnemySteamId64 = (key, hltvPlayerSteam64Id) => playerComparisons.comparisons.flatMap(c => c.stats).find(s => s.key === key && s.hltvPlayerSteam64Id === hltvPlayerSteam64Id)
    playerComparisons.getStatsByKeyWherePlayerIsBetter = (key) => playerComparisons.getStatsByKey(key).filter(s => s.isPlayerBetter())
    playerComparisons.getStatsByKeyWherePlayerIsBetterLength = (key) => playerComparisons.getStatsByKey(key).filter(s => s.isPlayerBetter()).length
    playerComparisons.getStatsByKeyWherePlayerIsWorse = (key) => playerComparisons.getStatsByKey(key).filter(s => !s.isPlayerBetter())
    playerComparisons.getStatsByKeyWherePlayerIsWorseLength = (key) => playerComparisons.getStatsByKey(key).filter(s => !s.isPlayerBetter()).length
    playerComparisons.getEnemysSteamId64FromStatByKeyWherePlayerIsBetter = (key) => playerComparisons.getStatsByKey(key).filter(s => s.isPlayerBetter()).map(s => s.hltvPlayerSteam64Id)
    playerComparisons.getEnemysSteamId64FromStatByKeyWherePlayerIsWorse = (key) => playerComparisons.getStatsByKey(key).filter(s => !s.isPlayerBetter()).map(s => s.hltvPlayerSteam64Id)
    playerComparisons.getAllSuspiciousPoints = () => playerComparisons.avaiableStats.filter(av => av.includeInCheaterPercentage).map(av => playerComparisons.getSuspiciousPointsByKey(av.key))
    playerComparisons.getSuspiciousPointsByKey = (key) => { return {points: playerComparisons.getStatsByKeyWherePlayerIsBetterLength(key), all: playerComparisons.getStatsByKeyLength(key), name: playerComparisons.getStatNameByKey(key), suspiciousBehaviour: playerComparisons.getStatSuspiciousBehaviourByKey(key)} };

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