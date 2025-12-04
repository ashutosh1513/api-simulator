// preload.js (placed at project root / built into dist)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // one-way: renderer -> main
  invoke: (channel, payload) => {
    // whitelist channels
    const allowed = ['server:start', 'server:stop', 'get-logs', 'exec-api-test'];
    if (!allowed.includes(channel)) return Promise.reject('Invalid channel');
    return ipcRenderer.invoke(channel, payload);
  },
  // one-way: main -> renderer events
  on: (channel, cb) => {
    const allowed = ['server:status', 'api:test-result'];
    if (!allowed.includes(channel)) return;
    const handler = (e, data) => cb(data);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  }
});
