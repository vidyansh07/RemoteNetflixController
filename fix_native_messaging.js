// fix_native_messaging.js
// Complete fix for native messaging setup
// Run this script to fix all common issues

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Native Messaging Complete Fix ===\n');

// Configuration
const CONFIG = {
    hostName: 'com.your_company.netflix_remote',
    extensionId: 'kfhfpmnnhjpjjcilppinfbdlecglodhh', // Your actual extension ID
    scriptDir: 'D:\\ClientWork\\RemoteNetflixController\\elder-app\\native-messaging-host',
    batchFile: 'host_app_bridge.bat',
    nodeExe: 'C:\\Program Files\\nodejs\\node.exe'
};

console.log('Configuration:');
console.log(`Host Name: ${CONFIG.hostName}`);
console.log(`Extension ID: ${CONFIG.extensionId}`);
console.log(`Script Directory: ${CONFIG.scriptDir}`);
console.log(`Batch File: ${CONFIG.batchFile}`);
console.log(`Node.js Path: ${CONFIG.nodeExe}`);

// Step 1: Create correct manifest
console.log('\n1. Creating corrected manifest...');

const manifest = {
    name: CONFIG.hostName,
    description: "Native Messaging host for Netflix Remote Elder Control extension.",
    path: path.join(CONFIG.scriptDir, CONFIG.batchFile).replace(/\\/g, '\\\\'), // Escape backslashes
    type: "stdio",
    allowed_origins: [
        `chrome-extension://${CONFIG.extensionId}/`
    ]
};

const manifestPath = path.join(CONFIG.scriptDir, `${CONFIG.hostName}.json`);

try {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✓ Manifest created successfully');
    console.log(`  Path: ${manifestPath}`);
    console.log(`  Batch path in manifest: ${manifest.path}`);
} catch (error) {
    console.log(`✗ Error creating manifest: ${error.message}`);
    process.exit(1);
}

// Step 2: Verify batch file exists and is correct
console.log('\n2. Checking batch file...');

const batchPath = path.join(CONFIG.scriptDir, CONFIG.batchFile);
if (fs.existsSync(batchPath)) {
    console.log('✓ Batch file exists');
} else {
    console.log('✗ Batch file missing - creating a simple one...');
    
    const batchContent = `@echo off
cd /d "${CONFIG.scriptDir}"
"${CONFIG.nodeExe}" native_bridge.js
`;
    
    fs.writeFileSync(batchPath, batchContent);
    console.log('✓ Simple batch file created');
}

// Step 3: Test Node.js access
console.log('\n3. Testing Node.js...');

try {
    const nodeVersion = execSync(`"${CONFIG.nodeExe}" --version`, { encoding: 'utf8' });
    console.log(`✓ Node.js working: ${nodeVersion.trim()}`);
} catch (error) {
    console.log(`✗ Node.js test failed: ${error.message}`);
    process.exit(1);
}

// Step 4: Register in Windows Registry
console.log('\n4. Registering in Windows Registry...');

const registryCommands = [
    // Chrome (user level)
    `reg add "HKEY_CURRENT_USER\\Software\\Google\\Chrome\\NativeMessagingHosts\\${CONFIG.hostName}" /ve /d "${manifestPath}" /f`,
    // Chrome (system level) - will fail without admin, that's ok
    `reg add "HKEY_LOCAL_MACHINE\\Software\\Google\\Chrome\\NativeMessagingHosts\\${CONFIG.hostName}" /ve /d "${manifestPath}" /f`,
    // Edge (user level)
    `reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\${CONFIG.hostName}" /ve /d "${manifestPath}" /f`
];

registryCommands.forEach((cmd, index) => {
    try {
        execSync(cmd, { stdio: 'inherit' });
        console.log(`✓ Registry entry ${index + 1} added successfully`);
    } catch (error) {
        console.log(`✗ Registry entry ${index + 1} failed (may need admin rights)`);
    }
});

// Step 5: Verify registry entries
console.log('\n5. Verifying registry entries...');

const verifyCommands = [
    `reg query "HKEY_CURRENT_USER\\Software\\Google\\Chrome\\NativeMessagingHosts\\${CONFIG.hostName}"`,
    `reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\${CONFIG.hostName}"`
];

verifyCommands.forEach((cmd, index) => {
    try {
        execSync(cmd, { stdio: 'pipe' });
        console.log(`✓ Registry entry ${index + 1} verified`);
    } catch (error) {
        console.log(`✗ Registry entry ${index + 1} not found`);
    }
});

// Step 6: Create test script for direct native messaging test
console.log('\n6. Creating test script...');

const testScript = `
// Test script to verify native messaging
const hostName = '${CONFIG.hostName}';

console.log('Testing native messaging connection...');

try {
    const port = chrome.runtime.connectNative(hostName);
    
    port.onMessage.addListener((message) => {
        console.log('Received from native host:', message);
    });
    
    port.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError) {
            console.error('Native host error:', chrome.runtime.lastError.message);
        } else {
            console.log('Native host disconnected cleanly');
        }
    });
    
    port.postMessage({type: 'test', timestamp: Date.now()});
    console.log('Test message sent to native host');
    
} catch (error) {
    console.error('Error:', error.message);
}
`;

const testScriptPath = path.join(CONFIG.scriptDir, 'extension_test.js');
fs.writeFileSync(testScriptPath, testScript);
console.log(`✓ Test script created: ${testScriptPath}`);

// Step 7: Create corrected background.js
console.log('\n7. Creating corrected background.js for your extension...');

const backgroundScript = `
// Corrected background.js
console.log("Netflix Remote Elder Control: Background script loaded.");

const NATIVE_HOST_NAME = '${CONFIG.hostName}';
let nativeAppPort = null;

function connectToNativeApp() {
    console.log('Attempting to connect to native host:', NATIVE_HOST_NAME);
    
    try {
        nativeAppPort = chrome.runtime.connectNative(NATIVE_HOST_NAME);
        console.log('Native port created');
        
        nativeAppPort.onMessage.addListener((message) => {
            console.log('Message from native host:', message);
        });
        
        nativeAppPort.onDisconnect.addListener(() => {
            if (chrome.runtime.lastError) {
                console.error('Native host error:', chrome.runtime.lastError.message);
            } else {
                console.log('Native host disconnected');
            }
            nativeAppPort = null;
        });
        
        // Send test message
        setTimeout(() => {
            if (nativeAppPort) {
                nativeAppPort.postMessage({
                    type: 'test',
                    timestamp: Date.now(),
                    from: 'background_script'
                });
                console.log('Test message sent to native host');
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error creating native port:', error);
    }
}

// Try to connect when extension starts
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension startup');
    setTimeout(connectToNativeApp, 2000);
});

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
    setTimeout(connectToNativeApp, 2000);
});

// Immediate connection attempt
setTimeout(connectToNativeApp, 3000);
`;

const backgroundPath = path.join(CONFIG.scriptDir, 'corrected_background.js');
fs.writeFileSync(backgroundPath, backgroundScript);
console.log(`✓ Corrected background.js created: ${backgroundPath}`);

console.log('\n=== Fix Complete ===');
console.log('\nNext steps:');
console.log('1. Replace your extension\'s background.js with the corrected version');
console.log('2. Reload your extension in chrome://extensions/');
console.log('3. Check the background script console (Inspect views: service worker)');
console.log('4. Watch the native bridge logs for connection attempts');
console.log('\nIf you still have issues, the problem might be:');
console.log('- Chrome security restrictions');
console.log('- Extension not properly loaded');
console.log('- Antivirus blocking the connection');