@echo off
echo Starting Micro-Credential Aggregator Development Environment...
echo.

echo [1/3] Installing backend dependencies...
call npm install

echo.
echo [2/3] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo [3/3] Starting both backend and frontend...
echo Backend will run on: http://localhost:3000
echo Frontend will run on: http://localhost:3001
echo.
echo Press Ctrl+C to stop both servers
echo.

npm run dev:all