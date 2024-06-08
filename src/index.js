const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const rpc = require('discord-rpc');
const fs = require('fs');

const secretsPath = path.join(__dirname, 'secrets.json');
const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));

rpc.register(secrets.clientId);

const rpcClient = new rpc.Client({ transport: 'ipc' });

rpcClient.on('ready', () => { console.log('RPC Connected!'); });

function setActivity(details) {
  rpcClient.setActivity({
    details: details.song,
    state: details.artist,
    largeImageKey: 'album_art',
    largeImageText: details.album,
    smallImageKey: 'play',
    smallImageText: 'Listening on YouTube Music',
    instance: false,
    buttons: [
      { label: 'Listen on YouTube Music', url: details.url }
    ],
    startTimestamp: details.startTimestamp
  });
}


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  // load youtube music
  mainWindow.loadURL('https://music.youtube.com');

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
