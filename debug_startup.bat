@echo off
REM debug_startup.bat
REM Test the entire startup sequence manually

set "BASE_DIR=D:\ClientWork\RemoteNetflixController\elder-app\native-messaging-host"
set "NODE_EXE=C:\Program Files\nodejs\node.exe"

echo === Debugging Startup Sequence ===
echo.

echo 1. Checking if Elder Electron app is running...
tasklist /FI "IMAGENAME eq electron.exe" | find /I "electron.exe" >nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Electron process found
) else (
    echo [WARNING] Electron process not found - Elder app may not be running
)

echo.
echo 2. Testing Node.js directly...
"%NODE_EXE%" --version
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js test failed
    pause
    exit /b 1
)

echo.
echo 3. Testing native bridge script directly...
cd /d "%BASE_DIR%"
echo Starting native bridge for 10 seconds...
timeout /t 1 >nul

REM Start the script and kill it after 10 seconds
start /b "" "%NODE_EXE%" native_bridge.js
timeout /t 10 >nul
taskkill /F /IM node.exe >nul 2>&1

echo.
echo 4. Checking if log files were created...
if exist "bridge.log" (
    echo [OK] bridge.log created
    echo Last few lines:
    powershell -Command "Get-Content bridge.log -Tail 5"
) else (
    echo [ERROR] bridge.log not created
)

echo.
echo 5. Testing batch file execution...
echo Starting batch file for 5 seconds...
start /b "" host_app_bridge.bat
timeout /t 5 >nul
taskkill /F /IM node.exe >nul 2>&1

echo.
echo 6. Checking all log files...
for %%f in (*.log) do (
    echo === %%f ===
    powershell -Command "Get-Content '%%f' -Tail 3" 2>nul
    echo.
)

echo.
echo 7. Registry check...
reg query "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.your_company.netflix_remote" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Registry entry exists
) else (
    echo [ERROR] Registry entry missing
)

echo.
echo === Debug Complete ===
pause