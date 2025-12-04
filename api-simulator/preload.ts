import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    // Add any necessary APIs here
    // For now, we just expose a basic version check or similar if needed
    // or leave it empty but secure
    versions: process.versions,
});
