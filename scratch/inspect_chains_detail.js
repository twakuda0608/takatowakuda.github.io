const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const STATIONS = window.JR_STATIONS;
const TRACKS = window.JR_TRACKS;

const chains = TRACKS['tokai-tokaido'] || [];

function inspectChain(idx) {
  const ch = chains[idx].map(pt => pt[0] > 90 ? [pt[1], pt[0]] : pt);
  console.log(`=== Chain ${idx} (points: ${ch.length}) ===`);
  console.log('Start:', ch[0], 'End:', ch[ch.length - 1]);
  // どの駅の近くを通るか
  const nearbyStations = [];
  ['大垣', '荒尾', '美濃赤坂', '垂井', '関ヶ原', '柏原'].forEach(name => {
    let st = null;
    for (const id in STATIONS) {
      if (STATIONS[id].name === name) { st = STATIONS[id]; break; }
    }
    if (!st) return;
    let minD = Infinity;
    ch.forEach(p => {
      const d = Math.hypot(p[0] - st.lat, p[1] - st.lng);
      if (d < minD) minD = d;
    });
    if (minD < 0.05) {
      nearbyStations.push(`${name} (${(minD * 111).toFixed(2)}km)`);
    }
  });
  console.log('Nearby stations:', nearbyStations.join(', '));
}

[1, 5, 6, 7].forEach(inspectChain);
