import { app, BrowserWindow } from "electron";
import path from "path";

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
  }

  });

  const devURL = "http://localhost:5173";
  await mainWindow.loadURL(devURL);
}

app.whenReady().then(async () => {
  await createWindow(); // ✅ UI only
});
