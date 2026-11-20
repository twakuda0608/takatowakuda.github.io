const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = 'file:///C:/takatowakuda.github.io/jr-map/scratch/test.html';
const tempDir = os.tmpdir();
const shotPathPC = path.join(tempDir, 'jr_map_actual_view_pc.png');
const shotPathSP = path.join(tempDir, 'jr_map_actual_view_sp.png');

if (fs.existsSync(shotPathPC)) fs.unlinkSync(shotPathPC);
if (fs.existsSync(shotPathSP)) fs.unlinkSync(shotPathSP);

console.log('Capturing PC screenshot to:', shotPathPC);
spawnSync(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--allow-file-access-from-files',
  '--window-size=1280,800',
  '--virtual-time-budget=4000',
  `--screenshot=${shotPathPC}`,
  htmlPath
], { encoding: 'utf8' });

console.log('Capturing SP screenshot to:', shotPathSP);
spawnSync(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--allow-file-access-from-files',
  '--window-size=390,844',
  '--virtual-time-budget=4000',
  `--screenshot=${shotPathSP}`,
  htmlPath
], { encoding: 'utf8' });

console.log('PC Shot exists:', fs.existsSync(shotPathPC), 'Size:', fs.existsSync(shotPathPC) ? fs.statSync(shotPathPC).size : 0);
console.log('SP Shot exists:', fs.existsSync(shotPathSP), 'Size:', fs.existsSync(shotPathSP) ? fs.statSync(shotPathSP).size : 0);

// Remember rule: "確認用スクリーンショットを作成した場合は、作業完了前に削除する。"
if (fs.existsSync(shotPathPC)) fs.unlinkSync(shotPathPC);
if (fs.existsSync(shotPathSP)) fs.unlinkSync(shotPathSP);
console.log('Screenshots cleanly cleaned up per AGENTS.md rule.');
