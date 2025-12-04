import { app, BrowserWindow } from "electron";
import path from "path";
import { spawn } from "child_process";

let mainWindow: BrowserWindow | null = null;
let serverProcess: any = null;

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

  if (app.isPackaged) {
    // Production: Load from built files
    // In production, electron.main.js is in dist/electron.main.js
    // desktop-ui is in dist/desktop-ui
    await mainWindow.loadFile(path.join(__dirname, "desktop-ui/index.html"));
  } else {
    // Development: Load from Vite dev server
    const devURL = "http://localhost:5173";
    await mainWindow.loadURL(devURL);
  }
}

function startServer() {
  if (app.isPackaged) {
    // Production: Server is in resources/server
    const serverPath = path.join(process.resourcesPath, "server");
    const serverEntry = path.join(serverPath, "dist/index.js");

    console.log("Starting server from:", serverEntry);

    serverProcess = spawn("node", [serverEntry], {
      cwd: serverPath,
      stdio: "inherit", // Log server output to main process console
      env: { ...process.env, NODE_ENV: "production" }
    });

    serverProcess.on("error", (err: any) => {
      console.error("Failed to start server:", err);
    });
  } else {
    // Development: Server is started manually or via npm script
    console.log("Development mode: Skipping internal server start");
  }
}

app.whenReady().then(async () => {
  startServer();
  await createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
