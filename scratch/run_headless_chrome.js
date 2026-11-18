const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const WebSocket = null; // Node standard has no ws, but we can check via fetch/http endpoints or launch headless with dump-dom / console logging

// Chromeのフラグでコンソールログをstderrに出力させる方法:
// chrome.exe --headless=new --enable-logging=stderr --v=1 "file:///..."
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'file:///' + path.resolve('jr-map/index.html').replace(/\\/g, '/');

console.log('Target URL:', targetUrl);

const proc = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--enable-logging=stderr',
  '--v=1',
  '--dump-dom',
  targetUrl
]);

let stdout = '';
let stderr = '';

proc.stdout.on('data', d => { stdout += d.toString(); });
proc.stderr.on('data', d => { stderr += d.toString(); });

proc.on('close', code => {
  console.log('Chrome exited with code:', code);
  console.log('--- STDERR (logs/errors) ---');
  console.log(stderr.slice(0, 3000));
  console.log('--- STDOUT (DOM slice) ---');
  console.log(stdout.slice(0, 1500));
});
