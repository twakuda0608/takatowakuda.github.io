const path = require('path');
const { JR_LINES, JR_STATIONS } = require('../data/build-data.js');
const { OFFICIAL_STATION_KILOS } = require('../data/official-kilos.js');

function calcDistKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const anomalies = [];
JR_LINES.forEach(line => {
  const lineKilos = OFFICIAL_STATION_KILOS[line.id] || {};
  const stations = line.stations.map(id => JR_STATIONS[id]).filter(Boolean);

  for (let i = 0; i < stations.length - 1; i++) {
    const s1 = stations[i];
    const s2 = stations[i + 1];

    const k1 = lineKilos[s1.id] !== undefined ? lineKilos[s1.id] : lineKilos[s1.name];
    const k2 = lineKilos[s2.id] !== undefined ? lineKilos[s2.id] : lineKilos[s2.name];

    const geoDist = calcDistKm(s1.lat, s1.lng, s2.lat, s2.lng);

    if (k1 !== undefined && k2 !== undefined) {
      const salesDist = Math.round(Math.abs(k2 - k1) * 10) / 10;
      if (salesDist < geoDist * 0.7 && (geoDist - salesDist) > 1.0) {
        anomalies.push({ type: 'SALES_SHORTER', line: line.name, s1: s1.name, s2: s2.name, salesDist, geoDist });
      }
      if (geoDist > 5.0 && salesDist > geoDist * 3.5) {
        anomalies.push({ type: 'EXCESSIVE_RATIO', line: line.name, s1: s1.name, s2: s2.name, salesDist, geoDist, ratio: salesDist/geoDist });
      }
    }
  }
});
console.log('Anomalies count:', anomalies.length);
console.log(anomalies);
