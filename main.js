const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');

// Low-RAM Engine Optimization Flags
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256');
app.commandLine.appendSwitch('renderer-process-limit', '4');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-features', 'UserAgentClientHint');

function createWindow() {
  const win = new BrowserWindow({
    title: 'Alenium',
    width: 1320,
    height: 840,
    minWidth: 500,
    minHeight: 400,
    autoHideMenuBar: true,
    backgroundColor: '#1f1f1f',
    webPreferences: {
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.removeMenu();

  const ses = session.defaultSession;

  // Modern Chrome User-Agent (Fixes Spotify & Google Sign-In)
  const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
  ses.setUserAgent(chromeUA);

  // Authentication & Anti-Fingerprint Headers
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = chromeUA;
    details.requestHeaders['Sec-Ch-Ua'] = '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"';
    details.requestHeaders['Sec-Ch-Ua-Mobile'] = '?0';
    details.requestHeaders['Sec-Ch-Ua-Platform'] = '"Windows"';
    delete details.requestHeaders['X-Electron'];
    callback({ requestHeaders: details.requestHeaders });
  });

  // Network AdShield Filters
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

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
