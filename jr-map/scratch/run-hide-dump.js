const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tmpHtml = path.join(os.tmpdir(), 'test_zoom_hide.html');
const res = spawnSync(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--allow-file-access-from-files',
  '--virtual-time-budget=3000',
  '--dump-dom',
  'file:///' + tmpHtml.replace(/\\/g, '/')
], { encoding: 'utf8' });
const pre = res.stdout ? res.stdout.indexOf('<pre id="output">') : -1;
if (pre !== -1) {
  console.log(res.stdout.slice(pre, pre + 800));
}
