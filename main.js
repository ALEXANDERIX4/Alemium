const { app, BrowserWindow, session } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    title: 'Alenium',
    width: 1280,
    height: 800,
    minWidth: 450,
    minHeight: 350,
    autoHideMenuBar: true,
    backgroundColor: '#1f1f1f',
    webPreferences: {
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.removeMenu(); // Removes default "File Edit View" bar

  // Modern Chrome User-Agent
  session.defaultSession.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  );

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
