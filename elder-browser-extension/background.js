// elder-browser-extension/background.js

// This is the background script (Service Worker) for the browser extension.
// It acts as the bridge between the native Electron application (via Native Messaging)
// and the content script running inside the Netflix tab.

console.log("Netflix Remote Elder Control: Background script loaded.");

const NATIVE_HOST_NAME = 'com.your_company.netflix_remote'; // Must match native messaging host manifest name

let nativeAppPort = null;

// Function to establish connection to the native app
function connectToNativeApp() {
    if (nativeAppPort && nativeAppPort.connected) { // Check if port exists AND is connected
        console.log("Native app port already exists and is connected. Not reconnecting.");
        return;
    }

    // Clear any previous error messages before attempting new connection
    chrome.runtime.lastError; // Accessing this clears the error, useful before a new attempt

    try {
        console.log(`Attempting to connect to native messaging host: ${NATIVE_HOST_NAME}`);
        nativeAppPort = chrome.runtime.connectNative(NATIVE_HOST_NAME);

        // --- IMPORTANT DEBUGGING LOGGING ---
        // This 'onDisconnect' listener will fire *immediately* if the connection fails,
        // often before onMessage can even be set up.
        nativeAppPort.onDisconnect.addListener(function() {
            if (chrome.runtime.lastError) {
                // This is the key error message to capture!
                console.log("Netflix Remote Elder Control: Native messaging port disconnected/failed to connect due to error:", chrome.runtime.lastError.message);
            } else {
                console.log("Netflix Remote Elder Control: Native messaging port disconnected (cleanly).");
            }
            nativeAppPort = null; // Clear the port reference
            // You might add a reconnect attempt here in a production app
        });
        // --- END IMPORTANT DEBUGGING LOGGING ---

        nativeAppPort.onMessage.addListener(function(message) {
            console.log("Netflix Remote Elder Control: Received message from native app (active connect):", message);
            // Forward the message to the content script in the active Netflix tab
            chrome.tabs.query({active: true, currentWindow: true, url: "*://*.netflix.com/watch/*"}, function(tabs) {
                if (tabs.length > 0) {
                    const activeTabId = tabs[0].id;
                    console.log("Netflix Remote Elder Control: Sending message to content script in tab:", activeTabId, message);
                    chrome.tabs.sendMessage(activeTabId, { type: "FROM_BACKGROUND", command: message.command });
                } else {
                    console.warn("Netflix Remote Elder Control: No active Netflix 'watch' tab found to send command to.");
                }
            });
        });

        console.log("Netflix Remote Elder Control: ConnectNative call initiated."); // Log after the call
    } catch (e) {
        console.error("Netflix Remote Elder Control: EXCEPTION during connectToNativeApp:", e);
        nativeAppPort = null;
    }
}

// Listen for messages from the content script (e.g., status updates from Netflix page)
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === "FROM_CONTENT" && nativeAppPort && nativeAppPort.connected) {
        console.log("Netflix Remote Elder Control: Received message from content script:", message);
        // If you need to send messages from the content script back to the native app:
        // nativeAppPort.postMessage(message);
    }
});

// Immediately attempt to connect to the native app when background script loads
connectToNativeApp();

// Optional: You can still keep chrome.runtime.onConnectExternal if you also expect the native app to initiate connection
// For now, let's rely on connectNative for debugging.
