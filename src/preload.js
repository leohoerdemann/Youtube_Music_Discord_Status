const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  let lastSongTitle = '';
  let songStartTime = 0;

  setInterval(() => {
    const metadata = navigator.mediaSession?.metadata;

    if (metadata) {
      const title = metadata.title || '';
      const artist = metadata.artist || '';
      const album = metadata.album || '';
      const artwork = metadata.artwork && metadata.artwork.length > 0 ? metadata.artwork[0].src : '';
      const songUrl = window.location.href;

      // Attempt to get the song duration from the player UI
      let duration = 0;
      const durationElement = document.querySelector('.time-info.style-scope.ytmusic-player-bar');
      if (durationElement) {
        const timeText = durationElement.textContent.trim(); // Format: "0:00 / 3:45"
        const parts = timeText.split(' / ');
        if (parts.length === 2) {
          duration = parseTime(parts[1]); // Parse duration time
        }
      }

      // Detect song change
      if (title !== lastSongTitle) {
        lastSongTitle = title;
        songStartTime = Date.now();

        // Extract High-Resolution Album Art URL
        let albumArtURL = '';
        if (artwork) {
          if (artwork.startsWith('https://lh3.googleusercontent.com/')) {
            albumArtURL = artwork;
          } else {
            const imgElement = document.querySelector('.image.style-scope.ytmusic-player-bar');
            if (imgElement) {
              albumArtURL = imgElement.src;
            }
          }
        }

        // Send song info to the main process
        ipcRenderer.send('song-info', {
          title,
          artist,
          album,
          artwork: albumArtURL,
          songUrl,
          songStartTime,
          duration,
        });
      }
    }
  }, 1000); // Check every second

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
