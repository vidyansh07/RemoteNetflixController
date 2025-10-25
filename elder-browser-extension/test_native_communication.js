// test_native_communication.js
// Add this to your extension temporarily to test native messaging

// Test function you can call from Chrome DevTools console
window.testNativeMessaging = function() {
    console.log("Testing native messaging connection...");
    
    const hostName = 'com.your_company.netflix_remote';
    
    try {
        const port = chrome.runtime.connectNative(hostName);
        
        port.onMessage.addListener(function(msg) {
            console.log("Received from native host:", msg);
        });
        
        port.onDisconnect.addListener(function() {
            if (chrome.runtime.lastError) {
                console.error("Native host disconnected with error:", chrome.runtime.lastError.message);
            } else {
                console.log("Native host disconnected cleanly");
            }
        });
        
        // Send test message
        port.postMessage({type: "test", message: "Hello from extension!"});
        console.log("Test message sent to native host");
        
        // Disconnect after 5 seconds
        setTimeout(() => {
            port.disconnect();
            console.log("Disconnected from native host");
        }, 5000);
        
    } catch (error) {
        console.error("Error connecting to native host:", error);
    }
};

// Auto-run the test when this script loads
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log("Chrome extension environment detected");
    console.log("Extension ID:", chrome.runtime.id);
    console.log("Run testNativeMessaging() in console to test native messaging");
    
    // You can uncomment the next line to auto-test
    // setTimeout(testNativeMessaging, 2000);
}