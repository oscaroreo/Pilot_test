#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Pilot Test Server...');
console.log('📁 Backend: ./backend/');
console.log('📄 Frontend: ./frontend/');
console.log('');

// 启动后端服务器
const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit'
});

serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
});

// 处理 Ctrl+C
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
});