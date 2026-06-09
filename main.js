const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    icon: 'icon.ico'
  });

  win.maximize();
  win.loadFile('BuitenApp.html');

  autoUpdater.checkForUpdates();
}

app.whenReady().then(() => {
  createWindow();
});

autoUpdater.on('checking-for-update', () => {
  console.log('Controleren op updates...');
});

autoUpdater.on('update-available', () => {
  console.log('Update gevonden, downloaden...');
  autoUpdater.downloadUpdate();
});

autoUpdater.on('update-downloaded', () => {
  console.log('Update gedownload');

  dialog.showMessageBox({
    type: 'info',
    title: 'Update gereed',
    message: 'De update is gedownload. De app wordt nu bijgewerkt.'
  }).then(() => {
    autoUpdater.quitAndInstall();
  });
});

autoUpdater.on('error', (err) => {
  console.log('Update fout:', err);

  dialog.showMessageBox({
    type: 'error',
    title: 'Update fout',
    message: err.toString()
  });
});