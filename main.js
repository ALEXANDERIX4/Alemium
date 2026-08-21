const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    title: 'Alenium',
    width: 1320,
    height: 840,
    backgroundColor: '#1f1f1f',
    autoHideMenuBar: true,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.removeMenu();
  
  // Absolute path loading so it never loses the UI file
  win.loadFile(path.join(__dirname, 'index.html'));

  // Keeping DevTools open just in case there is an HTML error
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
