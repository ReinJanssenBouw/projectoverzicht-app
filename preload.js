const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('buitenApp', {
  checkForUpdate:   () => ipcRenderer.send('check-for-update'),
  restartForUpdate: () => ipcRenderer.send('restart-for-update'),
  onUpdateStatus: (callback) => {
    ipcRenderer.removeAllListeners('update-btn-status');
    ipcRenderer.on('update-btn-status', (_e, data) => callback(data));
  }
});
