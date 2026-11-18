const { JR_LINES, JR_STATIONS } = require('../data/build-data.js');
const { OFFICIAL_STATION_KILOS, applyOfficialKilos } = require('../data/official-kilos.js');
const { JR_TRACKS } = require('../data/tracks.js');
const engine = require('../route-engine.js');

applyOfficialKilos(JR_LINES);

const sobu = JR_LINES.find(l => l.id === 'sobu-main');
console.log('sobu branches:', sobu.branches);

const branch0 = sobu.branches[0];
const kilos = OFFICIAL_STATION_KILOS['sobu-main'];
for (let i = 0; i < branch0.length - 1; i++) {
  const u = branch0[i], v = branch0[i+1];
  const stU = JR_STATIONS[u], stV = JR_STATIONS[v];
  const kU = kilos[u] ?? kilos[stU?.name];
  const kV = kilos[v] ?? kilos[stV?.name];
  const sales = Math.abs(kV - kU);
  const coords = engine.getSegmentCoords(JR_TRACKS, JR_STATIONS, 'sobu-main', u, v);
  let trackLen = 0;
  for (let j = 0; j < coords.length - 1; j++) {
    const dLat = (coords[j][0] - coords[j+1][0]) * 111.13;
    const dLng = (coords[j][1] - coords[j+1][1]) * 91.0;
    trackLen += Math.sqrt(dLat*dLat + dLng*dLng);
  }
  console.log(`${stU?.name} -> ${stV?.name}: sales=${sales.toFixed(1)}, track=${trackLen.toFixed(2)}, diff=${Math.abs(sales - trackLen).toFixed(2)}`);
}
