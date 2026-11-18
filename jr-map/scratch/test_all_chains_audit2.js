const fs = require('fs');
const { JR_LINES, JR_STATIONS } = require('../data/build-data.js');
const { OFFICIAL_STATION_KILOS, applyOfficialKilos } = require('../data/official-kilos.js');

applyOfficialKilos(JR_LINES);

function calcDistKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat1 - lat2) * 111.13;
  const dLng = (lon1 - lon2) * 91.0;
  return Math.sqrt(dLat * dLat + dLng * dLng);
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

      let salesDist;
      let rawDiff = 0;
      if (line.edgeDistances) {
        const k1Key = `${s1.id}-${s2.id}`;
        const k2Key = `${s2.id}-${s1.id}`;
        const kName1 = `${s1.name}-${s2.name}`;
        const kName2 = `${s2.name}-${s1.name}`;
        const edgeD = line.edgeDistances[k1Key] ?? line.edgeDistances[k2Key] ??
                      line.edgeDistances[kName1] ?? line.edgeDistances[kName2];
        if (edgeD !== undefined && edgeD !== null) {
          salesDist = edgeD;
          rawDiff = dir >= 0 ? edgeD : -edgeD;
        }
      }
      if (salesDist === undefined && k1 !== undefined && k2 !== undefined) {
        salesDist = Math.round(Math.abs(k2 - k1) * 10) / 10;
        rawDiff = k2 - k1;
      }

      const geoDist = calcDistKm(s1.lat, s1.lng, s2.lat, s2.lng);

      if (salesDist !== undefined) {
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
    }
  });
});

console.log('kilosNonMonotonic:', auditResults.kilosNonMonotonic.length);
console.log('kilosGeometryAnomalies:', auditResults.kilosGeometryAnomalies.length);
console.log('stationZigzags:', auditResults.stationZigzags.length);
