// care-giver-app/preload.js

const { contextBridge, ipcRenderer } = require('electron');

// Expose selected ipcRenderer methods to the renderer process safely
contextBridge.exposeInMainWorld('electronAPI', {
    // Function to send video URL to the main process
    sendVideoUrl: (url) => ipcRenderer.send('send_video_url', url),
    // Function to send playback commands to the main process
    sendPlaybackCommand: (command) => ipcRenderer.send('send_playback_command', command),

    // Listen for server connection status updates from the main process
    onServerStatusUpdate: (callback) => ipcRenderer.on('server_status_update', (event, status) => callback(status)),
    // Listen for elder device connection status updates from the main process
    onElderStatusUpdate: (callback) => ipcRenderer.on('elder_status_update', (event, status) => callback(status)),
    // Listen for general status messages (e.g., errors) from the main process
    onStatusMessage: (callback) => ipcRenderer.on('status_message', (event, message) => callback(message))
});
