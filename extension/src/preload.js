// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    extractFiles: (data, fileName) => ipcRenderer.invoke('extract-files', { data, fileName }),
    selectFile: () => ipcRenderer.invoke('select-file'),
    onOpenFile: (callback) => ipcRenderer.on('open-file', (event, data) => callback(data))
});