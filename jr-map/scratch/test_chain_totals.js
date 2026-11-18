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
  const lineKilos = OFFICIAL_STATION_KILOS[line.id] || {};
  const chains = [line.stations, ...(line.branches || [])];
  chains.forEach((stIds, cIdx) => {
    if (stIds.length < 2) return;
    const u = stIds[0];
    const v = stIds[stIds.length - 1];
    const kU = lineKilos[u] ?? lineKilos[JR_STATIONS[u]?.name];
    const kV = lineKilos[v] ?? lineKilos[JR_STATIONS[v]?.name];
    if (kU !== undefined && kV !== undefined) {
      const totalSales = Math.abs(kV - kU);
      // tracks
      const rawChains = JR_TRACKS[line.id];
      if (rawChains && rawChains[cIdx]) {
        let trackLen = 0;
        const c = rawChains[cIdx];
        for (let i = 0; i < c.length - 1; i++) {
          trackLen += calcDistKm(c[i][0], c[i][1], c[i+1][0], c[i+1][1]);
        }
        console.log(`[${line.id} cIdx:${cIdx}] sales=${totalSales.toFixed(1)}km, track=${trackLen.toFixed(1)}km, diff=${Math.abs(totalSales - trackLen).toFixed(1)}km`);
      }
    }
  });
});
