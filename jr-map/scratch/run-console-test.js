const { spawnSync } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const res = spawnSync(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--allow-file-access-from-files',
  '--enable-logging=stderr',
  '--v=1',
  '--virtual-time-budget=4000',
  'file:///C:/takatowakuda.github.io/jr-map/scratch/test.html'
], { encoding: 'utf8' });

console.log('Stderr from Chrome:');
console.log(res.stderr.split('\n').filter(l => l.includes('CONSOLE') || l.includes('Test') || l.includes('visible')).join('\n'));
