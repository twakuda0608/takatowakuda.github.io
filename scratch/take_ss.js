const { spawnSync } = require('child_process');
const path = require('path');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve('jr-map/index.html').replace(/\\/g, '/');
const outPath = path.resolve('scratch/page.png').replace(/\\/g, '/');

const res = spawnSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--virtual-time-budget=3000',
  `--screenshot=${outPath}`,
  '--window-size=1280,800',
  `file:///${htmlPath}`
], { encoding: 'utf8' });

console.log('status:', res.status);
console.log('stderr:', res.stderr ? res.stderr.slice(0, 1000) : 'none');
const fs = require('fs');
if (fs.existsSync('scratch/page.png')) {
  console.log('page.png created! size:', fs.statSync('scratch/page.png').size);
} else {
  console.log('page.png not found');
}
