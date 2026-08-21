const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');

// Disable telemetry & tracking
app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-domain-reliability');
app.commandLine.appendSwitch('disable-sync');

function createWindow() {
  const win = new BrowserWindow({
    title: 'Alenium',
    width: 1280,
    height: 820,
    minWidth: 600,
    minHeight: 400,
    autoHideMenuBar: true,
    backgroundColor: '#121214',
    webPreferences: {
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.removeMenu();

  const ses = session.defaultSession;

  // Real Chrome Desktop User-Agent (Fixes Google Sign-In Block)
  const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
  ses.setUserAgent(chromeUA);

  // Privacy headers & Google sign-in header cleanup
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['DNT'] = '1';
    details.requestHeaders['Sec-GPC'] = '1';
    details.requestHeaders['User-Agent'] = chromeUA;
    callback({ requestHeaders: details.requestHeaders });
  });

  // Anti-Tracking & Ad Filter
  const privacyFilters = [
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
    "*://*.telemetry.*/*",
    "*://*.scorecardresearch.com/*",
    "*://*.hotjar.com/*",
    "*://*.adservice.google.*/*",
    "*://*pagead2.googlesyndication.*/*"
  ];

  let adBlockActive = true;
  ses.webRequest.onBeforeRequest({ urls: privacyFilters }, (details, callback) => {
    callback({ cancel: adBlockActive });
  });

  // Deep Cache Cleaner IPC
  ipcMain.handle('purge-all-cache', async () => {
    await ses.clearCache();
    await ses.clearStorageData({
      storages: ['appcache', 'cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage']
    });
    return true;
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
