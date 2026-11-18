const buildData = require('../data/build-data.js');
const line = buildData.JR_LINES.find(l => l.id === 'kishin-line');
console.log('Kishin stations in build-data:');
for (const stId of line.stations) {
  const st = buildData.JR_STATIONS[stId];
  console.log(stId, st ? st.name : 'unknown');
}
