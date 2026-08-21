const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aleniumAPI', {
  purgeCache: () => ipcRenderer.invoke('purge-all-cache')
});
