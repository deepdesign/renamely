@echo off
echo Starting Renamely...
echo.

REM Check if node_modules exists in client directory
if not exist "client\node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the development server
echo Starting development server...
echo The app will be available at http://localhost:5173
echo Press Ctrl+C to stop the server
echo.
call npm run dev
