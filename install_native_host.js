// install_native_host.js
// This script installs the native messaging host for Chrome/Edge
// Run with: node install_native_host.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

console.log('=== Installing Native Messaging Host ===\n');

// Configuration - UPDATE THESE PATHS
const CONFIG = {
    hostName: 'com.your_company.netflix_remote',
    scriptDir: 'D:\\ClientWork\\RemoteNetflixController\\elder-app\\native-messaging-host',
    batchFile: 'host_app_bridge.bat',
    extensionId: 'kfhfpmnnhjpjjcilppinfbdlecglodhh' // UPDATE THIS with your actual extension ID
};

// Create the manifest content
const manifest = {
    name: CONFIG.hostName,
    description: "Native Messaging host for Netflix Remote Elder Control extension.",
    path: path.join(CONFIG.scriptDir, CONFIG.batchFile),
    type: "stdio",
    allowed_origins: [
        `chrome-extension://${CONFIG.extensionId}/`
    ]
};

console.log('Configuration:');
console.log(`Host name: ${CONFIG.hostName}`);
console.log(`Script directory: ${CONFIG.scriptDir}`);
console.log(`Batch file: ${CONFIG.batchFile}`);
console.log(`Extension ID: ${CONFIG.extensionId}`);
console.log(`Full batch path: ${manifest.path}`);

// Step 1: Create the manifest file
const manifestPath = path.join(CONFIG.scriptDir, `${CONFIG.hostName}.json`);
console.log(`\n1. Creating manifest file at: ${manifestPath}`);

try {
    // Ensure directory exists
    if (!fs.existsSync(CONFIG.scriptDir)) {
        fs.mkdirSync(CONFIG.scriptDir, { recursive: true });
        console.log(`✓ Created directory: ${CONFIG.scriptDir}`);
    }
    
    // Write manifest file
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✓ Manifest file created successfully');
    
    // Verify batch file exists
    if (fs.existsSync(manifest.path)) {
        console.log('✓ Batch file exists at specified path');
    } else {
        console.log('✗ Warning: Batch file does not exist at specified path');
    }
    
} catch (error) {
    console.log(`✗ Error creating manifest: ${error.message}`);
    process.exit(1);
}

// Step 2: Install for Chrome
console.log('\n2. Installing for Chrome...');

// Chrome registry paths
const chromeRegistryPaths = [
    'HKEY_CURRENT_USER\\Software\\Google\\Chrome\\NativeMessagingHosts',
    'HKEY_LOCAL_MACHINE\\Software\\Google\\Chrome\\NativeMessagingHosts'
];

try {
    // Try user-level installation first (doesn't require admin)
    const userRegistryPath = `${chromeRegistryPaths[0]}\\${CONFIG.hostName}`;
    const regCommand = `reg add "${userRegistryPath}" /ve /d "${manifestPath}" /f`;
    
    console.log(`Executing: ${regCommand}`);
    execSync(regCommand, { stdio: 'inherit' });
    console.log('✓ Chrome native messaging host installed (user level)');
    
} catch (error) {
    console.log(`✗ Failed to install for Chrome: ${error.message}`);
    console.log('You may need to run this script as Administrator or install manually');
}

// Step 3: Install for Edge (Chromium)
console.log('\n3. Installing for Microsoft Edge...');

try {
    const edgeRegistryPath = `HKEY_CURRENT_USER\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\${CONFIG.hostName}`;
    const regCommand = `reg add "${edgeRegistryPath}" /ve /d "${manifestPath}" /f`;
    
    console.log(`Executing: ${regCommand}`);
    execSync(regCommand, { stdio: 'inherit' });
    console.log('✓ Edge native messaging host installed (user level)');
    
} catch (error) {
    console.log(`✗ Failed to install for Edge: ${error.message}`);
}

// Step 4: Verification
console.log('\n4. Verification...');

// Check if registry entries exist
try {
    execSync(`reg query "HKEY_CURRENT_USER\\Software\\Google\\Chrome\\NativeMessagingHosts\\${CONFIG.hostName}"`, { stdio: 'pipe' });
    console.log('✓ Chrome registry entry verified');
} catch (error) {
    console.log('✗ Chrome registry entry not found');
}

try {
    execSync(`reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\${CONFIG.hostName}"`, { stdio: 'pipe' });
    console.log('✓ Edge registry entry verified');
} catch (error) {
    console.log('✗ Edge registry entry not found');
}

// Step 5: Display manual installation instructions
console.log('\n=== Manual Installation Instructions ===');
console.log('If automatic installation failed, follow these steps:');
console.log('\n1. Open Registry Editor (regedit.exe) as Administrator');
console.log('\n2. Navigate to one of these paths:');
console.log('   HKEY_CURRENT_USER\\Software\\Google\\Chrome\\NativeMessagingHosts');
console.log('   HKEY_LOCAL_MACHINE\\Software\\Google\\Chrome\\NativeMessagingHosts');
console.log('\n3. Create a new key named:', CONFIG.hostName);
console.log('\n4. Set the default value of this key to:', manifestPath);
console.log('\n5. Repeat for Edge at:');
console.log('   HKEY_CURRENT_USER\\Software\\Microsoft\\Edge\\NativeMessagingHosts');

console.log('\n=== Next Steps ===');
console.log('1. Make sure your extension ID is correct in the manifest');
console.log('2. Load/reload your browser extension');
console.log('3. Start the Elder Electron app');
console.log('4. Test the connection');
console.log('\n=== Troubleshooting ===');
console.log('- Check the debug log files in the script directory');
console.log('- Verify all file paths are correct');
console.log('- Ensure Node.js is installed and accessible');
console.log('- Check Chrome extension console for errors');

console.log('\n=== Installation Complete ===');