// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const RPC = require('discord-rpc');
const path = require('path');

let clientId;

// Read the client ID from secrets.json
try {
  const secrets = require('./secrets.json');
  clientId = secrets.client_id;
  if (!clientId) throw new Error('Client ID is missing in secrets.json');
} catch (error) {
  console.error('Failed to read client ID from secrets.json:', error);
  app.quit();
}

const rpc = new RPC.Client({ transport: 'ipc' });

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'YouTube Music',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  mainWindow.loadURL('https://music.youtube.com/');
}

app.whenReady().then(() => {
  rpc.login({ clientId }).catch(console.error);
  createWindow();
});

ipcMain.on('song-info', (event, songInfo) => {
  updateDiscordStatus(songInfo);
});

ipcMain.on('media-playback-state', (event, data) => {
  if (data.state === 'stopped') {
    rpc.clearActivity();
  }
});

function updateDiscordStatus(songInfo) {
  const { title, artist, album, artwork, songUrl, position, duration } = songInfo;

  // Format position and duration into "MM:SS / MM:SS"
  const positionStr = formatTime(position);
  const durationStr = formatTime(duration);
  const progressStr = `${positionStr} / ${durationStr}`;

  // Set activity with specified variable names
  rpc.setActivity({
    details: `${title || 'Unknown Title'} by ${artist || 'Unknown Artist'}`,
    state: progressStr,
    largeImageText: album || 'YouTube Music',
    largeImageKey: artwork,
    buttons: [
      {
        label: 'Listen on YouTube Music',
        url: songUrl || 'https://music.youtube.com/',
      },
    ],
    instance: false,
  });
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

rpc.on('ready', () => {
  console.log('Connected to Discord!');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    rpc.destroy();
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
