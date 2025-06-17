// elder-app/preload.js

const { contextBridge, ipcRenderer } = require('electron');

// Expose selected ipcRenderer methods to the renderer process safely
contextBridge.exposeInMainWorld('electronAPI', {
    // Listen for server connection status updates from the main process
    onServerStatusUpdate: (callback) => ipcRenderer.on('server_status_update', (event, status) => callback(status)),
    // Listen for care-giver device connection status updates from the main process
    onCaregiverStatusUpdate: (callback) => ipcRenderer.on('caregiver_status_update', (event, status) => callback(status)),
    // Listen for general log messages from the main process
    onLogMessage: (callback) => ipcRenderer.on('log_message', (event, message) => callback(message))
});
