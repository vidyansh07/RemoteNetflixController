// elder-browser-extension/content.js

// This script is injected directly into Netflix.com pages.
// It has access to the page's DOM and JavaScript environment.

console.log("Netflix Remote Elder Control: Content script loaded on Netflix page.");

// Function to find the Netflix video element
function getNetflixVideoPlayer() {
    // Netflix often uses a video tag directly, or a custom player wrapper
    // We try to find the primary video element on the page.
    // Look for video elements that are likely the main player.
    let videoPlayer = document.querySelector('video.html-video-player');
    if (!videoPlayer) {
        // Fallback to a general video tag if the specific class is not found
        videoPlayer = document.querySelector('video');
    }
    // More robust way: Netflix player container usually has data-purpose="Player"
    if (!videoPlayer) {
        const playerContainer = document.querySelector('[data-purpose="Player"] video');
        if (playerContainer) {
            videoPlayer = playerContainer;
        }
    }
    return videoPlayer;
}

// Function to simulate a key press using JavaScript events (more reliable than robotjs for in-browser)
function simulateKeyPress(keyCode) {
    const event = new KeyboardEvent('keydown', {
        key: keyCode,
        code: keyCode, // e.g., "Space" for spacebar
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(event);
    console.log(`Simulated key press: ${keyCode}`);
}

// Function to handle fullscreen. Netflix often has its own fullscreen button.
// Alternatively, we could simulate the 'f' key press.
function toggleFullscreen() {
    // Try to find a Netflix fullscreen button and click it
    let fullscreenButton = document.querySelector('[data-uia="control-fullscreen"]');
    if (fullscreenButton) {
        fullscreenButton.click();
        console.log("Clicked Netflix fullscreen button.");
        return;
    }
    // Fallback: Simulate 'f' key press, which Netflix generally responds to for fullscreen
    simulateKeyPress('f');
}

// Function to handle playback commands
function executePlaybackCommandInBrowser(command) {
    const video = getNetflixVideoPlayer();
    if (!video) {
        console.warn("Netflix video player not found on page.");
        // Optionally send a message back to background/native app that player isn't ready
        chrome.runtime.sendMessage({ type: "FROM_CONTENT", status: "error", message: "Video player not found." });
        return;
    }

    console.log(`Executing command '${command}' on Netflix player.`);

    switch (command) {
        case 'play':
            if (video.paused) {
                video.play().catch(e => console.error("Error playing video:", e));
                console.log("Video set to play.");
            } else {
                console.log("Video already playing.");
            }
            break;
        case 'pause':
            if (!video.paused) {
                video.pause();
                console.log("Video set to pause.");
            } else {
                console.log("Video already paused.");
            }
            break;
        case 'seek_forward':
            // Netflix typically skips 10 seconds with right arrow
            video.currentTime += 10;
            console.log("Video seeked forward 10 seconds.");
            break;
        case 'seek_backward':
            // Netflix typically skips 10 seconds with left arrow
            video.currentTime -= 10;
            console.log("Video seeked backward 10 seconds.");
            break;
        case 'close':
        case 'stop':
            // Instead of closing the tab (which content scripts cannot do directly and reliably),
            // we can navigate away from the video to the Netflix browse page or a blank page.
            // Navigating to browse page is more user-friendly.
            window.location.href = "https://www.netflix.com/browse";
            console.log("Navigated to Netflix browse page (simulating stop/close).");
            break;
        case 'fullscreen':
            toggleFullscreen(); // Command to explicitly toggle fullscreen
            break;
        default:
            console.warn("Unknown command received by content script:", command);
    }
    // Optionally, send a status update back to the background script
    chrome.runtime.sendMessage({ type: "FROM_CONTENT", status: "success", command: command });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === "FROM_BACKGROUND" && message.command) {
        console.log("Netflix Remote Elder Control: Content script received command from background:", message.command);

        // If the command is to open a video, it's actually handled by the Electron app.
        // We only care about playback commands here.
        if (message.command === 'play_video_url') { // This is a new command type we might send if needed
            // This is just a placeholder to acknowledge the video opening logic
            console.log("Video URL command received by content script - this should be handled by native app.");
        } else {
            executePlaybackCommandInBrowser(message.command);
        }
    }
});

// Initial fullscreen attempt (if needed immediately after URL opens)
// You could also add an observer to wait for the video player to appear
// window.addEventListener('load', () => {
//     setTimeout(toggleFullscreen, 3000); // Attempt fullscreen after page load
// });

