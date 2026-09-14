const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', (_, version) => cb(version)),
  onUpdateProgress: (cb) => ipcRenderer.on('update-progress', (_, pct) => cb(pct)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', (_, version) => cb(version)),
  installUpdate: () => ipcRenderer.send('install-update'),
  isElectron: true,
});
