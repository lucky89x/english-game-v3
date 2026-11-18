// Gives the game a real file for the save (18/11: "after an update the game must not start from zero").
// The game keeps its progress in the page's storage as before; every save is also written to a file in
// Documents/EnglishQuest, and when the page storage is empty (new install, cleared data) the file is read back.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('eqDesktop', {
  readSave: () => ipcRenderer.sendSync('eq-read-save'),
  writeSave: (text) => ipcRenderer.send('eq-write-save', String(text)),
  saveFolder: () => ipcRenderer.sendSync('eq-save-folder'),
  musicList: () => ipcRenderer.sendSync('eq-music-list'),
  musicFolder: () => ipcRenderer.sendSync('eq-music-folder'),
});
