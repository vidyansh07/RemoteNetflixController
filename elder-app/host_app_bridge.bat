@echo off
REM host_app_bridge.bat
REM This script is launched by the browser's Native Messaging API.
REM It executes a Node.js script that handles the actual communication.

REM Navigate to the directory where your Node.js bridge script is located
CD "C:\Users\mmdu\RemoteNetflixController\elder-app\native-messaging-host"

REM Execute the Node.js script
REM The '--inspect' flag is for debugging purposes; you can remove it in production.
"C:\Program Files\nodejs\node.exe" "C:\Users\mmdu\RemoteNetflixController\elder-app\native-messaging-host\native_bridge.js"
