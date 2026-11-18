const { JR_TRACKS } = require('../data/tracks.js');
const { JR_STATIONS } = require('../data/build-data.js');

const c0 = JR_TRACKS['narita-line'][0];
const sakura = JR_STATIONS['sakura'];

let minD = Infinity, minI = -1;
c0.forEach((p, i) => {
  const d = Math.hypot(p[0] - sakura.lat, (p[1] - sakura.lng) * Math.cos(sakura.lat * Math.PI / 180)) * 111132;
  if (d < minD) { minD = d; minI = i; }
});

console.log('Min dist to Sakura:', minD, 'at index:', minI, 'point:', c0[minI]);
c0.splice(226, 0,
  [35.70985, 140.22765],
  [35.70974, 140.22676],
  [35.70985, 140.22765]
);

minD = Infinity; minI = -1;
c0.forEach((p, i) => {
  const d = Math.hypot(p[0] - sakura.lat, (p[1] - sakura.lng) * Math.cos(sakura.lat * Math.PI / 180)) * 111132;
  if (d < minD) { minD = d; minI = i; }
});

console.log('After splice - Min dist to Sakura:', minD, 'at index:', minI, 'point:', c0[minI]);

