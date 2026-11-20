const { spawnSync } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const res = spawnSync(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--allow-file-access-from-files',
  '--virtual-time-budget=6000',
  '--dump-dom',
  'file:///C:/takatowakuda.github.io/jr-map/scratch/test.html'
], { encoding: 'utf8' });

const m = res.stdout.match(/<pre id="test-results">([\s\S]*?)<\/pre>/);
if (m) {
  console.log('=== TEST RESULTS ===');
  console.log(m[1]);
} else {
  console.log('Not found in DOM');
}
