const fs = require('fs');
const { JR_LINES, JR_STATIONS } = require('../data/build-data.js');
const { OFFICIAL_STATION_KILOS, applyOfficialKilos } = require('../data/official-kilos.js');
const { JR_TRACKS } = require('../data/tracks.js');

applyOfficialKilos(JR_LINES);

function calcDistKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat1 - lat2) * 111.13;
  const dLng = (lon1 - lon2) * 91.0;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

function calcBearing(lat1, lon1, lat2, lon2) {
  const DEG_TO_RAD = Math.PI / 180;
  const RAD_TO_DEG = 180 / Math.PI;
  const y = Math.sin((lon2 - lon1) * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD);
  const x = Math.cos(lat1 * DEG_TO_RAD) * Math.sin(lat2 * DEG_TO_RAD) -
            Math.sin(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.cos((lon2 - lon1) * DEG_TO_RAD);
  return (Math.atan2(y, x) * RAD_TO_DEG + 360) % 360;
}

const auditResults = {
  kilosNonMonotonic: [],
  kilosGeometryAnomalies: [],
  stationZigzags: []
};

JR_LINES.forEach(line => {
  const lineKilos = OFFICIAL_STATION_KILOS[line.id] || {};
  const chains = [line.stations, ...(line.branches || [])];

  chains.forEach((stIds, cIdx) => {
    const stations = stIds.map(id => JR_STATIONS[id]).filter(Boolean);
    let lastBearing = null;
    let dir = 0;

    for (let i = 0; i < stations.length - 1; i++) {
      const s1 = stations[i];
      const s2 = stations[i + 1];

      const k1 = lineKilos[s1.id] !== undefined ? lineKilos[s1.id] : lineKilos[s1.name];
      const k2 = lineKilos[s2.id] !== undefined ? lineKilos[s2.id] : lineKilos[s2.name];

      const geoDist = calcDistKm(s1.lat, s1.lng, s2.lat, s2.lng);

      if (k1 !== undefined && k2 !== undefined) {
        const salesDist = Math.round(Math.abs(k2 - k1) * 10) / 10;
        const rawDiff = k2 - k1;

        // 3. 単調性チェック
        const currentDir = rawDiff > 0 ? 1 : -1;
        if (rawDiff === 0) {
          auditResults.kilosNonMonotonic.push({
            type: 'ZERO_DIFF',
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            s1: s1.name,
            s2: s2.name,
            k1, k2
          });
        } else if (dir === 0) {
          dir = currentDir;
        } else if (dir !== currentDir) {
          auditResults.kilosNonMonotonic.push({
            type: 'REVERSED_DIRECTION',
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            s1: s1.name,
            s2: s2.name,
            k1, k2, rawDiff
          });
        }

        // 4. 営業キロ vs 直線幾何距離の異常乖離
        if (salesDist < geoDist * 0.7 && (geoDist - salesDist) > 1.0) {
          auditResults.kilosGeometryAnomalies.push({
            type: 'SALES_SHORTER_THAN_STRAIGHT',
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            s1: s1.name,
            s2: s2.name,
            salesDist,
            geoDist: Math.round(geoDist * 10) / 10
          });
        }
        if (geoDist > 5.0 && salesDist > geoDist * 3.5) {
          auditResults.kilosGeometryAnomalies.push({
            type: 'SALES_EXCESSIVE_RATIO',
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            s1: s1.name,
            s2: s2.name,
            salesDist,
            geoDist: Math.round(geoDist * 10) / 10,
            ratio: (salesDist / geoDist).toFixed(2)
          });
        }
        if (salesDist < 0.1) {
          auditResults.kilosGeometryAnomalies.push({
            type: 'GAP_UNDER_0_1KM',
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            s1: s1.name,
            s2: s2.name,
            salesDist
          });
        }
        const thirdSectorSplitLines = ['kyushu-kagoshima', 'shinetsu-main', 'ouu-main', 'hokkaido-nemuro', 'hokkaido-kaikyo'];
        if (!line.id.startsWith('shinkansen-') && !thirdSectorSplitLines.includes(line.id) && salesDist > 40) {
          auditResults.kilosGeometryAnomalies.push({
            type: 'GAP_OVER_40KM',
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            s1: s1.name,
            s2: s2.name,
            salesDist
          });
        }
      }

      // 5. 駅順のジグザグ
      const bearing = calcBearing(s1.lat, s1.lng, s2.lat, s2.lng);
      if (lastBearing !== null && geoDist > 0.3) {
        let angleDiff = Math.abs(bearing - lastBearing);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        if (angleDiff >= 150 && s1.name !== '会津若松') {
          auditResults.stationZigzags.push({
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            prevStation: stations[i - 1].name,
            currStation: s1.name,
            nextStation: s2.name,
            angleDiff: Math.round(angleDiff)
          });
        }
      }
      lastBearing = bearing;
    }
  });
});

console.log('kilosNonMonotonic:', auditResults.kilosNonMonotonic.length, auditResults.kilosNonMonotonic);
console.log('kilosGeometryAnomalies:', auditResults.kilosGeometryAnomalies.length, auditResults.kilosGeometryAnomalies);
console.log('stationZigzags:', auditResults.stationZigzags.length, auditResults.stationZigzags);
