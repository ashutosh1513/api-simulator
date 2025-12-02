const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // expose nothing for now
});
