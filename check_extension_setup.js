// check_extension_setup.js
// Run this to verify your extension setup
// Usage: node check_extension_setup.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Extension Setup Verification ===\n');

// Configuration
const MANIFEST_PATH = 'D:\\ClientWork\\RemoteNetflixController\\elder-app\\native-messaging-host\\com.your_company.netflix_remote.json';
const HOST_NAME = 'com.your_company.netflix_remote';

console.log('1. Checking Native Messaging Manifest...');

if (fs.existsSync(MANIFEST_PATH)) {
    try {
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
        console.log('✓ Manifest file found');
        console.log(`  Name: ${manifest.name}`);
        console.log(`  Path: ${manifest.path}`);
        console.log(`  Type: ${manifest.type}`);
        console.log(`  Allowed origins: ${manifest.allowed_origins.length} entries`);
        
        manifest.allowed_origins.forEach((origin, index) => {
            console.log(`    ${index + 1}. ${origin}`);
            
            // Extract extension ID from chrome-extension:// URL
            const match = origin.match(/chrome-extension:\/\/([a-z]+)\//);
            if (match) {
                console.log(`       Extension ID: ${match[1]}`);
            }
        });
        
        // Check if batch file exists
        if (fs.existsSync(manifest.path)) {
            console.log('✓ Batch file exists at specified path');
        } else {
            console.log('✗ Batch file NOT found at specified path');
        }
        
    } catch (error) {
        console.log(`✗ Error reading manifest: ${error.message}`);
    }
} else {
    console.log(`✗ Manifest file not found at: ${MANIFEST_PATH}`);
}

console.log('\n2. Checking Windows Registry...');

// Check Chrome registry
try {
    const chromeRegPath = `HKEY_CURRENT_USER\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`;
    const result = execSync(`reg query "${chromeRegPath}"`, { encoding: 'utf8' });
    console.log('✓ Chrome registry entry found');
    
    // Extract the path from registry output
    const pathMatch = result.match(/REG_SZ\s+(.+)/);
    if (pathMatch) {
        console.log(`  Registered path: ${pathMatch[1]}`);
    }
} catch (error) {
    console.log('✗ Chrome registry entry not found');
    console.log('  You may need to run the install script as Administrator');
}

// Check Edge registry
try {
    const edgeRegPath = `HKEY_CURRENT_USER\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\${HOST_NAME}`;
    const result = execSync(`reg query "${edgeRegPath}"`, { encoding: 'utf8' });
    console.log('✓ Edge registry entry found');
} catch (error) {
    console.log('✗ Edge registry entry not found');
}

console.log('\n3. Testing Node.js and Script...');

try {
    const nodeVersion = execSync('"C:\\Program Files\\nodejs\\node.exe" --version', { encoding: 'utf8' });
    console.log(`✓ Node.js accessible: ${nodeVersion.trim()}`);
} catch (error) {
    console.log('✗ Node.js not accessible or wrong path');
}

const bridgeScript = 'D:\\ClientWork\\RemoteNetflixController\\elder-app\\native-messaging-host\\native_bridge.js';
if (fs.existsSync(bridgeScript)) {
    console.log('✓ Bridge script exists');
} else {
    console.log('✗ Bridge script not found');
}

console.log('\n4. Extension ID Help...');
console.log('To find your Chrome extension ID:');
console.log('1. Go to chrome://extensions/');
console.log('2. Enable "Developer mode"');
console.log('3. Find your extension and copy the ID');
console.log('4. Update the manifest file with the correct ID');

console.log('\n5. Manual Registry Installation (if needed)...');
console.log('If automatic installation failed, run as Administrator:');
console.log(`reg add "HKEY_CURRENT_USER\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}" /ve /d "${MANIFEST_PATH}" /f`);

console.log('\n6. Debugging Steps...');
console.log('a) Run: node test_native_direct.js');
console.log('b) Check log files in the native-messaging-host directory');
console.log('c) Check Chrome extension console for errors');
console.log('d) Ensure Elder Electron app is running');

console.log('\n=== Verification Complete ===');