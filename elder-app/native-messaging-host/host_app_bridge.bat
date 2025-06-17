@echo off
REM host_app_bridge.bat
REM This script is launched by the browser's Native Messaging API.
REM It executes a Node.js script that handles the actual communication.

REM --- Start Debugging Setup ---
REM Redirect all output (both stdout and stderr) to a log file.
REM This file will be created in the same directory as this .bat script.
set "LOG_FILE=%~dp0native_host_debug.log"
echo --- Script Start: %DATE% %TIME% --- >> "%LOG_FILE%"
echo Current Directory: %CD% >> "%LOG_FILE%"
echo Node.js Path: "C:\Program Files\nodejs\node.exe" >> "%LOG_FILE%"
echo Native Bridge Script Path: "D:\ClientWork\RemoteNetflixController\elder-app\native-messaging-host\native_bridge.js" >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"
REM --- End Debugging Setup ---

REM Navigate to the directory where your Node.js bridge script is located
CD "D:\ClientWork\RemoteNetflixController\elder-app\native-messaging-host" >> "%LOG_FILE%" 2>&1

REM Execute the Node.js script
REM The '--inspect' flag is for debugging purposes; you can remove it in production.
REM Capture output of native_bridge.js as well
"C:\Program Files\nodejs\node.exe" "D:\ClientWork\RemoteNetflixController\elder-app\native-messaging-host\native_bridge.js" >> "%LOG_FILE%" 2>&1

REM --- Debugging Hold ---
REM This PAUSE command will keep the batch window open if run directly,
REM allowing you to see initial errors. It won't affect browser launch.
PAUSE
REM --- End Debugging Hold ---