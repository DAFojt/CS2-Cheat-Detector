try {
    importScripts('storageProvider.js', 'settings.js', 'interfaceTools.js', 'interfaceCheckers.js');
  } catch (e) {
}

async function createInterface(playerDataPromise, skillCalculationsPromise, playerDetailsPromise, playerFaceitDataPromise) {
    const extDiv = getExtDiv();
    let loaderDiv;
    if(!isOldMainDivExist()) {
        let loader = document.createElement('div');
        loader.className = 'loader';
        loaderDiv = document.createElement('div');
        loaderDiv.className = 'cheat-detector cheat-percentage-div';
        loaderDiv.appendChild(loader);
        extDiv.appendChild(loaderDiv);
    }

    const playerData = await playerDataPromise;
    const extensionSettings = await (new Settings().extensionSettings);

    let mainDiv = document.createElement('div');
    mainDiv.className = 'cheat-detector-main';
    let cheaterDiv;

    if(extensionSettings.cheaterPercentageAtTheTopEnabled) {
        cheaterDiv = document.createElement('div');
        mainDiv.appendChild(cheaterDiv);
    }

    let infoDiv = document.createElement('div');
    mainDiv.appendChild(infoDiv);

    let detailsDiv = document.createElement('div');
    mainDiv.appendChild(detailsDiv);

    let platformBansDiv = document.createElement('div');
    mainDiv.appendChild(platformBansDiv);

    let suspiciousPointsDiv = document.createElement('div');
    mainDiv.appendChild(suspiciousPointsDiv);

    if(!extensionSettings.cheaterPercentageAtTheTopEnabled) {
        cheaterDiv = document.createElement('div');
        mainDiv.appendChild(cheaterDiv);
    }

    let buttonsDiv = document.createElement('div');
    mainDiv.appendChild(buttonsDiv);

    let uiPromises = [
        createInfoTab(playerData, playerDetailsPromise).then(tab => {
            if(tab) infoDiv.appendChild(tab);
        }),
        createBannedTeammatesTab(playerDetailsPromise, playerFaceitDataPromise).then(tab => {
            if(tab) detailsDiv.appendChild(tab);
        }),
        createPlatformBansTab(playerDetailsPromise, playerFaceitDataPromise).then(tab => {
            if(tab) platformBansDiv.appendChild(tab);
        }),
        createSuspiciousTab(playerDetailsPromise, skillCalculationsPromise, playerFaceitDataPromise).then(tab => {
            if(tab) suspiciousPointsDiv.appendChild(tab);
        }),
        createCheaterDiv(playerData, playerDetailsPromise, skillCalculationsPromise, playerFaceitDataPromise).then(div => {
            if(div) cheaterDiv.appendChild(div);
            if(loaderDiv)
                extDiv.removeChild(loaderDiv);
        }),
        createButtonsDiv(playerData, playerDetailsPromise, skillCalculationsPromise, playerFaceitDataPromise).then(div => {
            if(div) buttonsDiv.appendChild(div);
        }),
    ];

    // removing ui shuttering when user changes data source
    if(isOldMainDivExist()) {
        Promise.all(uiPromises).then(() => {
            removeOldMainDiv();
            extDiv.appendChild(mainDiv);
        });
    }
    else {
        extDiv.appendChild(mainDiv);
    }
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

async function createInfoTab(player, playerDetailsPromise) {
    if(!player?.games?.length || player.games.length === 0)
        return;

    let {tab, tabContent} = await InterfaceTools.createTabWithContent('Player info');
    

    let faceitDiv = document.createElement('div');
    faceitDiv.className = 'box';
    let text = document.createElement('p');
    text.textContent = 'Faceit highest rank: ';
    faceitDiv.appendChild(text);
    if(!player.player.highestRanks.faceit) {
        let emptyText = document.createElement('p');
        emptyText.textContent = '-';
        emptyText.style.maxWidth = '15%';
        faceitDiv.appendChild(emptyText);
    } else {
        const faceitImg = document.createElement('img');
        faceitImg.src = chrome.runtime.getURL('../resources/images/faceit/faceit' + player.player.highestRanks.faceit + '.svg');
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
    inneriP.textContent = 'Faceit current rank: ';
    faceitDiv.appendChild(inneriP);
    if(!player.player.currentRanks.faceit) {
        let emptyText = document.createElement('p');
        emptyText.textContent = '-';
        emptyText.style.maxWidth = '15%';
        faceitDiv.appendChild(emptyText);
    } else {
        let faceitImg = document.createElement('img');
        faceitImg.src = chrome.runtime.getURL('../resources/images/faceit/faceit' + player.player.currentRanks.faceit + '.svg');
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

    playerDetailsPromise.then(pd => {
        premierDiv = document.createElement('div');
        premierDiv.className = 'box';
        text = document.createElement('p');
        text.textContent = 'CS2 registered matches:';
        premierDiv.appendChild(text);
        text = document.createElement('p');
        text.textContent = pd?.cs2MatchesCount;
        text.style.maxWidth = '15%';
        premierDiv.appendChild(text);
        tabContent.appendChild(premierDiv);
        tab.appendChild(tabContent);

        premierDiv = document.createElement('div');
        premierDiv.className = 'box';
        text = document.createElement('p');
        text.textContent = 'CSGO registered matches:';
        premierDiv.appendChild(text);
        text = document.createElement('p');
        text.textContent = pd?.csgoMatchesCount;
        text.style.maxWidth = '15%';
        premierDiv.appendChild(text);
        tabContent.appendChild(premierDiv);
        tab.appendChild(tabContent);
    });
    

    return tab;
}

async function createBannedTeammatesTab(detailsPromise) {
    return detailsPromise.then(async detailsData => {
        if(!detailsData || detailsData.bannedTeammates.length === 0)
            return;

        const {tab, tabContent} = await InterfaceTools.createTabWithContent('Banned teammates', detailsData.bannedTeammates.length);

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

async function createPlatformBansTab(detailsPromise, playerFaceitDataPromise) {
    const detailsData = await detailsPromise;
    if(!detailsData)
        return;

    const platformBans = detailsData.platformBans.filter(x => x !== 'matchmaking');
    if(!platformBans.includes('faceit')) {
        const playerFaceitData = await playerFaceitDataPromise;
        if(playerFaceitData?.platforms?.registration_status === 'banned')
            platformBans.push('faceit');
    }
        
    if(!detailsData || !detailsData.platformBans || platformBans.length === 0)
        return;

    const {tab, tabContent} = await InterfaceTools.createTabWithContent('Bans', platformBans.length);

    for(const platform of platformBans.filter(x => x !== 'matchmaking')) {
        const row = document.createElement('a');
        if(platform === 'faceit' && detailsData.faceitNickname) {
            row.href = 'https://www.faceit.com/en/players/' + detailsData.faceitNickname;
        } else if (platform === 'esportal' && detailsData.esportalNickname) {
            row.href = 'https://esportal.com/en/profile/' + detailsData.esportalNickname;
        }
            
        const img = document.createElement('img');
        img.title = platform;
        img.src = chrome.runtime.getURL('../resources/images/platform-logo/' + platform + '.png');
        img.className = 'badge_icon small';

        row.appendChild(img);
        tabContent.appendChild(row);
    }

    return tab;
}

async function createSuspiciousTab(playerDetailsPromise, skillCalculationsPromise, playerFaceitDataPromise) {
    return skillCalculationsPromise.then(async skillCalculations => {
        const extensionSettings = await (new Settings().extensionSettings);
        const matchesCount = skillCalculations.matchesCount;
        const result = skillCalculations.result;
        const { tab, tabContent } = await InterfaceTools.createTabWithContent('Suspicious points');
        const top10HltvPlayers = extensionSettings.top10hltvPlayers;
        if (Checkers.isHltvProPlayer(await playerDetailsPromise) || Checkers.isFaceitProPlayer(await playerFaceitDataPromise)) {
            return;
        }
        else if(matchesCount >= extensionSettings.minMatchesCount) {
            result.avaiableStats().forEach(statistic => {
                const suspiciousPoints = skillCalculations.result.getSuspiciousPointsByKey(statistic.key);
                const innerDiv =  document.createElement('div');
                const innerP = document.createElement('p');
                innerP.className = 'cheat-detector-paragraph';
                innerP.textContent = suspiciousPoints.name + ': ' + suspiciousPoints.points + "/" + suspiciousPoints.all + " (" + suspiciousPoints.suspiciousBehaviour + ")";
                innerDiv.appendChild(innerP)

                const percent = 100 / suspiciousPoints.all * suspiciousPoints.points;

                const innerAPb = document.createElement('div');
                innerAPb.className = 'achievement_progress_bar_ctn';
                innerAPb.style.width = '97%';

                const innerPb = document.createElement('div');
                innerPb.className = 'progress_bar';
                innerPb.style.width = '0%';

                const setProgressBar = (percentage, includeInCheaterPercentage) => {
                    innerPb.style.width = percentage + '%';

                        if(includeInCheaterPercentage) {
                            if(percentage === 0)
                                innerPb.style.background = 'linear-gradient(180deg, rgba(240, 240, 240, .3) 0%, rgb(0 180 0) 80%)';
                            else if(percentage === 41)
                                innerPb.style.background = 'linear-gradient(180deg, rgba(240, 240, 240, .3) 0%, rgb(180 180 0) 80%)';
                            else if(percentage === 71)
                                innerPb.style.background = 'linear-gradient(180deg, rgba(240, 240, 240, .3) 0%, rgb(180 0 0) 80%)';

                            if(percentage === 100 && extensionSettings.fancyAnimationsEnabled) {
                                innerAPb.classList.toggle('strong-shake');
                            }
                        } else {
                            innerPb.style.background = 'linear-gradient(180deg, rgba(240, 240, 240, .3) 0%, rgb(0 0 120) 80%)';
                        }
                }

                if(extensionSettings.fancyAnimationsEnabled) {
                    let someRandomDelay = Math.floor(Math.random() * 6) + 22;
                    for(let i = 0; i <= percent; i++) {
                        setTimeout(function(){
                            setProgressBar(i, statistic.includeInCheaterPercentage);
                        }, i * someRandomDelay);
                    }
                }
                else {
                    setProgressBar(percent, statistic.includeInCheaterPercentage);
                }
                
                const betterThan = skillCalculations.result.getEnemysSteamId64FromStatByKeyWherePlayerIsBetter(statistic.key);
                const worseThan = skillCalculations.result.getEnemysSteamId64FromStatByKeyWherePlayerIsWorse(statistic.key);
                innerDiv.title = 'Better ' + statistic.name.toLowerCase() + ' than ' + betterThan.length + ' of TOP ' + top10HltvPlayers.length +' HLTV players' 
                + (betterThan.length > 0 ? '\n\nBetter than:' + betterThan.map(bt => {
                    hltvPlayerNickname = top10HltvPlayers.find(t => t.steam64Id === bt).nickname;
                    const stat = skillCalculations.result.getStatByKeyAndEnemySteamId64(statistic.key, bt);
                    return '\n' + hltvPlayerNickname + ' ' + stat.topNHltvPlayerValue + stat.unit + ' vs ' + stat.playerValue + stat.unit + 
                    (bt.samplesLimit ? ' (samples: ' + bt.samplesLimit + ')' : '');
                }) : '')
                + (worseThan.length > 0 ? '\n\nWorse than:' + worseThan.map(bt => {
                    hltvPlayerNickname = top10HltvPlayers.find(t => t.steam64Id === bt).nickname;
                    const stat = skillCalculations.result.getStatByKeyAndEnemySteamId64(statistic.key, bt);
                    return '\n' + hltvPlayerNickname + ' ' + stat.topNHltvPlayerValue + stat.unit + ' vs ' + stat.playerValue + stat.unit + 
                    (bt.samplesLimit ? ' (samples: ' + bt.samplesLimit + ')' : '');
                }) : '')
                ;
                if(!statistic.includeInCheaterPercentage) {
                    innerDiv.title += '\n\nThis statistic is not included in cheater percentage calculations';
                }
                innerAPb.appendChild(innerPb);
                innerDiv.appendChild(innerAPb);
                tabContent.appendChild(innerDiv);
            })
            const innerP = document.createElement('p');
            innerP.textContent = 'Source data: ' + dataSource.replace('premierwgm', 'Premier&Wgm') + ', Matches: ' + matchesCount;
            innerP.style.textAlign = 'center';
            tabContent.appendChild(innerP);
            return tab;
        }
        else {
            return;
        }
    })
}

async function createCheaterDiv(player, playerDetailsPromise, skillCalculationsPromise, playerFaceitDataPromise) {
    const extensionSettings = await (new Settings().extensionSettings);

    return skillCalculationsPromise.then(async skillCalculations => {
        const matchesCount = skillCalculations.matchesCount;
        const cheaterPercentage = skillCalculations.cheaterPercentage;
        const cheaterInfoTextElement = document.createElement('h1');
        cheaterInfoTextElement.className = 'cheat-percentage-value';
        let cheaterDiv = document.createElement('div');
        cheaterDiv.className = 'cheat-detector cheat-percentage-div'

        if(matchesCount >= extensionSettings.minMatchesCount) {
            if (Checkers.isHltvProPlayer(await playerDetailsPromise)) {
                cheaterInfoTextElement.textContent = 'HLTV PRO';
            } else if (Checkers.isFaceitProPlayer(await playerFaceitDataPromise)) {
                cheaterInfoTextElement.textContent = 'FPL PRO';
            }
            else {
                cheaterDiv.classList.add('cheat-percentage-low');
                const setCheaterPercentage = (percentage) => {
                    cheaterInfoTextElement.textContent = 'Cheater ' + percentage + '%';
                        
                        if(percentage === 50) {
                            cheaterDiv.classList.add('cheat-percentage-mid');
                            cheaterDiv.classList.toggle('strong-shake');
                        }
                        else if(percentage === 80) {
                            cheaterDiv.classList.add('cheat-percentage-high');
                            cheaterDiv.classList.toggle('strong-shake-mid');
                        }

                        if(extensionSettings.fancyAnimationsEnabled) {
                            if(percentage === 100) {
                                nicePokemonEasterEgg();
                                cheaterDiv.classList.toggle('strong-shake-long');
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
                        }   
                }
                if(extensionSettings.fancyAnimationsEnabled) {
                    for(let i = 0; i <= cheaterPercentage; i++){
                        setTimeout(function(){
                            setCheaterPercentage(i);
                        }, i * 25);
                    }
                }
                else {
                    setCheaterPercentage(cheaterPercentage);
                }
                catchCheater(player.player.steam64Id, skillCalculations.result.getAllSuspiciousPoints(), cheaterPercentage);
            }
            cheaterDiv.appendChild(cheaterInfoTextElement);
            cheaterDiv.title = 'Algorithm:\nTake the top half of the statistics\nCalculate the average score\nPass through a sigmoid filter'
            return cheaterDiv;

        }
        else {
            let h2 = document.createElement('h2');
            h2.textContent = 'Not enough data';
            h2.style.textAlign = 'center';
            cheaterDiv.appendChild(h2)
            return cheaterDiv;
        }
    })
}

async function createButtonsDiv(player, playerDetailsPromise, skillCalculationsPromise, playerFaceitDataPromise, ) {
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
    const premierWgmButton = createSwitchButton('PremierWgm', player.games.filter(g => g.dataSource === 'matchmaking').length + player.games.filter(g => g.dataSource === 'matchmaking_wingman').length);
    buttonsRow.appendChild(premierWgmButton);
    buttonsDiv.appendChild(buttonsRow);


    const buttonsRow1 = document.createElement('div');
    buttonsRow1.className = 'cheat-detector-buttons'
    buttonsRow1.style.marginTop = '3px';

    const buttonComment = createCommentButton(player, skillCalculationsPromise, playerFaceitDataPromise);
    buttonsRow1.appendChild(buttonComment);
    const reportButton = createReportButton(playerDetailsPromise, skillCalculationsPromise, playerFaceitDataPromise);
    buttonsRow1.appendChild(reportButton);
    const buttonLeetify = createLeetifyButton(player, playerDetailsPromise);
    buttonsRow1.appendChild(buttonLeetify);
    buttonsDiv.appendChild(buttonsRow1);



    buttonsDiv.disabled = true;

    playerFaceitDataPromise.then(async fdp => {
        if (!Checkers.isHltvProPlayer(await playerDetailsPromise) && !Checkers.isFaceitProPlayer(fdp)) {
            buttonsDiv.disabled = false;
        }
    })
    
    return buttonsDiv;
}

function createReportButton(playerDetailsPromise, skillCalculationsPromise, playerFaceitDataPromise) {
    const reportButton = document.createElement('button');
    reportButton.textContent = 'Report';
    reportButton.className = 'btn_profile_action btn_medium';
    reportButton.disabled = true;

    skillCalculationsPromise.then(async skillCalculations => {
        const suspiciousPoints = skillCalculations.result.getAllSuspiciousPoints();
        const suspiciousBehaviours = [...new Set(suspiciousPoints.filter(sp => 100/sp.all*sp.points >= 80).map(sp => sp.suspiciousBehaviour))];
        if(suspiciousBehaviours.length === 0 || Checkers.isUserProfile() || !Checkers.isLoggedIn() || Checkers.isHltvProPlayer(await playerDetailsPromise) || Checkers.isFaceitProPlayer(await playerFaceitDataPromise)) {
            reportButton.disabled = true;
            return;
        }
        reportButton.disabled = false;
    
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

function createCommentButton(player, skillCalculationsPromise) {
    const commentButton = document.createElement('button');
    commentButton.disabled = true;
    commentButton.textContent = 'Add comment';
    commentButton.className = 'btn_profile_action btn_medium';
    const steamCommentArea = document.getElementsByClassName('commentthread_textarea')[0];
    const steamCommentButton = document.getElementById('commentthread_Profile_'+player.player.steam64Id+'_submit');

    skillCalculationsPromise.then(async scp => {
        const extensionSettings = await (new Settings().extensionSettings);

        if(!steamCommentArea || !steamCommentButton || Checkers.isUserProfile() || !Checkers.isLoggedIn() || scp.cheaterPercentage < 70 || scp.matchesCount < extensionSettings.minMatchesCount) {
            commentButton.disabled = true;
            return;
        }
        const suspiciousPoints = scp.result.getAllSuspiciousPoints().filter(x => x.points > 0);
        let comment = [];
        const top10HltvPlayers = await PlayerRepository.getDefaultTop10HltvPlayers();
        suspiciousPoints.sort(function(a, b){return b.points - a.points}).forEach(x => {
            comment.push(x.name + ' ' + x.points + ' / ' + x.all + ' (' + x.suspiciousBehaviour + ')');
        })
        const betterThan = '\nBetter than:' + [... new Set(scp.result.avaiableStats().flatMap(av => scp.result.getEnemysSteamId64FromStatByKeyWherePlayerIsBetter(av.key)))].map(x => {
            return ' ' + top10HltvPlayers.find(t => t.steam64Id === x).nickname;
        });
        commentButton.disabled = false;
        commentButton.onclick = () => {
            if(extensionSettings.instantCommentEnabled) {
                steamCommentArea.focus();
                steamCommentArea.value = '';
                steamCommentArea.value += 'Cheat detector audit:\n';
                steamCommentArea.value += 'This account has better statistics than TOP ' + suspiciousPoints[0].all + ' HLTV players in the:\n\n';
                steamCommentArea.value += comment.join('\n');
                steamCommentArea.value += betterThan + '\n\n';
                steamCommentArea.value += 'He is '+ scp.cheaterPercentage +'% cheater, checked automatically by CS2 Cheat Detector Chrome extension\n';
                steamCommentArea.value += 'Data source: ' + dataSource.replace('premierwgm', 'Premier & Wingman') + ' matches, demos analyzed: ' + scp.matchesCount;
                steamCommentButton.click();
                commentButton.disabled = true;
            } else {
                steamCommentArea.focus();
                let delay = 0;
                delay += ElementTextTools.addTextFancy(steamCommentArea, 'Cheat detector audit:', delay, 50);
                ElementTextTools.newLine(steamCommentArea, delay);
                delay += ElementTextTools.addTextFancy(steamCommentArea, 'This account has better statistics than TOP ' + suspiciousPoints[0].all + ' HLTV players in the:', delay, 25);
                ElementTextTools.newLine(steamCommentArea, delay);
                for(let i = 0; i < comment.length; i++) {
                    ElementTextTools.newLine(steamCommentArea, delay + 500);
                    delay += ElementTextTools.addTextLineAfterDelay(steamCommentArea, comment[i], delay, 500);
                }
                delay += ElementTextTools.addTextLineAfterDelay(steamCommentArea, betterThan, delay, 500);
                ElementTextTools.newLine(steamCommentArea, delay, 2);
                delay += ElementTextTools.addTextFancy(steamCommentArea, 'He is '+ scp.cheaterPercentage +'% cheater, checked automatically by CS2 Cheat Detector Chrome extension', delay, 35, 500);
                ElementTextTools.newLine(steamCommentArea, delay + 500);
                delay += ElementTextTools.addTextLineAfterDelay(steamCommentArea, 'Data source: ' + dataSource.replace('premierwgm', 'Premier & Wingman') + ' matches, demos analyzed: ' + scp.matchesCount, delay, 500);
                commentButton.disabled = true;
            }
        }
    })
    return commentButton;
}

function createLeetifyButton(player, playerDetailsPromise) {
    const leetifyAnchor = document.createElement('a');
    leetifyAnchor.href = 'https://leetify.com/app/profile/' + player.player.steam64Id
    const leetifyButton = document.createElement('button');
    leetifyButton.textContent = '  Leetify profile';
    leetifyButton.className = 'btn_profile_action btn_medium';
    leetifyButton.disabled = true;

    leetifyAnchor.appendChild(leetifyButton);

    playerDetailsPromise.then(pd => {
        if(pd) {
            leetifyButton.disabled = false;
        }
    });
    return leetifyAnchor;
}

function createSwitchButton(requestedDataSource, matchesCount) {
    const sourceButton = document.createElement('button');
    sourceButton.textContent = requestedDataSource;
    sourceButton.classList.add('btn_profile_action');
    sourceButton.classList.add('btn_medium');
    sourceButton.classList.add('superfluousButton');

    (new Settings().extensionSettings).then(extensionSettings => {
        if(matchesCount >= extensionSettings.minMatchesCount){ 
            sourceButton.classList.remove('superfluousButton');
        }
    });
    
    sourceButton.onclick = () => {
        dataSource = requestedDataSource.toLowerCase();
        this.run(); //to do add something like observable in content.js and call run() through it, not there
    }
    return sourceButton;
}