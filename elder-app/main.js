// elder-app/main.js

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { io } = require("socket.io-client");
const net = require('net'); // For IPC socket communication with native_bridge.js

// --- Global Variables ---
let mainWindow;
let socket;
const SERVER_URL = 'http://localhost:3000'; // Your Socket.io server URL
let careGiverConnected = false; // Track care-giver connection status

// IPC channel name for communication with the native bridge
const IPC_CHANNEL_NAME = 'netflix-remote-ipc-channel';
let ipcServer = null; // IPC server for receiving messages from native_bridge.js

// --- Utility function for logging to renderer ---
function logToRenderer(message) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send('log_message', message);
  }
  console.log(`[Elder App Log]: ${message}`);
}

// --- Create Main Window Function ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    minWidth: 350, // Minimum width for responsiveness
    minHeight: 250, // Minimum height for responsiveness
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Preload script for secure IPC
      nodeIntegration: false, // Security best practice: disable Node.js integration in renderer
      contextIsolation: true, // Security best practice: isolate context
      enableRemoteModule: false // Security best practice: disable remote module
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
    logToRenderer('Elder window closed, mainWindow set to null.');
  });
}

// --- Socket.io Connection Logic ---
function connectToServer() {
  logToRenderer('Attempting to connect to Socket.io server...');
  socket = io(SERVER_URL, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket']
  });

  socket.on('connect', () => {
    logToRenderer(`Connected to server: ${socket.id}`);
    socket.emit('register_elder'); // Register this client as the elder
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('server_status_update', { connected: true });
    }
  });

  socket.on('disconnect', (reason) => {
    logToRenderer(`Disconnected from server: ${reason}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('server_status_update', { connected: false });
    }
    careGiverConnected = false;
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('caregiver_status_update', { connected: false });
    }
  });

  socket.on('connect_error', (error) => {
    logToRenderer(`Socket connection error: ${error.message}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('server_status_update', { connected: false, error: error.message });
    }
  });

  socket.on('connection_status', (status) => {
    logToRenderer(`Received connection status from server: Care-Giver: ${status.careGiverConnected}, Elder: ${status.elderConnected}`);
    careGiverConnected = status.careGiverConnected;
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('caregiver_status_update', { connected: status.careGiverConnected });
    }
  });

  // Listen for 'play_video' event from the server
  socket.on('play_video', (url) => {
    logToRenderer(`Received video URL: ${url}`);
    openNetflixVideo(url);
  });

  // Listen for 'execute_command' event from the server
  socket.on('execute_command', (command) => {
    logToRenderer(`Received command from Care-Giver: ${command}`);
    // Now, send this command to the browser extension via the IPC bridge
    sendCommandToBrowserExtension(command);
  });
}

// --- IPC Server Setup (for receiving messages from native_bridge.js) ---
function setupIpcServer() {
  ipcServer = net.createServer((c) => {
    logToRenderer('IPC Client connected to Elder Electron App.');
    c.on('end', () => {
      logToRenderer('IPC Client disconnected from Elder Electron App.');
    });
    c.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        logToRenderer(`Received from native bridge (extension): ${JSON.stringify(message)}`);
        // Handle messages sent back from the extension if needed
        // For example, if the extension sends a "video played" confirmation.
      } catch (e) {
        logToRenderer(`IPC Data parse error: ${e.message}`);
      }
    });
    c.on('error', (err) => {
      logToRenderer(`IPC Client error: ${err.message}`);
    });
  });

  ipcServer.listen(`\\\\.\\pipe\\${IPC_CHANNEL_NAME}`, () => {
    logToRenderer(`IPC server listening on pipe: ${IPC_CHANNEL_NAME}`);
  });

  ipcServer.on('error', (err) => {
    logToRenderer(`IPC Server error: ${err.message}. This might mean the pipe is already in use.`);
  });
}

// --- Netflix Video Handling ---
async function openNetflixVideo(url) {
  // Check if the URL is a Netflix URL
  if (!url.startsWith('https://www.netflix.com/watch/')) {
    logToRenderer(`Warning: Received non-Netflix 'watch' URL: ${url}.`);
    return;
  }

  logToRenderer(`Opening Netflix URL in default browser: ${url}`);
  try {
    // Open the URL in the default browser.
    // The browser extension will handle fullscreen and playback controls.
    await shell.openExternal(url);
    logToRenderer('Netflix URL opened. Browser extension should take over.');

  } catch (error) {
    logToRenderer(`Error opening URL: ${error.message}`);
  }
}

// --- Send Command to Browser Extension (via IPC to native_bridge.js) ---
let ipcClientToBridge = null; // Client connection to the native_bridge.js

function connectToNativeBridge() {
  ipcClientToBridge = new net.Socket();
  ipcClientToBridge.connect({ path: `\\\\.\\pipe\\${IPC_CHANNEL_NAME}` }, () => {
    logToRenderer('Connected to native_bridge.js IPC channel.');
  });

  ipcClientToBridge.on('error', (err) => {
    logToRenderer(`Error connecting to native_bridge.js IPC: ${err.message}. Is native_bridge.js running?`);
    // Attempt to reconnect after a delay if connection drops
    setTimeout(connectToNativeBridge, 2000);
  });

  ipcClientToBridge.on('close', () => {
    logToRenderer('Connection to native_bridge.js IPC closed.');
    ipcClientToBridge = null; // Reset client on close
    // Attempt to reconnect if needed
    // setTimeout(connectToNativeBridge, 2000);
  });
}

function sendCommandToBrowserExtension(command) {
  if (ipcClientToBridge && !ipcClientToBridge.destroyed && ipcClientToBridge.writable) {
    try {
      const message = { command: command };
      ipcClientToBridge.write(JSON.stringify(message) + '\n'); // Send JSON string followed by newline
      logToRenderer(`Sent command '${command}' to native bridge.`);
    } catch (e) {
      logToRenderer(`Error sending command to native bridge: ${e.message}`);
    }
  } else {
    logToRenderer(`Native bridge IPC not ready. Attempting to reconnect for command: ${command}`);
    // Ensure the connection is attempted if it's not ready
    if (!ipcClientToBridge || ipcClientToBridge.destroyed) {
        connectToNativeBridge();
    }
    // You might want to queue commands here if the connection is temporary down
  }
}


// --- App Lifecycle Events ---
app.whenReady().then(() => {
  createWindow();
  connectToServer(); // Connect to Socket.io server
  setupIpcServer(); // Start IPC server to listen for native bridge
  connectToNativeBridge(); // Attempt to connect to native bridge (which browser should launch)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      if (socket && socket.connected) {
        socket.disconnect(); // Disconnect socket cleanly
      }
      if (ipcServer) {
        ipcServer.close(() => logToRenderer('IPC Server closed.'));
      }
      if (ipcClientToBridge && !ipcClientToBridge.destroyed) {
        ipcClientToBridge.end(); // Close client connection
      }
      app.quit();
    }
  });

  app.on('will-quit', () => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
    if (ipcServer) {
      ipcServer.close();
    }
    if (ipcClientToBridge && !ipcClientToBridge.destroyed) {
      ipcClientToBridge.end();
    }
  });
});
