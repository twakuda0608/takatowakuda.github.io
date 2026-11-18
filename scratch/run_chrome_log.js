const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.resolve('scratch/chrome_test_profile');
if (fs.existsSync(userDataDir)) {
  fs.rmSync(userDataDir, { recursive: true, force: true });
}
fs.mkdirSync(userDataDir, { recursive: true });

try {
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    '--enable-logging',
    '--v=1',
    '--virtual-time-budget=3000',
    'file:///C:/takatowakuda.github.io/jr-map/index.html'
  ], { timeout: 10000 });
} catch (e) {
  // ok
}

const logFile = path.join(userDataDir, 'chrome_debug.log');
if (fs.existsSync(logFile)) {
  const content = fs.readFileSync(logFile, 'utf8');
  console.log('--- CHROME LOG SNIPPET (errors/console only) ---');
  const lines = content.split('\n').filter(l => l.includes('ERROR:') || l.includes('CONSOLE'));
  if (lines.length === 0) {
    console.log('No errors or console messages found!');
  } else {
    lines.forEach(l => console.log(l));
  }
} else {
  console.log('No chrome_debug.log created.');
}

try {
  fs.rmSync(userDataDir, { recursive: true, force: true });
} catch (e) {}
