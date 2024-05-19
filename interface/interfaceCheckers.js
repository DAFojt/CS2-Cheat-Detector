function isUserProfile() {
    return !!Array.from(document.getElementsByClassName('btn_profile_action btn_medium'))?.some(btn => btn.href?.includes('edit/info') ?? false);
}

function isLoggedIn() {
    return !Array.from(document.getElementsByClassName('global_action_link'))?.some(btn => btn.href?.includes('https://steamcommunity.com/login/') ?? false);
}

function isHltvProPlayer(player) {
    return !!player.games.some(g => g.dataSource === 'hltv');
}

function isEseaPlayer(player) {
    return player?.memberships?.includes('esea') ?? false;
}

function isFaceitPlusPlayer(player) {
    return player?.memberships?.includes('plus') ?? false;
}

function isFaceitPremiumPlayer(player) {
    return player?.memberships?.includes('premium') ?? false;
}

function isFaceitProPlayer(player) {
    return (player?.tags?.includes('pro') || player?.tags?.includes('FPL')) ?? false;
}

function isFaceitPhoneVerifiedPlayer(player) {
    return player?.phone_verified ?? false;
}

function isBanned() {
    return document.getElementsByClassName('profile_ban_status').length > 0;
}
