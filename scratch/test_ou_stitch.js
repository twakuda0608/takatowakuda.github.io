const fs = require('fs');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(trackCode);

const sTrack = window.JR_TRACKS['ou-main-south'][0];
const nTrack = window.JR_TRACKS['ou-main-north'][0];

console.log('sTrack points:', sTrack.length);
console.log('nTrack points:', nTrack.length);

// nTrack start is [37.81279, 140.23481]
// let us find the closest point in sTrack to nTrack[0]
let minD = 99999, minIdx = -1;
sTrack.forEach((pt, idx) => {
  const d = Math.hypot(pt[0] - nTrack[0][0], pt[1] - nTrack[0][1]);
  if (d < minD) {
    minD = d;
    minIdx = idx;
  }
});
console.log(`Closest point in sTrack to nTrack[0]: idx ${minIdx}, coord: [${sTrack[minIdx]}], dist: ${minD}`);

// Also check sTrack end: [40.82799, 140.67219] in nTrack
let minEndD = 99999, minEndIdx = -1;
nTrack.forEach((pt, idx) => {
  const d = Math.hypot(pt[0] - sTrack[sTrack.length-1][0], pt[1] - sTrack[sTrack.length-1][1]);
  if (d < minEndD) {
    minEndD = d;
    minEndIdx = idx;
  }
});
console.log(`Closest point in nTrack to sTrack[end]: idx ${minEndIdx}, coord: [${nTrack[minEndIdx]}], dist: ${minEndD}`);
