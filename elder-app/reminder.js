// elder-app/renderer.js
// This script will be loaded by index.html in a <script> tag

document.addEventListener('DOMContentLoaded', () => {
    const serverStatusElem = document.getElementById('serverStatus');
    const serverIndicatorElem = document.getElementById('serverIndicator');
    const caregiverStatusElem = document.getElementById('caregiverStatus');
    const caregiverIndicatorElem = document.getElementById('caregiverIndicator');
    const activityLogElem = document.getElementById('activityLog');

    // --- UI Update Functions ---
    function updateServerStatus(isConnected, message = 'Connected') {
        serverStatusElem.textContent = isConnected ? message : 'Disconnected';
        serverStatusElem.classList.toggle('text-green-500', isConnected);
        serverStatusElem.classList.toggle('text-red-500', !isConnected);
        serverStatusElem.classList.toggle('text-yellow-500', !isConnected && message === 'Connecting...');
        serverIndicatorElem.classList.toggle('status-connected', isConnected);
        serverIndicatorElem.classList.toggle('status-disconnected', !isConnected);
        serverIndicatorElem.classList.toggle('status-yellow', !isConnected && message === 'Connecting...');
    }

    function updateCaregiverStatus(isConnected) {
        caregiverStatusElem.textContent = isConnected ? 'Connected' : 'Disconnected';
        caregiverStatusElem.classList.toggle('text-green-500', isConnected);
        caregiverStatusElem.classList.toggle('text-red-500', !isConnected);
        caregiverIndicatorElem.classList.toggle('status-connected', isConnected);
        caregiverIndicatorElem.classList.toggle('status-disconnected', !isConnected);
    }

    // Function to add messages to the activity log
    function addLogMessage(message) {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        activityLogElem.prepend(p); // Add to the top
        // Limit log entries to keep performance good
        if (activityLogElem.children.length > 20) {
            activityLogElem.removeChild(activityLogElem.lastChild);
        }
    }

    // --- IPC Renderer Listeners (from main process) ---
    window.electronAPI.onServerStatusUpdate((status) => {
        updateServerStatus(status.connected, status.error ? `Error: ${status.error}` : 'Connected');
        if (!status.connected) {
            addLogMessage('Server disconnected.');
        } else {
            addLogMessage('Connected to server.');
        }
    });

    window.electronAPI.onCaregiverStatusUpdate((status) => {
        updateCaregiverStatus(status.connected);
        if (status.connected) {
            addLogMessage('Care-giver device connected.');
        } else {
            addLogMessage('Care-giver device disconnected.');
        }
    });

    window.electronAPI.onLogMessage((message) => {
        addLogMessage(message);
    });

    // Initial status update (assuming disconnected initially)
    updateServerStatus(false, 'Connecting...');
    updateCaregiverStatus(false);
});
