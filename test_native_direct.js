// test_native_direct.js
// Run this to test the native host directly without the browser
// Usage: node test_native_direct.js

const { spawn } = require('child_process');
const path = require('path');

console.log('=== Direct Native Host Test ===\n');

const SCRIPT_PATH = 'D:\\ClientWork\\RemoteNetflixController\\elder-app\\native-messaging-host\\native_bridge.js';
const NODE_PATH = 'C:\\Program Files\\nodejs\\node.exe';

console.log(`Testing: ${NODE_PATH} ${SCRIPT_PATH}`);

// Spawn the native bridge process
const bridge = spawn(NODE_PATH, [SCRIPT_PATH], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let messageCount = 0;

// Handle stdout (messages from bridge to extension)
bridge.stdout.on('data', (data) => {
    console.log(`\n--- STDOUT (${data.length} bytes) ---`);
    
    // Try to parse native messaging format
    let offset = 0;
    while (offset < data.length) {
        if (offset + 4 <= data.length) {
            const length = data.readUInt32LE(offset);
            console.log(`Message length: ${length}`);
            
            if (offset + 4 + length <= data.length) {
                const messageData = data.slice(offset + 4, offset + 4 + length);
                try {
                    const message = JSON.parse(messageData.toString('utf8'));
                    console.log('Parsed message:', JSON.stringify(message, null, 2));
                } catch (e) {
                    console.log('Raw message data:', messageData.toString());
                }
                offset += 4 + length;
            } else {
                console.log('Incomplete message, waiting for more data...');
                break;
            }
        } else {
            console.log('Incomplete length header');
            break;
        }
    }
});

// Handle stderr (logs from bridge)
bridge.stderr.on('data', (data) => {
    console.log('STDERR:', data.toString().trim());
});

// Handle process events
bridge.on('spawn', () => {
    console.log('✓ Bridge process spawned successfully');
    
    // Send a test message after 2 seconds
    setTimeout(() => {
        console.log('\nSending test message...');
        const testMessage = { 
            type: 'test', 
            message: 'Hello from test script',
            timestamp: Date.now()
        };
        
        sendNativeMessage(bridge.stdin, testMessage);
    }, 2000);
    
    // Send another message after 5 seconds
    setTimeout(() => {
        console.log('\nSending second test message...');
        const testMessage2 = { 
            type: 'ping', 
            data: 'ping test'
        };
        
        sendNativeMessage(bridge.stdin, testMessage2);
    }, 5000);
});

bridge.on('close', (code, signal) => {
    console.log(`\n--- Bridge process closed ---`);
    console.log(`Exit code: ${code}`);
    console.log(`Signal: ${signal}`);
});

bridge.on('error', (error) => {
    console.error(`✗ Bridge process error: ${error.message}`);
});

// Function to send native messaging format messages
function sendNativeMessage(stdin, message) {
    try {
        const messageJson = JSON.stringify(message);
        const messageBuffer = Buffer.from(messageJson, 'utf8');
        const lengthBuffer = Buffer.alloc(4);
        lengthBuffer.writeUInt32LE(messageBuffer.length, 0);
        
        console.log(`Sending message: ${messageJson}`);
        console.log(`Message length: ${messageBuffer.length} bytes`);
        
        stdin.write(lengthBuffer);
        stdin.write(messageBuffer);
        
        messageCount++;
        console.log(`✓ Message ${messageCount} sent`);
        
    } catch (error) {
        console.error(`✗ Error sending message: ${error.message}`);
    }
}

// Keep the test running for 10 seconds
setTimeout(() => {
    console.log('\n--- Test ending ---');
    bridge.kill('SIGTERM');
    
    setTimeout(() => {
        console.log('Force killing bridge process...');
        bridge.kill('SIGKILL');
        process.exit(0);
    }, 2000);
}, 10000);

console.log('\nTest will run for 10 seconds...');
console.log('Watch for messages above.\n');