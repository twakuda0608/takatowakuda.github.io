const { JR_LINES, JR_STATIONS } = require('../data/build-data.js');
const { OFFICIAL_STATION_KILOS, applyOfficialKilos } = require('../data/official-kilos.js');
const { JR_TRACKS } = require('../data/tracks.js');

applyOfficialKilos(JR_LINES);

function calcDistKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat1 - lat2) * 111.13;
  const dLng = (lon1 - lon2) * 91.0;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

JR_LINES.forEach(line => {
  const chains = [line.stations, ...(line.branches || [])];
  chains.forEach((stIds, cIdx) => {
    const stations = stIds.map(id => JR_STATIONS[id]).filter(Boolean);
    const lineKilos = OFFICIAL_STATION_KILOS[line.id] || {};
    for (let i = 0; i < stations.length - 1; i++) {
      const s1 = stations[i];
      const s2 = stations[i+1];
      const k1 = lineKilos[s1.id] ?? lineKilos[s1.name];
      const k2 = lineKilos[s2.id] ?? lineKilos[s2.name];
      if (k1 === undefined || k2 === undefined) continue;
      const salesDist = Math.abs(k2 - k1);
      const geoDist = calcDistKm(s1.lat, s1.lng, s2.lat, s2.lng);
      if (salesDist < geoDist - 0.4) {
        console.log(`[${line.id}] ${s1.name} -> ${s2.name}: sales=${salesDist}, geo=${geoDist.toFixed(2)}`);
      }
    }
  });
});
console.log('Check complete.');
