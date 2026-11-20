const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tmpHtml = path.join(os.tmpdir(), 'test_zoom.html');
const res = spawnSync(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--allow-file-access-from-files',
  '--virtual-time-budget=2000',
  '--dump-dom',
  'file:///' + tmpHtml.replace(/\\/g, '/')
], { encoding: 'utf8' });
console.log('stdout length:', res.stdout.length);
const m = res.stdout.match(/<pre id="output">([\s\S]*?)<\/pre>/);
if (m) console.log('Found:', m[1]);
else console.log('Not found, body:', res.stdout.slice(res.stdout.indexOf('<body'), res.stdout.indexOf('</body>')));
