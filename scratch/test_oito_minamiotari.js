const fs = require('fs');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(trackCode);

const tLine = window.JR_TRACKS['oito-line'][0];
const minamiotari = [36.7746, 137.90836];

// find minamiotari in tLine
let minD = 9999, minIdx = -1;
tLine.forEach((pt, idx) => {
  const d = Math.hypot(pt[0] - minamiotari[0], pt[1] - minamiotari[1]);
  if (d < minD) {
    minD = d;
    minIdx = idx;
  }
});
console.log(`Minamiotari in tLine: idx ${minIdx}, coord: [${tLine[minIdx]}], dist: ${minD}`);
console.log(`Total pts in tLine: ${tLine.length}`);
