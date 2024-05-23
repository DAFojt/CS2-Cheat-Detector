class Checkers {
    static isUserProfile() {
        return !!Array.from(document.getElementsByClassName('btn_profile_action btn_medium'))?.some(btn => btn.href?.includes('edit/info') ?? false);
    }
    
    static isLoggedIn() {
        return !Array.from(document.getElementsByClassName('global_action_link'))?.some(btn => btn.href?.includes('https://steamcommunity.com/login/') ?? false);
    }
    
    static isHltvProPlayer(player) {
        return !!player.games.some(g => g.dataSource === 'hltv');
    }
    
    static isEseaPlayer(player) {
        return player?.memberships?.includes('esea') ?? false;
    }
    
    static isFaceitPlusPlayer(player) {
        return player?.memberships?.includes('plus') ?? false;
    }
    
    static isFaceitPremiumPlayer(player) {
        return player?.memberships?.includes('premium') ?? false;
    }
    
    static isFaceitProPlayer(player) {
        return (player?.tags?.includes('pro') || player?.tags?.includes('FPL')) ?? false;
    }
    
    static isFaceitPhoneVerifiedPlayer(player) {
        return player?.phone_verified ?? false;
    }
    
    static isBanned() {
        return document.getElementsByClassName('profile_ban_status').length > 0;
    }
}
