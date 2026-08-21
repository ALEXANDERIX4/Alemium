const { app, BrowserWindow, WebContentsView, ipcMain, session } = require('electron');
const path = require('path');

// Disable GPU raster locks causing black-screen hangs on Windows
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-domain-reliability');
app.commandLine.appendSwitch('disable-sync');

// Enable standard audio/video autoplay
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let win;
let activeView = null;
const tabs = new Map();
let darkModeActive = true;

function createWindow() {
  win = new BrowserWindow({
    title: 'Alenium',
    width: 1280,
    height: 820,
    minWidth: 500,
    minHeight: 400,
    autoHideMenuBar: true,
    backgroundColor: '#0f0f11',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.removeMenu();

  const ses = session.defaultSession;
  const cleanUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
  ses.setUserAgent(cleanUA);

  // Headers for Google sign-in and Spotify Web Player support
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

  // Network AdShield
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

  function updateViewBounds() {
    if (activeView) {
      const bounds = win.getContentBounds();
      activeView.setBounds({ x: 0, y: 78, width: bounds.width, height: bounds.height - 78 });
    }
  }

  win.on('resize', updateViewBounds);

  function injectScripts(webContents) {
    // YouTube Ad auto-skipper
    webContents.executeJavaScript(`
      setInterval(() => {
        const skipBtn = document.querySelector('.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern');
        if (skipBtn) skipBtn.click();
        const adShowing = document.querySelector('.ad-showing, .ad-interrupting');
        const video = document.querySelector('video');
        if (adShowing && video && !isNaN(video.duration)) {
          video.muted = true;
          video.playbackRate = 16.0;
          video.currentTime = video.duration - 0.1;
        }
      }, 250);
    `);

    // Forced Dark Mode
    if (darkModeActive) {
      webContents.insertCSS(`
        html { filter: invert(0.9) hue-rotate(180deg) !important; background: #111 !important; }
        img, video, canvas, svg, [style*="background-image"] { filter: invert(1.1) hue-rotate(180deg) !important; }
      `);
    }
  }

  ipcMain.on('create-tab', (event, { id, url }) => {
    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    view.webContents.setUserAgent(cleanUA);
    view.webContents.loadURL(url || 'https://search.brave.com');

    view.webContents.on('did-finish-load', () => {
      injectScripts(view.webContents);
    });

    view.webContents.on('did-navigate', (e, navUrl) => {
      win.webContents.send('url-changed', { id, url: navUrl });
    });

    view.webContents.on('page-title-updated', (e, title) => {
      win.webContents.send('title-changed', { id, title });
    });

    tabs.set(id, view);
    switchTab(id);
  });

  function switchTab(id) {
    if (activeView) {
      win.contentView.removeChildView(activeView);
    }
    const view = tabs.get(id);
    if (view) {
      activeView = view;
      win.contentView.addChildView(view);
      updateViewBounds();
    }
  }

  ipcMain.on('switch-tab', (event, id) => switchTab(id));

  ipcMain.on('close-tab', (event, id) => {
    const view = tabs.get(id);
    if (view) {
      if (activeView === view) {
        win.contentView.removeChildView(view);
        activeView = null;
      }
      tabs.delete(id);
    }
  });

  ipcMain.on('navigate-active', (event, targetUrl) => {
    if (activeView) activeView.webContents.loadURL(targetUrl);
  });

  ipcMain.on('toggle-dark-mode', (event, state) => {
    darkModeActive = state;
    tabs.forEach(v => v.webContents.reload());
  });

  ipcMain.on('nav-back', () => { if (activeView && activeView.webContents.canGoBack()) activeView.webContents.goBack(); });
  ipcMain.on('nav-forward', () => { if (activeView && activeView.webContents.canGoForward()) activeView.webContents.goForward(); });
  ipcMain.on('nav-reload', () => { if (activeView) activeView.webContents.reload(); });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
