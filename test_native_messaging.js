// test_native_messaging.js
// Run this script to test if native messaging setup is working
// Usage: node test_native_messaging.js

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== Native Messaging Setup Test ===\n');

// Configuration - UPDATE THESE PATHS TO MATCH YOUR SETUP
const BATCH_FILE_PATH = 'D:\\ClientWork\\RemoteNetflixController\\elder-app\\native-messaging-host\\host_app_bridge.bat';
const NODE_PATH = 'C:\\Program Files\\nodejs\\node.exe';
const BRIDGE_SCRIPT = 'D:\\ClientWork\\RemoteNetflixController\\elder-app\\native-messaging-host\\native_bridge.js';

// Test 1: Check if files exist
console.log('1. Checking if files exist...');
const filesToCheck = [
    { name: 'Batch file', path: BATCH_FILE_PATH },
    { name: 'Node.js executable', path: NODE_PATH },
    { name: 'Bridge script', path: BRIDGE_SCRIPT }
];

filesToCheck.forEach(file => {
    if (fs.existsSync(file.path)) {
        console.log(`✓ ${file.name}: Found at ${file.path}`);
    } else {
        console.log(`✗ ${file.name}: NOT found at ${file.path}`);
    }
});

// Test 2: Check Node.js version
console.log('\n2. Checking Node.js version...');
try {
    const nodeVersion = require('child_process').execSync(`"${NODE_PATH}" --version`, { encoding: 'utf8' });
    console.log(`✓ Node.js version: ${nodeVersion.trim()}`);
} catch (error) {
    console.log(`✗ Failed to get Node.js version: ${error.message}`);
}

// Test 3: Test native messaging manifest
console.log('\n3. Checking native messaging manifest...');
const manifestPath = 'D:\\ClientWork\\RemoteNetflixController\\elder-app\\native-messaging-host\\com.your_company.netflix_remote.json';
if (fs.existsSync(manifestPath)) {
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        console.log(`✓ Manifest found with name: ${manifest.name}`);
        console.log(`  Path in manifest: ${manifest.path}`);
        console.log(`  Allowed origins: ${manifest.allowed_origins.length} entries`);
        
        // Check if the path in manifest matches our batch file
        if (manifest.path === BATCH_FILE_PATH) {
            console.log('✓ Manifest path matches batch file location');
        } else {
            console.log('✗ Manifest path does NOT match batch file location');
            console.log(`  Expected: ${BATCH_FILE_PATH}`);
            console.log(`  Found: ${manifest.path}`);
        }
    } catch (error) {
        console.log(`✗ Error reading manifest: ${error.message}`);
    }
} else {
    console.log(`✗ Manifest not found at: ${manifestPath}`);
}

// Test 4: Test script execution directly
console.log('\n4. Testing direct script execution...');
console.log('Starting bridge script for 5 seconds...');

const child = spawn(NODE_PATH, [BRIDGE_SCRIPT], {
    stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
    console.log(`Script stdout: ${data}`);
});

child.stderr.on('data', (data) => {
    console.log(`Script stderr: ${data}`);
});

child.on('close', (code) => {
    console.log(`Script exited with code: ${code}`);
});

child.on('error', (error) => {
    console.log(`✗ Failed to start script: ${error.message}`);
});

// Send a test message after 1 second
setTimeout(() => {
    console.log('Sending test message to script...');
    const testMessage = { type: 'test', command: 'ping' };
    const messageJson = JSON.stringify(testMessage);
    const messageBuffer = Buffer.from(messageJson, 'utf8');
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(messageBuffer.length, 0);
    
    try {
        child.stdin.write(lengthBuffer);
        child.stdin.write(messageBuffer);
        console.log('✓ Test message sent');
    } catch (error) {
        console.log(`✗ Failed to send test message: ${error.message}`);
    }
}, 1000);

// Kill the child process after 5 seconds
setTimeout(() => {
    console.log('\nStopping test script...');
    child.kill();
}, 5000);

// Test 5: Check Windows registry for native messaging (if needed)
console.log('\n5. Registry Check Instructions:');
console.log('Check if the native messaging host is registered in Windows Registry:');
console.log('Path: HKEY_CURRENT_USER\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.your_company.netflix_remote');
console.log('Or: HKEY_LOCAL_MACHINE\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.your_company.netflix_remote');
console.log('The registry key should point to your manifest file.');

console.log('\n=== Test Complete ===');
console.log('\nNext steps if there are issues:');
console.log('1. Fix any file path issues identified above');
console.log('2. Ensure the extension has the correct extension ID in manifest');
console.log('3. Check Chrome\'s extension error logs');
console.log('4. Look at the debug log files created by the scripts');