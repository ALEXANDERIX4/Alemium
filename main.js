const { app, BrowserWindow, session } = require('electron');
const path = require('path');

// Disable hardware acceleration glitches and background crash logging
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
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Allows iframe loading across domains
    }
  });

  win.removeMenu();

  const ses = session.defaultSession;

  // 1. Chrome Desktop User-Agent
  const cleanUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
  ses.setUserAgent(cleanUA);

  // 2. Strip X-Frame-Options and CSP headers so ALL sites load smoothly inside tabs
  ses.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = Object.assign({}, details.responseHeaders);
    
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['X-Frame-Options'];
    delete responseHeaders['content-security-policy'];
    delete responseHeaders['Content-Security-Policy'];

    callback({ cancel: false, responseHeaders });
  });

  // 3. Google Sign-In & Anti-Fingerprint Headers
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = cleanUA;
    details.requestHeaders['Sec-Ch-Ua'] = '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"';
    details.requestHeaders['Sec-Ch-Ua-Mobile'] = '?0';
    details.requestHeaders['Sec-Ch-Ua-Platform'] = '"Windows"';
    details.requestHeaders['DNT'] = '1';
    details.requestHeaders['Sec-GPC'] = '1';
    delete details.requestHeaders['X-Electron'];

    callback({ requestHeaders: details.requestHeaders });
  });

  // 4. AdShield Network Blocker
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
