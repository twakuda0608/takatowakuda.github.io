const fs = require('fs');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(trackCode);
const TRACKS = window.JR_TRACKS;

console.log('=== Checking tracks around Tachikawa & Nishi-Tachikawa ===');
Object.keys(TRACKS).forEach(id => {
  const chains = TRACKS[id] || [];
  chains.forEach((chain, cIdx) => {
    let nearT = false;
    let nearNT = false;
    chain.forEach(pt => {
      const lat = pt[0] > 90 ? pt[1] : pt[0];
      const lng = pt[0] > 90 ? pt[0] : pt[1];
      const dT = Math.hypot(lat - 35.69803, lng - 139.41396);
      const dNT = Math.hypot(lat - 35.70354, lng - 139.39339);
      if (dT < 0.005) nearT = true;
      if (dNT < 0.005) nearNT = true;
    });
    if (nearT || nearNT) {
      console.log(`Track: ${id}, chain: ${cIdx}, points: ${chain.length}, nearT: ${nearT}, nearNT: ${nearNT}`);
    }
  });
});
