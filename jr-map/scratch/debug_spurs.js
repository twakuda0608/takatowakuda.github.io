const { JR_TRACKS } = require('../data/tracks.js');
const { JR_STATIONS } = require('../data/build-data.js');

const aw = JR_STATIONS['aizu-wakamatsu'];
const bw = JR_TRACKS['banetsu-west'][0];
let minD = Infinity, minIdx = -1;
bw.forEach((pt, i) => {
  const d = Math.hypot(pt[0] - aw.lat, pt[1] - aw.lng);
  if (d < minD) { minD = d; minIdx = i; }
});
console.log('Banetsu-west closest to Aizu-Wakamatsu: idx', minIdx, 'dist:', Math.round(minD * 111000), 'm', bw[minIdx]);
console.log('Points around minIdx:', bw.slice(Math.max(0, minIdx - 2), minIdx + 3));

const engaru = JR_STATIONS['st-pcbh'];
const s0 = JR_TRACKS['hokkaido-sekihoku'][0];
console.log('Sekihoku chain 0 around 1164:', s0.slice(1162, 1168));


