// care-giver-app/main.js

const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const { io } = require("socket.io-client"); // Import socket.io-client

// --- Global Variables ---
let mainWindow;
let socket;
const SERVER_URL = 'http://localhost:3000'; // Your Socket.io server URL
let elderConnected = false; // Track elder connection status

// --- Create Main Window Function ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 400, // Minimum width for responsiveness
    minHeight: 300, // Minimum height for responsiveness
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Preload script for secure IPC
      nodeIntegration: false, // Security best practice: disable Node.js integration in renderer
      contextIsolation: true, // Security best practice: isolate context
      enableRemoteModule: false // Security best practice: disable remote module
    }
  });

  // Load the index.html file into the Electron window
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools automatically if not in production
  // if (!app.isPackaged) {
  //   mainWindow.webContents.openDevTools();
  // }

  // Handle window close event to nullify mainWindow
  mainWindow.on('closed', () => {
    mainWindow = null;
    console.log('Care-Giver window closed, mainWindow set to null.');
  });
}

// --- Socket.io Connection Logic ---
function connectToServer() {
  console.log('Attempting to connect to Socket.io server...');
  socket = io(SERVER_URL, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket']
  });

  socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
    // Register this client as the care-giver
    socket.emit('register_caregiver');
    // Inform the renderer process about connection status
    if (mainWindow && !mainWindow.isDestroyed()) { // Check if window exists and is not destroyed
        mainWindow.webContents.send('server_status_update', { connected: true });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected from server:', reason);
    // Inform the renderer process about disconnection
    if (mainWindow && !mainWindow.isDestroyed()) { // Check if window exists and is not destroyed
        mainWindow.webContents.send('server_status_update', { connected: false });
    }
    // Reset elder connection status on server disconnect
    elderConnected = false;
    if (mainWindow && !mainWindow.isDestroyed()) { // Check if window exists and is not destroyed
        mainWindow.webContents.send('elder_status_update', { connected: false });
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    // Inform the renderer process about connection error
    if (mainWindow && !mainWindow.isDestroyed()) { // Check if window exists and is not destroyed
        mainWindow.webContents.send('server_status_update', { connected: false, error: error.message });
    }
  });

  // Listen for connection status updates from the server
  socket.on('connection_status', (status) => {
    console.log('Received connection status from server:', status);
    elderConnected = status.elderConnected;
    // Update renderer with elder connection status
    if (mainWindow && !mainWindow.isDestroyed()) { // Check if window exists and is not destroyed
        mainWindow.webContents.send('elder_status_update', { connected: status.elderConnected });
    }
  });
}

// --- App Lifecycle Events ---
app.whenReady().then(() => {
  createWindow();
  connectToServer(); // Connect to Socket.io server when app is ready

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('window-all-closed', () => {
    // On macOS, applications and their menu bar are common to stay active until
    // the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      if (socket && socket.connected) {
        socket.disconnect(); // Disconnect socket cleanly on app close
      }
      app.quit();
    }
  });

  app.on('will-quit', () => {
    // Unregister all shortcuts when the application is about to quit
    globalShortcut.unregisterAll();
    if (socket && socket.connected) {
      socket.disconnect(); // Ensure socket is disconnected
    }
  });

  // Register a global shortcut to detect URL and send command
  // This is a placeholder for actual browser detection.
  // In a real scenario, you'd need a browser extension or more complex
  // native methods to get the active tab URL and media events.
  // For this POC, we'll simulate it via a manual trigger or a more
  // advanced native module (which is out of scope for this initial step).
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    console.log('Global shortcut triggered: CommandOrControl+Shift+N');
    // In a real scenario, you'd get the actual Netflix URL from the active browser tab.
    // For now, we'll use a placeholder or rely on the manual button in the UI.
    // ipcMain.emit('send_video_url_to_server', 'https://www.netflix.com/watch/80192098'); // Example URL
  });
});

// --- IPC Main Handlers (from renderer to main process) ---

// Handle sending video URL from renderer to server
ipcMain.on('send_video_url', (event, url) => {
  if (socket && socket.connected && elderConnected) {
    console.log('Main process sending video URL to server:', url);
    socket.emit('video_url', url);
  } else {
    console.warn('Cannot send video URL: Not connected to server or elder is not connected.');
    if (mainWindow && !mainWindow.isDestroyed()) { // Check before sending message
        mainWindow.webContents.send('status_message', 'Error: Not connected to server or Elder not connected.');
    }
  }
});

// Handle sending playback commands from renderer to server
ipcMain.on('send_playback_command', (event, command) => {
  if (socket && socket.connected && elderConnected) {
    console.log('Main process sending playback command to server:', command);
    socket.emit('playback_command', command);
  } else {
    console.warn('Cannot send playback command: Not connected to server or elder is not connected.');
    if (mainWindow && !mainWindow.isDestroyed()) { // Check before sending message
        mainWindow.webContents.send('status_message', 'Error: Not connected to server or Elder not connected.');
    }
  }
});
