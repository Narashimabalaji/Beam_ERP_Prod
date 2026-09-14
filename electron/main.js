const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow;
let backendProcess;

function getBackendExePath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend', 'backend.exe');
  }
  return path.join(__dirname, '..', 'backend', 'dist', 'backend', 'backend.exe');
}

function getDataDir() {
  const dataDir = path.join(app.getPath('userData'), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return dataDir;
}

function startBackend() {
  const exePath = getBackendExePath();
  const dataDir = getDataDir();
  console.log('Starting backend:', exePath);
  backendProcess = spawn(exePath, [], {
    env: { ...process.env, BEAM_ERP_DATA_DIR: dataDir },
    windowsHide: true,
    stdio: 'pipe',
  });
  backendProcess.stdout.on('data', d => console.log('[Backend]', d.toString()));
  backendProcess.stderr.on('data', d => console.error('[Backend ERR]', d.toString()));
}

function waitForBackend(callback, retries = 40) {
  const req = http.get('http://localhost:8000/', () => { callback(); });
  req.on('error', () => {
    if (retries > 0) setTimeout(() => waitForBackend(callback, retries - 1), 500);
    else callback();
  });
  req.end();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 920, minWidth: 1024, minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Beam ERP',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    show: false,
    backgroundColor: '#f7f5f3',
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.on('closed', () => { mainWindow = null; });
  waitForBackend(() => {
    mainWindow.loadURL('http://localhost:8000');
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
  setTimeout(() => autoUpdater.checkForUpdates(), 3000);
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  app.quit();
});

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = false;

autoUpdater.on('update-available', info => {
  if (mainWindow) mainWindow.webContents.send('update-available', info.version);
});
autoUpdater.on('download-progress', p => {
  if (mainWindow) mainWindow.webContents.send('update-progress', Math.round(p.percent));
});
autoUpdater.on('update-downloaded', info => {
  if (mainWindow) mainWindow.webContents.send('update-downloaded', info.version);
});
autoUpdater.on('error', err => console.error('Updater error:', err.message));

ipcMain.on('install-update', () => {
  if (backendProcess) backendProcess.kill();
  autoUpdater.quitAndInstall(false, true);
});
