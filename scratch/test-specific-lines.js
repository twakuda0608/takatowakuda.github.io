const fs = require('fs');

const tracksContent = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const dataContent = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

const window = {};
eval(tracksContent);
eval(dataContent);

const TRACKS = window.JR_TRACKS || {};
const LINES = window.JR_LINES;
const STATIONS = window.JR_STATIONS;

const targetLineIds = ['nikko-line', 'chuo-main', 'chuo-west', 'tokaido-main', 'tohoku-main', 'yamanote'];

targetLineIds.forEach(id => {
  const line = LINES.find(l => l.id === id);
  if (!line) {
    console.log(`Line ${id} not found`);
    return;
  }
  const chains = TRACKS[line.id] || [];
  let mainChain = chains[0] || [];
  for (let i = 1; i < chains.length; i++) {
    if (chains[i].length > mainChain.length) mainChain = chains[i];
  }

  const totalPts = mainChain.length;
  console.log(`\n=== ${line.name} (${line.id}) - pts: ${totalPts} ===`);
  
  // 比率 0.50 での局所ベクトル
  const centerIdx = Math.floor(totalPts * 0.5);
  const halfWindow = Math.min(25, Math.floor(totalPts / 2));
  const startIdx = Math.max(0, centerIdx - halfWindow);
  const endIdx = Math.min(totalPts, centerIdx + halfWindow);
  let slotPts = mainChain.slice(startIdx, endIdx);

  const pStart = slotPts[0];
  const pEnd = slotPts[slotPts.length - 1];
  const origDLng = pEnd[1] - pStart[1];
  const origDLat = pEnd[0] - pStart[0];

  let reversed = false;
  if (Math.abs(origDLng) >= 0.001) {
    if (origDLng < 0) reversed = true;
  } else {
    if (origDLat < 0) reversed = true;
  }
  if (reversed) slotPts.reverse();

  const fStart = slotPts[0];
  const fEnd = slotPts[slotPts.length - 1];
  const finalDLng = fEnd[1] - fStart[1];
  const finalDLat = fEnd[0] - fStart[0];
  const angleDeg = Math.atan2(finalDLat, finalDLng) * 180 / Math.PI;

  console.log(`Original: dLng=${origDLng.toFixed(4)}, dLat=${origDLat.toFixed(4)}`);
  console.log(`Reversed?: ${reversed}`);
  console.log(`Final:    dLng=${finalDLng.toFixed(4)}, dLat=${finalDLat.toFixed(4)}, angle=${angleDeg.toFixed(1)}°`);
  console.log(`Is Right-Reading (dLng > 0)?: ${finalDLng > 0 ? 'YES (正立)' : 'NO (倒立)'}`);
});
