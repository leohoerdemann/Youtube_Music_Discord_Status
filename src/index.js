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

  // For debugging
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  rpc.login({ clientId }).catch(console.error);
  createWindow();
});

ipcMain.on('song-info', (event, songInfo) => {
  updateDiscordStatus(songInfo);
});

function updateDiscordStatus(songInfo) {
  const { title, artist, album, artwork, songUrl, songStartTime, duration } = songInfo;

  if (!duration || duration <= 0) {
    // If duration is not available, do not set timestamps
    console.log('Setting activity without timestamps');
    rpc.setActivity({
      details: title || 'Unknown Title',
      state: artist || 'Unknown Artist',
      largeImageKey: artwork,
      largeImageText: album || 'Listening to a track',
      buttons: [
        {
          label: 'Listen on YouTube Music',
          url: songUrl || 'https://music.youtube.com/',
        },
      ],
      instance: false,
    });
  } else {
    // Set activity with progress bar
    console.log('Setting activity with timestamps');
    rpc.setActivity({
      details: title || 'Unknown Title',
      state: artist || 'Unknown Artist',
      startTimestamp: Math.floor(songStartTime / 1000),
      endTimestamp: Math.floor((songStartTime + duration * 1000) / 1000),
      largeImageKey: artwork,
      largeImageText: album || 'Listening to a track',
      buttons: [
        {
          label: 'Listen on YouTube Music',
          url: songUrl || 'https://music.youtube.com/'
        }
      ],
      instance: false,
    });
  }
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
