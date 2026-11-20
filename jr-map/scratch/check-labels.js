const { spawnSync } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const res = spawnSync(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--allow-file-access-from-files',
  '--dump-dom',
  'file:///C:/takatowakuda.github.io/jr-map/scratch/test.html'
], { encoding: 'utf8' });
const match = res.stdout.match(/class="[^"]*station-label[^"]*"/g);
console.log('Sample station-label elements:', match ? match.slice(0, 5) : 'none');
