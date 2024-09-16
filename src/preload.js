const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  let lastPlaybackState = '';
  let lastTitle = '';

  setInterval(() => {
    const metadata = navigator.mediaSession?.metadata;
    const playbackState = navigator.mediaSession?.playbackState || 'none';

    // Detect playback state change
    if (playbackState !== lastPlaybackState) {
      lastPlaybackState = playbackState;

      if (playbackState === 'paused' || playbackState === 'none') {
        // Send a message to clear the status
        ipcRenderer.send('media-playback-state', { state: 'stopped' });
      }
    }

    if (metadata && playbackState === 'playing') {
      const title = metadata.title || '';

      // Check if the song has changed
      if (title !== lastTitle) {
        lastTitle = title;

        // Send song info to the main process
        sendSongInfo(metadata);
      } else {
        // Update position and duration
        sendSongInfo(metadata);
      }
    }
  }, 1000); // Check every second

  function sendSongInfo(metadata) {
    const title = metadata.title || '';
    const artist = metadata.artist || '';
    const album = metadata.album || '';
    const artwork = metadata.artwork && metadata.artwork.length > 0 ? metadata.artwork[0].src : '';
    const songUrl = window.location.href;

    // Get the song duration and position from the player UI
    let duration = 0;
    let position = 0;
    const durationElement = document.querySelector('.time-info.style-scope.ytmusic-player-bar');
    if (durationElement) {
      const timeText = durationElement.textContent.trim(); // Format: "0:00 / 3:45"
      const parts = timeText.split(' / ');
      if (parts.length === 2) {
        position = parseTime(parts[0]); // Parse current time
        duration = parseTime(parts[1]); // Parse total duration
      }
    }

    ipcRenderer.send('song-info', {
      title,
      artist,
      album,
      artwork,
      songUrl,
      position,
      duration,
    });
  }

  function parseTime(timeStr) {
    // Parses a time string in format "mm:ss" or "hh:mm:ss" to seconds
    const parts = timeStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 2) {
      // mm:ss
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // hh:mm:ss
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return seconds;
  }
});