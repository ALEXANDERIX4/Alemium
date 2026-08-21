const { app, BrowserWindow, session } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    title: 'Alenium',
    width: 1280,
    height: 820,
    minWidth: 500,
    minHeight: 400,
    autoHideMenuBar: true,
    backgroundColor: '#121214',
    webPreferences: {
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.removeMenu();

  const ses = session.defaultSession;

  // Real Chrome Desktop User-Agent (Fixes Google Sign-In Block)
  const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
  ses.setUserAgent(chromeUA);

  // AdShield Network Blocker
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
    "*://*.adservice.google.*/*",
    "*://*pagead2.googlesyndication.*/*"
  ];

  ses.webRequest.onBeforeRequest({ urls: privacyFilters }, (details, callback) => {
    callback({ cancel: true });
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
