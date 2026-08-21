const { app, BrowserWindow, session } = require('electron');

// 1. THE BLACK SCREEN KILLER (Forces safe rendering)
app.disableHardwareAcceleration();

// 2. EXTREME RAM OPTIMIZATIONS
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256');
app.commandLine.appendSwitch('renderer-process-limit', '2'); 

// 3. MEDIA AUTOPLAY (For Spotify/YouTube)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// 4. GOOGLE / SPOTIFY AUTHENTICATION FIX
const REAL_CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
app.userAgentFallback = REAL_CHROME_UA;

function createWindow() {
  const win = new BrowserWindow({
    title: 'Alenium',
    width: 1280,
    height: 800,
    backgroundColor: '#1f1f1f',
    autoHideMenuBar: true,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false 
    }
  });

  win.removeMenu();

  const ses = session.defaultSession;
  
  // STRIP ELECTRON IDENTIFIERS FROM NETWORK REQUESTS
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = REAL_CHROME_UA;
    delete details.requestHeaders['X-Electron'];
    callback({ requestHeaders: details.requestHeaders });
  });

  // LIGHTWEIGHT ADBLOCK ENGINE
  const adBlockFilters = [
    "*://*.doubleclick.net/*",
    "*://*.googlesyndication.com/*",
    "*://*.google-analytics.com/*",
    "*://*.adnxs.com/*",
    "*://*.ads.pubmatic.com/*",
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
