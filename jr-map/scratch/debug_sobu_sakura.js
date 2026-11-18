const { JR_TRACKS } = require('../data/tracks.js');
const { JR_STATIONS } = require('../data/build-data.js');

const sm0 = JR_TRACKS['sobu-main'][0];
const sakura = JR_STATIONS['sakura'];

// Find points in sobu-main within 1km of Sakura
sm0.forEach((p, i) => {
  const d = Math.hypot(p[0] - sakura.lat, (p[1] - sakura.lng) * Math.cos(sakura.lat * Math.PI / 180)) * 111132;
  if (d < 1200) {
    console.log(`sobu-main idx ${i}:`, p, `d=${Math.round(d)}m`);
  }
});
