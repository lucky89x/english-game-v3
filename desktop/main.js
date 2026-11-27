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
// (26/11) the daily copies can be listed and read back from the admin panel ("Khôi phục bản sao lưu")
ipcMain.on('eq-backups', (e) => { try { e.returnValue = fs.readdirSync(path.join(saveDir(), 'backups')).filter((f) => /^store-.*\.json$/.test(f)).sort().reverse(); } catch { e.returnValue = []; } });
ipcMain.on('eq-read-backup', (e, name) => { try { e.returnValue = /^store-[\w.-]+\.json$/.test(String(name)) ? fs.readFileSync(path.join(saveDir(), 'backups', String(name)), 'utf8') : ''; } catch { e.returnValue = ''; } });
// The 14 newest daily copies are kept, and the 10 newest of each other kind (rescue copies, copies made before a restore).
// (27/11: before, every rescue copy pushed one daily copy out, because all names were trimmed as one list.)
function trimBackups(bk) {
  const all = fs.readdirSync(bk), drop = (list, keep) => { for (const f of list.sort().slice(0, -keep)) fs.unlinkSync(path.join(bk, f)); };
  drop(all.filter((f) => /^store-\d{4}-\d\d-\d\d\.json$/.test(f)), 14);
  drop(all.filter((f) => /^store-rescue-\d+\.json$/.test(f)), 10); drop(all.filter((f) => /^store-before-\d+\.json$/.test(f)), 10);
}
// (27/11) Before the admin takes a child back from a backup, the save as it is now is put aside: a restore can be undone.
ipcMain.on('eq-keep-copy', (e) => {
  try { const dir = saveDir(), bk = path.join(dir, 'backups'), name = `store-before-${Date.now()}.json`; fs.mkdirSync(bk, { recursive: true });
    fs.copyFileSync(path.join(dir, 'store.json'), path.join(bk, name)); trimBackups(bk); e.returnValue = name;
  } catch (err) { console.warn('copy before restore failed', err.message); e.returnValue = ''; }
});
ipcMain.on('eq-write-save', (e, text) => {
  try {
    const dir = saveDir(), bk = path.join(dir, 'backups'); fs.mkdirSync(bk, { recursive: true });
    const cur = path.join(dir, 'store.json');      // (26/11) never lose a save with players to an empty or unreadable one: keep a rescue copy first
    try { const old = fs.readFileSync(cur, 'utf8'); const had = (JSON.parse(old).profiles || []).length; let now = 0; try { now = (JSON.parse(text).profiles || []).length; } catch { now = 0; }
      if (had > 0 && now === 0) fs.writeFileSync(path.join(bk, `store-rescue-${Date.now()}.json`), old); } catch { /* no file yet, or it was unreadable */ }
    const tmp = path.join(dir, 'store.json.tmp'); fs.writeFileSync(tmp, text); fs.renameSync(tmp, path.join(dir, 'store.json'));      // never leaves half a file
    const day = new Date().toISOString().slice(0, 10); fs.writeFileSync(path.join(bk, `store-${day}.json`), text);
    trimBackups(bk);
  } catch (err) { console.warn('save file failed', err.message); }
});

// The family's own music (18/11): audio files the parent puts in Documents/EnglishQuest/music, with the words in a .txt
// file of the same name if they have them. The game ships no songs or lyrics of its own beyond its free ones.
const musicDir = () => path.join(saveDir(), 'music');
const AUDIO = /\.(mp3|m4a|ogg|wav|aac)$/i;
ipcMain.on('eq-music-list', (e) => {
  try {
    const dir = musicDir(); fs.mkdirSync(dir, { recursive: true });
    e.returnValue = fs.readdirSync(dir).filter((f) => AUDIO.test(f)).sort().map((f) => {
      const base = f.replace(AUDIO, ''), txt = path.join(dir, base + '.txt');
      return { title: base, url: 'app://music/' + encodeURIComponent(f), lyrics: fs.existsSync(txt) ? fs.readFileSync(txt, 'utf8') : '' };
    });
  } catch { e.returnValue = []; }
});
ipcMain.on('eq-music-folder', (e) => { e.returnValue = musicDir(); });
// (27/11) The parent's review notes (F1 in the admin account): each export is one file in Documents/EnglishQuest/gop-y.
ipcMain.on('eq-save-notes', (e, name, text) => {
  try { if (!/^english-quest-gop-y-[\d-]+\.json$/.test(String(name)) || String(text).length > 40e6) { e.returnValue = ''; return; }
    const dir = path.join(saveDir(), 'gop-y'); fs.mkdirSync(dir, { recursive: true }); const file = path.join(dir, String(name)); fs.writeFileSync(file, String(text)); e.returnValue = file; shell.showItemInFolder(file);
  } catch (err) { console.warn('notes file failed', err.message); e.returnValue = ''; }
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
    if (input.key === 'F12' && !app.isPackaged) { win.webContents.toggleDevTools(); e.preventDefault(); }      // (26/11) the installed game has no developer tools (a child could type gold in)
  });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//i.test(url)) shell.openExternal(url); return { action: 'deny' }; });      // only web pages, never files or other schemes
  win.on('minimize', () => win.webContents.send('eq-hidden', true)); win.on('restore', () => win.webContents.send('eq-hidden', false));
}

// (26/11) one window only: two windows each kept the whole save in memory and the one that saved last wiped the other's progress
if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const u = new URL(req.url), rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const base = u.host === 'music' ? musicDir() : ROOT, file = path.normalize(path.join(base, rel));      // app://music/… is the family's music folder
    if (!file.startsWith(base)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => app.quit());
