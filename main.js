const { app, BrowserWindow, WebContentsView, session, ipcMain } = require('electron');
const path = require('path');

// Prevent black screen graphics crashes
app.disableHardwareAcceleration(); 
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let win;
const views = new Map();
let activeViewId = null;
const UI_HEIGHT = 83; // Exact pixel height of your custom toolbar

const REAL_CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
app.userAgentFallback = REAL_CHROME_UA;

function createWindow() {
  win = new BrowserWindow({
    title: 'Alenium',
    width: 1320, height: 840,
    backgroundColor: '#1f1f1f',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // Allows the UI to communicate with the backend
    }
  });

  win.removeMenu();

  const ses = session.defaultSession;
  
  // Wipe all trace of Electron so Google Auth works
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = REAL_CHROME_UA;
    delete details.requestHeaders['X-Electron'];
    callback({ requestHeaders: details.requestHeaders });
  });

  // Global AdBlocker
  const adFilters = [
    "*://*.doubleclick.net/*", "*://*.googlesyndication.com/*", "*://*.google-analytics.com/*",
    "*://*.adnxs.com/*", "*://*.ads.pubmatic.com/*", "*://*.adservice.google.*/*"
  ];
  ses.webRequest.onBeforeRequest({ urls: adFilters }, (details, callback) => {
    callback({ cancel: true });
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  // Automatically resize the web page when the window resizes
  win.on('resize', () => {
    if (activeViewId && views.has(activeViewId)) {
      const bounds = win.getContentBounds();
      views.get(activeViewId).setBounds({ x: 0, y: UI_HEIGHT, width: bounds.width, height: bounds.height - UI_HEIGHT });
    }
  });
}

function updateViewBounds(view) {
  const bounds = win.getContentBounds();
  view.setBounds({ x: 0, y: UI_HEIGHT, width: bounds.width, height: bounds.height - UI_HEIGHT });
}

// ---------------------------
// IPC Handlers for Tabs
// ---------------------------
ipcMain.on('create-tab', (e, id, url) => {
  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true // Ensures Google Auth trusts the window
    }
  });
  
  views.set(id, view);
  view.webContents.setUserAgent(REAL_CHROME_UA);
  
  view.webContents.on('did-navigate', (event, navUrl) => win.webContents.send('url-changed', id, navUrl));
  view.webContents.on('page-title-updated', (event, title) => win.webContents.send('title-changed', id, title));
  
  // Auto-skip YouTube Ads natively
  view.webContents.on('dom-ready', () => {
    view.webContents.executeJavaScript(`
      setInterval(() => {
        const skip = document.querySelector('.ytp-skip-ad-button, .ytp-ad-skip-button');
        if (skip) skip.click();
        const vid = document.querySelector('video');
        if (document.querySelector('.ad-showing') && vid) {
          vid.muted = true; vid.playbackRate = 16.0; vid.currentTime = vid.duration - 0.1;
        }
      }, 250);
    `).catch(() => {});
  });

  view.webContents.loadURL(url);
});

ipcMain.on('switch-tab', (e, id) => {
  if (activeViewId && views.has(activeViewId)) {
    win.contentView.removeChildView(views.get(activeViewId));
  }
  activeViewId = id;
  const view = views.get(id);
  if (view) {
    win.contentView.addChildView(view);
    updateViewBounds(view);
  }
});

ipcMain.on('close-tab', (e, id) => {
  const view = views.get(id);
  if (view) {
    if (activeViewId === id) win.contentView.removeChildView(view);
    view.webContents.destroy();
    views.delete(id);
  }
});

ipcMain.on('navigate-tab', (e, id, url) => {
  if (views.has(id)) views.get(id).webContents.loadURL(url);
});

ipcMain.on('nav-action', (e, id, action) => {
  const view = views.has(id) ? views.get(id) : null;
  if (!view) return;
  if (action === 'back' && view.webContents.canGoBack()) view.webContents.goBack();
  if (action === 'forward' && view.webContents.canGoForward()) view.webContents.goForward();
  if (action === 'reload') view.webContents.reload();
});

// Temporarily hide the webview when opening Settings/History modals
ipcMain.on('toggle-ui-overlay', (e, isModalOpen) => {
  if (activeViewId && views.has(activeViewId)) {
    const view = views.get(activeViewId);
    if (isModalOpen) {
      view.setBounds({ x: 0, y: 0, width: 0, height: 0 }); 
    } else {
      updateViewBounds(view);
    }
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
