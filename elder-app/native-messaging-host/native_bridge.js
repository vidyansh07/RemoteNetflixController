// elder-app/native-messaging-host/native_bridge.js

// This script runs when the browser extension tries to connect via Native Messaging.
// It acts as an intermediary, receiving messages from the extension and forwarding them
// to the *main* Elder Electron app process.
// It also receives messages from the Elder Electron App and forwards them to the extension.

const net = require('net'); // For IPC socket communication with the Electron app

console.error("[Native Bridge] Script started."); // console.error goes to stderr, good for debugging native messaging

// Define a unique IPC channel name. This must match what the Elder Electron app listens on.
const IPC_CHANNEL_NAME = 'netflix-remote-ipc-channel';

// Connect to the main Electron app process via IPC socket
let client = new net.Socket();
let electronAppConnected = false;

client.connect({ path: `\\\\.\\pipe\\${IPC_CHANNEL_NAME}` }, () => {
    console.error("[Native Bridge] Connected to Elder Electron App IPC channel.");
    electronAppConnected = true;
    // --- NEW: Send an immediate "ready" message to the extension ---
    sendMessageToExtension({ type: "native_host_ready", status: "connected_to_electron" });
    // --- END NEW ---
});

client.on('error', (err) => {
    console.error(`[Native Bridge] IPC connection error: ${err.message}. Is the Elder Electron app running?`);
    // If Electron app is not running, we cannot forward messages.
    // Exit gracefully to avoid hanging.
    process.exit(1);
});

client.on('close', () => {
    console.error("[Native Bridge] IPC connection closed by Elder Electron App.");
    electronAppConnected = false;
    process.exit(0); // Exit if Electron app closes
});

// --- Handle messages from the browser extension (via stdin) ---
// These are messages *from* the extension *to* the Electron app.
let accumulatedMessageFromExtension = '';
process.stdin.on('data', (chunk) => {
    accumulatedMessageFromExtension += chunk.toString('utf8');
    // Native Messaging messages are length-prefixed.
    // The first 4 bytes indicate the length of the message.
    while (accumulatedMessageFromExtension.length >= 4) {
        const length = accumulatedMessageFromExtension.charCodeAt(0) +
                       (accumulatedMessageFromExtension.charCodeAt(1) << 8) +
                       (accumulatedMessageFromExtension.charCodeAt(2) << 16) +
                       (accumulatedMessageFromExtension.charCodeAt(3) << 24);

        if (accumulatedMessageFromExtension.length >= 4 + length) {
            const messageString = accumulatedMessageFromExtension.substring(4, 4 + length);
            try {
                const message = JSON.parse(messageString);
                console.error("[Native Bridge] Received message from extension (to Electron):", message);

                // Forward this message to the main Elder Electron App via IPC
                if (electronAppConnected) {
                    client.write(JSON.stringify(message) + '\n'); // Send JSON string followed by newline
                } else {
                    console.error("[Native Bridge] Electron app not connected via IPC. Cannot forward message from extension.");
                }

            } catch (e) {
                console.error("[Native Bridge] Error parsing message from extension:", e.message, "Raw:", messageString);
            }
            accumulatedMessageFromExtension = accumulatedMessageFromExtension.substring(4 + length);
        } else {
            // Not enough data for the full message yet
            break;
        }
    }
});

process.stdin.on('end', () => {
    console.error("[Native Bridge] stdin ended. Browser extension disconnected from stdin side.");
    process.exit(0);
});

// --- Handle messages from the Electron app (via IPC socket) ---
// These are messages *from* the Electron app *to* the extension.
client.on('data', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.error("[Native Bridge] Received message from Electron app (to extension):", message);
        // Now, send this message to the browser extension via process.stdout
        sendMessageToExtension(message);
    } catch (e) {
        console.error("[Native Bridge] Error parsing message from Electron app:", e.message, "Raw:", data.toString());
    }
});


// Helper function to send messages to the browser extension (via stdout)
function sendMessageToExtension(message) {
    try {
        const messageJson = JSON.stringify(message);
        const length = Buffer.byteLength(messageJson, 'utf8');
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32LE(length, 0); // Write length as a 32-bit unsigned little-endian integer
        
        console.error(`[Native Bridge] Sending to extension: Length buffer (${length} bytes) + JSON message (${messageJson})`); // DEBUG
        process.stdout.write(buffer);
        process.stdout.write(messageJson);
        console.error("[Native Bridge] Sent message to extension:", message);
    } catch (e) {
        console.error("[Native Bridge] Error sending message to extension:", e.message);
    }
}
