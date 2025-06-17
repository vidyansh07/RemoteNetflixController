// care-giver-app/renderer.js
// This script will be loaded by index.html in a <script> tag

document.addEventListener('DOMContentLoaded', () => {
    const serverStatusElem = document.getElementById('serverStatus');
    const serverIndicatorElem = document.getElementById('serverIndicator');
    const elderStatusElem = document.getElementById('elderStatus');
    const elderIndicatorElem = document.getElementById('elderIndicator');

    const netflixUrlInput = document.getElementById('netflixUrlInput'); // Get the new input field
    const sendUrlBtn = document.getElementById('sendUrlBtn');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const seekForwardBtn = document.getElementById('seekForwardBtn');
    const seekBackwardBtn = document.getElementById('seekBackwardBtn');
    const stopCloseBtn = document.getElementById('stopCloseBtn');

    // --- UI Update Functions ---
    function updateServerStatus(isConnected, message = 'Connected') {
        serverStatusElem.textContent = isConnected ? message : 'Disconnected';
        serverStatusElem.classList.toggle('text-green-500', isConnected);
        serverStatusElem.classList.toggle('text-red-500', !isConnected);
        serverStatusElem.classList.toggle('text-yellow-500', !isConnected && message === 'Connecting...'); // Keep yellow for connecting state
        serverIndicatorElem.classList.toggle('status-connected', isConnected);
        serverIndicatorElem.classList.toggle('status-disconnected', !isConnected);
    }

    function updateElderStatus(isConnected) {
        elderStatusElem.textContent = isConnected ? 'Connected' : 'Disconnected';
        elderStatusElem.classList.toggle('text-green-500', isConnected);
        elderStatusElem.classList.toggle('text-red-500', !isConnected);
        elderIndicatorElem.classList.toggle('status-connected', isConnected);
        elderIndicatorElem.classList.toggle('status-disconnected', !isConnected);
    }

    // --- Event Listeners for Manual Control Buttons ---
    // Updated logic for sendUrlBtn
    sendUrlBtn.addEventListener('click', () => {
        const url = netflixUrlInput.value.trim();
        if (url) {
            // Basic validation for a Netflix URL
            if (url.startsWith('https://www.netflix.com/watch/')) {
                console.log('Sending URL from input:', url);
                window.electronAPI.sendVideoUrl(url);
                // Optionally clear input after sending, or keep it for easy resend
                // netflixUrlInput.value = '';
            } else {
                alert('Please enter a valid Netflix video URL (starting with https://www.netflix.com/watch/).');
            }
        } else {
            alert('Please paste a Netflix URL into the input field.');
        }
    });

    playBtn.addEventListener('click', () => {
        console.log('Manually sending Play command');
        window.electronAPI.sendPlaybackCommand('play');
    });

    pauseBtn.addEventListener('click', () => {
        console.log('Manually sending Pause command');
        window.electronAPI.sendPlaybackCommand('pause');
    });

    seekForwardBtn.addEventListener('click', () => {
        console.log('Manually sending Seek Forward command');
        window.electronAPI.sendPlaybackCommand('seek_forward');
    });

    seekBackwardBtn.addEventListener('click', () => {
        console.log('Manually sending Seek Backward command');
        window.electronAPI.sendPlaybackCommand('seek_backward');
    });

    stopCloseBtn.addEventListener('click', () => {
        console.log('Manually sending Stop/Close command');
        window.electronAPI.sendPlaybackCommand('close');
    });

    // --- IPC Renderer Listeners (from main process) ---
    window.electronAPI.onServerStatusUpdate((status) => {
        updateServerStatus(status.connected, status.error ? `Error: ${status.error}` : 'Connected');
    });

    window.electronAPI.onElderStatusUpdate((status) => {
        updateElderStatus(status.connected);
    });

    window.electronAPI.onStatusMessage((message) => {
        // Display general status messages (e.g., errors) to the user
        // Using alert for now, but will replace with custom modal later as per instructions.
        console.log('App Status Message:', message);
        alert(message);
    });

    // Initial status update (assuming disconnected initially)
    updateServerStatus(false, 'Connecting...');
    updateElderStatus(false);
});
