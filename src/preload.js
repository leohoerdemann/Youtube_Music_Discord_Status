const { ipcRenderer } = require('electron');

function updateActivity(details) {
    console.log('sending update');
    ipcRenderer.send('update-activity', details);
}

function sendMediaSessionData() {
    if ('mediaSession' in navigator) {
        const mediaSession = navigator.mediaSession;
    
        if (mediaSession.metadata) {
            const details = {
            song: mediaSession.metadata.title,
            artist: mediaSession.metadata.artist,
            album: mediaSession.metadata.album,
            albumArt: mediaSession.metadata.artwork[0]?.src,
            url: window.location.href,
            startTimestamp: Date.now()
            };

        updateActivity(details);
        }
    }
}

// Listen for media session updates
navigator.mediaSession.setActionHandler('play', sendMediaSessionData);
navigator.mediaSession.setActionHandler('pause', sendMediaSessionData);
navigator.mediaSession.setActionHandler('seekbackward', sendMediaSessionData);
navigator.mediaSession.setActionHandler('seekforward', sendMediaSessionData);
navigator.mediaSession.setActionHandler('previoustrack', sendMediaSessionData);
navigator.mediaSession.setActionHandler('nexttrack', sendMediaSessionData);