const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('buitenApp', {
  minimize:         () => ipcRenderer.send('minimize-window'),
  close:            () => ipcRenderer.send('close-window'),
  checkForUpdate:   () => ipcRenderer.send('check-for-update'),
  restartForUpdate: () => ipcRenderer.send('restart-for-update'),
  onUpdateStatus: (callback) => {
    ipcRenderer.removeAllListeners('update-btn-status');
    ipcRenderer.on('update-btn-status', (_e, data) => callback(data));
  }
});
