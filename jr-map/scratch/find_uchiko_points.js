const { JR_TRACKS } = require('../data/tracks.js');

const found = [];
for (const [lineId, chains] of Object.entries(JR_TRACKS)) {
  chains.forEach((chain, cIdx) => {
    chain.forEach((pt, pIdx) => {
      const lat = pt[0];
      const lng = pt[1];
      if (lat >= 33.53 && lat <= 33.56 && lng >= 132.59 && lng <= 132.65) {
        found.push({ lineId, cIdx, pIdx, pt });
      }
    });
  });
}

console.log('Points found in Uchiko area:', found.length);
// Group by lineId
const byLine = {};
for (const f of found) {
  if (!byLine[f.lineId]) byLine[f.lineId] = 0;
  byLine[f.lineId]++;
}
console.log(byLine);
