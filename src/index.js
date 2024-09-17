const { app, BrowserWindow, ipcMain } = require('electron');
const RPC = require('discord-rpc');
const path = require('path');

if (require('electron-squirrel-startup')) app.quit();

let clientId;

try {
  const secrets = require('./secrets.json');
  clientId = secrets.client_id;
  if (!clientId) throw new Error('Client ID is missing in secrets.json');
} catch (error) {
  console.error('Failed to read client ID from secrets.json:', error);
  app.quit();
}

let rpc = null;
let rpcReady = false;

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

   // Handle the 'will-prevent-unload' event
   mainWindow.webContents.on('will-prevent-unload', (event) => {
    // Prevent the default behavior of the event
    event.preventDefault();
    // Optionally, log the event or take other actions
    console.log('Prevented YouTube Music from blocking window unload.');
  });
}

app.whenReady().then(() => {
  createWindow();
});

ipcMain.on('media-playback-state', (event, data) => {
  if (data.state === 'playing') {
    if (!rpc) {
      initRpc();
    }
  } else if (data.state === 'stopped') {
    if (rpc) {
      rpc.clearActivity().catch(console.error).then(() => {
        rpc.destroy().catch(console.error).then(() => {
          rpc = null;
          rpcReady = false;
        });
      });
    }
  }
});

ipcMain.on('song-info', (event, songInfo) => {
  if (rpc && rpcReady) {
    updateDiscordStatus(songInfo);
  }
});

function initRpc() {
  rpc = new RPC.Client({ transport: 'ipc' });

  rpc.on('ready', () => {
    console.log('Connected to Discord!');
    rpcReady = true;
  });

  rpc.on('disconnected', () => {
    console.log('Discord RPC disconnected');
    rpc.destroy().catch(console.error);
    rpc = null;
    rpcReady = false;
  });

  rpc.on('error', (error) => {
    console.error('RPC Error:', error);
  });

  rpc.login({ clientId }).catch(console.error);
}

function updateDiscordStatus(songInfo) {
  const { title, artist, album, artwork, songUrl, position, duration } = songInfo;

  // Format position and duration into "MM:SS / MM:SS"
  const positionStr = formatTime(position);
  const durationStr = formatTime(duration);
  const progressStr = `${positionStr} / ${durationStr}`;

  // Set activity with your specified formatting
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
  }).catch(console.error);
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

app.on('window-all-closed', () => {
  // On macOS, it's common for apps to stay open until explicitly closed
  if (process.platform !== 'darwin') {
    if (rpc) {
      console.log('Clearing Discord activity and destroying RPC connection');
      rpc.clearActivity().catch(console.error).then(() => {
        rpc.destroy().catch(console.error).then(() => {
          rpc = null;
          rpcReady = false;
        });
      });
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});