const { JR_LINES, JR_STATIONS } = require('../data/build-data.js');
const { OFFICIAL_STATION_KILOS, applyOfficialKilos } = require('../data/official-kilos.js');
const { JR_TRACKS } = require('../data/tracks.js');
const engine = require('../route-engine.js');

applyOfficialKilos(JR_LINES);

function calcDistKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat1 - lat2) * 111.13;
  const dLng = (lon1 - lon2) * 91.0;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

function polylineLengthKm(coords) {
  let len = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    len += calcDistKm(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1]);
  }
  return len;
}

const mismatches = [];

JR_LINES.forEach(line => {
  const chains = [line.stations, ...(line.branches || [])];
  chains.forEach((stIds, cIdx) => {
    for (let i = 0; i < stIds.length - 1; i++) {
      const u = stIds[i];
      const v = stIds[i+1];
      const stU = JR_STATIONS[u];
      const stV = JR_STATIONS[v];
      if (!stU || !stV) continue;

      const edgeInfo = engine.buildGraph([line], JR_STATIONS).get(u)?.find(e => e.to === v);
      const salesDist = edgeInfo ? edgeInfo.dist : null;
      if (salesDist === null || edgeInfo.isEstimated) continue;

      const coords = engine.getSegmentCoords(JR_TRACKS, JR_STATIONS, line.id, u, v);
      if (!coords || coords.length < 2) continue;

      const trackLen = Math.round(polylineLengthKm(coords) * 10) / 10;
      const diff = Math.round(Math.abs(salesDist - trackLen) * 10) / 10;

      // 線路ポリラインより営業キロが0.4km以上短い（物理的にあり得ない）場合
      if (salesDist < trackLen - 0.4) {
        mismatches.push({
          line: line.name,
          chain: cIdx,
          u: stU.name,
          v: stV.name,
          salesDist,
          trackLen,
          diff
        });
      }
    }
  });
});

console.log('Mismatches (sales < trackLen - 0.4):', mismatches.length);
mismatches.slice(0, 10).forEach(m => console.log(m));
