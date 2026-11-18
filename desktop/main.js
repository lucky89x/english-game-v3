// English Quest desktop app (18/11: "an .exe with high graphics that does not stutter").
// The same game files run inside Chromium (Electron), but here the app decides how the graphics card is used:
// the dedicated GPU is requested, the GPU blocklist is ignored, background throttling is off, and frames are
// paced by the screen's refresh. The files are served from an app:// address (ES modules do not load from file://).
const { app, BrowserWindow, protocol, net, Menu, shell, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';      // the page only loads its own files

// GPU: use the strong card on laptops with two, and never fall back to drawing on the CPU because of a blocklist
app.commandLine.appendSwitch('force_high_performance_gpu');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

// Installed: the game sits in resources/game. While developing: the repository folder above this one.
const ROOT = app.isPackaged ? path.join(process.resourcesPath, 'game') : path.join(__dirname, '..');

// Save file: Documents/EnglishQuest/store.json (the newest save) and backups/store-YYYY-MM-DD.json (one per day,
// the last 14 days kept). Updating or reinstalling the app never touches this folder.
const saveDir = () => path.join(app.getPath('documents'), 'EnglishQuest');
ipcMain.on('eq-save-folder', (e) => { e.returnValue = saveDir(); });
ipcMain.on('eq-read-save', (e) => {
  try { e.returnValue = fs.readFileSync(path.join(saveDir(), 'store.json'), 'utf8'); } catch { e.returnValue = ''; }
});
ipcMain.on('eq-write-save', (e, text) => {
  try {
    const dir = saveDir(), bk = path.join(dir, 'backups'); fs.mkdirSync(bk, { recursive: true });
    const tmp = path.join(dir, 'store.json.tmp'); fs.writeFileSync(tmp, text); fs.renameSync(tmp, path.join(dir, 'store.json'));      // never leaves half a file
    const day = new Date().toISOString().slice(0, 10); fs.writeFileSync(path.join(bk, `store-${day}.json`), text);
    const old = fs.readdirSync(bk).filter((f) => /^store-.*\.json$/.test(f)).sort().slice(0, -14); for (const f of old) fs.unlinkSync(path.join(bk, f));
  } catch (err) { console.warn('save file failed', err.message); }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 960, minHeight: 600, backgroundColor: '#7ec3f5', title: 'English Quest', autoHideMenuBar: true,
    webPreferences: { backgroundThrottling: false, spellcheck: false, preload: path.join(__dirname, 'preload.js') },
  });
  Menu.setApplicationMenu(null);
  win.maximize();
  win.loadURL('app://game/index.html');
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.key === 'F5') { win.webContents.reloadIgnoringCache(); e.preventDefault(); }
    if (input.key === 'F12') { win.webContents.toggleDevTools(); e.preventDefault(); }
  });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => app.quit());
