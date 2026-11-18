const { JR_TRACKS } = require('../data/tracks.js');
const { JR_STATIONS } = require('../data/build-data.js');

const items = [
  { stId: 'tamachi', lineId: 'tokaido' },
  { stId: 'higashi-sanjo', lineId: 'yahiko-line' },
  { stId: 'st-h8wx', lineId: 'togane-line' },
  { stId: 'abiko', lineId: 'narita-line' },
  { stId: 'mikawa-anjo', lineId: 'tokai-tokaido' },
  { stId: 'tokyo', lineId: 'tohoku-main' },
  { stId: 'st-ehsj', lineId: 'tohoku-main' },
  { stId: 'niitsu', lineId: 'uetsu-main' }
];

for (const item of items) {
  const st = JR_STATIONS[item.stId];
  const chains = JR_TRACKS[item.lineId];
  let minD = Infinity, nearestPt = null, cIdx = -1, pIdx = -1;
  chains.forEach((c, ci) => {
    c.forEach((pt, pi) => {
      const d = Math.hypot((pt[0]-st.lat)*111.13, (pt[1]-st.lng)*90);
      if (d < minD) { minD = d; nearestPt = pt; cIdx = ci; pIdx = pi; }
    });
  });
  console.log(`${st.name} (${item.stId}) on ${item.lineId}:`);
  console.log(`  dist: ${Math.round(minD*1000)}m`);
  console.log(`  stPos: [${st.lat}, ${st.lng}]`);
  console.log(`  nearestPt in chain ${cIdx} pt ${pIdx}: [${nearestPt}]`);
  console.log(`  chain ${cIdx} start: [${chains[cIdx][0]}], end: [${chains[cIdx][chains[cIdx].length-1]}]`);
}
