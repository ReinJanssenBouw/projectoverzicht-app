const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    icon: 'icon.ico',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.maximize();
  win.loadFile('BuitenApp.html');
}

app.whenReady().then(() => {
  createWindow();
});

// Renderer vraagt om update check
ipcMain.on('check-for-update', () => {
  autoUpdater.checkForUpdates();
});

// Renderer vraagt om installeren & herstarten
ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

autoUpdater.on('checking-for-update', () => {
  win?.webContents.send('update-status', { status: 'checking' });
});

autoUpdater.on('update-available', (info) => {
  win?.webContents.send('update-status', { status: 'available', version: info.version });
  autoUpdater.downloadUpdate();
});

autoUpdater.on('update-not-available', () => {
  win?.webContents.send('update-status', { status: 'not-available' });
});

autoUpdater.on('download-progress', (progress) => {
  win?.webContents.send('update-status', { status: 'downloading', percent: Math.round(progress.percent) });
});

autoUpdater.on('update-downloaded', (info) => {
  win?.webContents.send('update-status', { status: 'downloaded', version: info.version });
});

autoUpdater.on('error', (err) => {
  win?.webContents.send('update-status', { status: 'error', message: err.message });
});
