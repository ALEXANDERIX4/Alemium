const { app, BrowserWindow, session } = require('electron');
const path = require('path');

// Disable internal crash telemetry
app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-domain-reliability');
app.commandLine.appendSwitch('disable-sync');

function createWindow() {
  const win = new BrowserWindow({
    title: 'Alenium',
    width: 1280,
    height: 820,
    minWidth: 500,
    minHeight: 400,
    autoHideMenuBar: true,
    backgroundColor: '#0f0f11',
    webPreferences: {
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  win.removeMenu();

  const ses = session.defaultSession;

  // 1. Clean Chrome User-Agent string
  const cleanUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
  ses.setUserAgent(cleanUA);

  // 2. Google OAuth & Anti-Fingerprint Header Sanitizer
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    // Force standard Chrome User-Agent and strip Electron indicators
    details.requestHeaders['User-Agent'] = cleanUA;
    details.requestHeaders['Sec-Ch-Ua'] = '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"';
    details.requestHeaders['Sec-Ch-Ua-Mobile'] = '?0';
    details.requestHeaders['Sec-Ch-Ua-Platform'] = '"Windows"';
    details.requestHeaders['DNT'] = '1';
    details.requestHeaders['Sec-GPC'] = '1';
    
    // Delete any Electron tracing headers if present
    delete details.requestHeaders['X-Electron'];

    callback({ requestHeaders: details.requestHeaders });
  });

  // 3. AdShield Network Blocker
  const adBlockFilters = [
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

  ses.webRequest.onBeforeRequest({ urls: adBlockFilters }, (details, callback) => {
    callback({ cancel: true });
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
