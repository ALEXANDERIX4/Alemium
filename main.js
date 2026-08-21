const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    title: 'Alenium',
    width: 1320,
    height: 840,
    minWidth: 500,
    minHeight: 400,
    icon: path.join(__dirname, 'icon.ico'),
    backgroundColor: '#1f1f1f',
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const ses = session.defaultSession;
  ses.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');

  // AdShield Network Filters
  const adFilters = [
    "*://*.doubleclick.net/*",
    "*://*.googlesyndication.com/*",
    "*://*.google-analytics.com/*",
    "*://*.adnxs.com/*",
    "*://*.ads.pubmatic.com/*",
    "*://*.rubiconproject.com/*",
    "*://*.criteo.com/*",
    "*://*.taboola.com/*",
    "*://*.outbrain.com/*",
    "*://*.adroll.com/*",
    "*://*.popads.net/*",
    "*://*.adservice.google.*/*",
    "*://*pagead2.googlesyndication.*/*"
  ];

  let adBlockActive = true;
  ses.webRequest.onBeforeRequest({ urls: adFilters }, (details, callback) => {
    callback({ cancel: adBlockActive });
  });

  ipcMain.on('set-adblock', (event, status) => { adBlockActive = status; });
  ipcMain.on('clear-cache', async (event) => {
    await ses.clearCache();
    await ses.clearStorageData({ storages: ['cookies', 'localstorage', 'cache'] });
    event.sender.send('cache-cleared');
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
