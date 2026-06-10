const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs   = require('fs');

autoUpdater.autoDownload         = true;
autoUpdater.autoInstallOnAppQuit = false;

// ─── Just-updated vlag ───────────────────────────────────────────────────────

function getFlagPath() {
  return path.join(app.getPath('userData'), 'just-updated.flag');
}
function setJustUpdatedFlag() {
  try { fs.writeFileSync(getFlagPath(), '1'); } catch {}
}
function consumeJustUpdatedFlag() {
  const p = getFlagPath();
  if (fs.existsSync(p)) {
    try { fs.unlinkSync(p); } catch {}
    return true;
  }
  return false;
}

// ─── State ───────────────────────────────────────────────────────────────────

let mainWindow       = null;
let isUpdating       = false;
let lastUpdateStatus = null;
let forceQuit        = false;

function sendToMain(data) {
  lastUpdateStatus = data;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-btn-status', data);
  }
}

// ─── Hoofdvenster ────────────────────────────────────────────────────────────

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900,
    frame: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.maximize();
  mainWindow.loadFile(path.join(__dirname, 'BuitenApp.html'));

  mainWindow.webContents.on('before-input-event', (_e, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') mainWindow.webContents.toggleDevTools();
  });

  mainWindow.once('ready-to-show', () => {
    if (lastUpdateStatus) mainWindow.webContents.send('update-btn-status', lastUpdateStatus);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── IPC ─────────────────────────────────────────────────────────────────────

ipcMain.on('minimize-window', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.on('close-window',   () => { forceQuit = true; app.quit(); });

ipcMain.on('check-for-update', () => {
  if (!isUpdating) {
    checkGitHubForUpdate();
  } else if (lastUpdateStatus) {
    sendToMain(lastUpdateStatus);
  }
});

ipcMain.on('restart-for-update', () => {
  setJustUpdatedFlag();
  forceQuit = true;
  autoUpdater.quitAndInstall(true, true);
});

// ─── GitHub polling ───────────────────────────────────────────────────────────

async function checkGitHubForUpdate() {
  const current = app.getVersion();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://api.github.com/repos/ReinJanssenBouw/projectoverzicht-app/releases/latest', {
      headers: { 'User-Agent': 'BuitenApp' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      sendToMain({ type: 'idle', version: `BuitenApp v${current}` });
      return;
    }

    const data   = await res.json();
    const latest = (data.tag_name || '').replace(/^v/, '');

    if (latest && latest !== current) {
      // Meteen aan UI laten weten dat er een update is
      sendToMain({ type: 'downloading', percent: 0, version: latest });
      autoUpdater.checkForUpdates().catch(err => {
        console.error('[updater]', err);
        // Download mislukt maar update IS beschikbaar — toon knop om te herstarten
        sendToMain({ type: 'ready' });
      });
    } else {
      sendToMain({ type: 'idle', version: `BuitenApp v${current}` });
    }
  } catch (err) {
    console.error('[poll]', err.message);
    sendToMain({ type: 'idle', version: `BuitenApp v${current}` });
  }
}

// ─── Start ───────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createMainWindow();

  if (app.isPackaged) {
    autoUpdater.checkForUpdates().catch(err => console.error('[updater]', err));
    setInterval(() => {
      if (!isUpdating) checkGitHubForUpdate();
    }, 30 * 60 * 1000);
  }
});

app.on('window-all-closed', () => app.quit());

// ─── autoUpdater events ───────────────────────────────────────────────────────

autoUpdater.on('update-available', (info) => {
  isUpdating = true;
  sendToMain({ type: 'downloading', percent: 0, version: info.version });
});

autoUpdater.on('download-progress', (p) => {
  sendToMain({ type: 'downloading', percent: Math.round(p.percent) });
});

autoUpdater.on('update-downloaded', () => {
  isUpdating = false;
  sendToMain({ type: 'ready' });
});

autoUpdater.on('update-not-available', () => {
  sendToMain({ type: 'idle', version: `BuitenApp v${app.getVersion()}` });
});

autoUpdater.on('error', (err) => {
  isUpdating = false;
  sendToMain({ type: 'error', message: err.message || String(err) });
});
