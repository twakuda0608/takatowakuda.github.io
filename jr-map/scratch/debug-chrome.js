const { spawn } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = 'file:///C:/takatowakuda.github.io/jr-map/scratch/test.html';

const proc = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--allow-file-access-from-files',
  '--enable-logging=stderr',
  '--v=1',
  htmlPath
]);

proc.stdout.on('data', d => console.log('STDOUT:', d.toString()));
proc.stderr.on('data', d => console.log('STDERR:', d.toString()));

setTimeout(() => {
  proc.kill();
  process.exit(0);
}, 3000);
