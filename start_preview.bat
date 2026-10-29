@echo off
set PORT=3000
set NODE_ENV=development
cd /d "%~dp0"
node_modules\.bin\tsx server.ts
