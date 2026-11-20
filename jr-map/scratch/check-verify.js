const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tmpHtml = path.join(os.tmpdir(), 'test_verify_map.html');
const res = spawnSync(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--allow-file-access-from-files',
  '--virtual-time-budget=8000',
  '--dump-dom',
  'file:///' + tmpHtml.replace(/\\/g, '/')
], { encoding: 'utf8' });
console.log('stdout len:', res.stdout.length);
const idx = res.stdout.indexOf('<pre id="output">');
console.log('pre:', res.stdout.slice(idx, idx + 800));
