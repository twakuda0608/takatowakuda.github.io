const fs = require('fs');
const path = require('path');
const { JR_LINES, JR_STATIONS } = require('../data/build-data.js');
const { JR_TRACKS } = require('../data/tracks.js');

function distToSegmentSquared(px, py, vx, vy, wx, wy) {
  const l2 = (vx - wx) ** 2 + (vy - wy) ** 2;
  if (l2 === 0) return (px - vx) ** 2 + (py - vy) ** 2;
  let t = ((px - vx) * (wx - vx) + (py - vy) * (wy - vy)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = vx + t * (wx - vx);
  const projY = vy + t * (wy - vy);
  return (px - projX) ** 2 + (py - projY) ** 2;
}

function minDistanceToPolylineMeters(stLat, stLng, chains) {
  if (!chains || chains.length === 0) return Infinity;
  const DEG_TO_RAD = Math.PI / 180;
  const cosLat = Math.cos(stLat * DEG_TO_RAD);
  const mPerLat = 111132.954;
  const mPerLng = 111412.84 * cosLat;

  let minDistSq = Infinity;

  for (const chain of chains) {
    if (!chain || chain.length === 0) continue;
    if (chain.length === 1) {
      const vx = (chain[0][1] - stLng) * mPerLng;
      const vy = (chain[0][0] - stLat) * mPerLat;
      const d2 = vx * vx + vy * vy;
      if (d2 < minDistSq) minDistSq = d2;
      continue;
    }
    for (let i = 0; i < chain.length - 1; i++) {
      const vx = (chain[i][1] - stLng) * mPerLng;
      const vy = (chain[i][0] - stLat) * mPerLat;
      const wx = (chain[i + 1][1] - stLng) * mPerLng;
      const wy = (chain[i + 1][0] - stLat) * mPerLat;
      const d2 = distToSegmentSquared(0, 0, vx, vy, wx, wy);
      if (d2 < minDistSq) {
        minDistSq = d2;
      }
    }
  }
  return Math.sqrt(minDistSq);
}

const disconnectedStations = [];

JR_LINES.forEach(line => {
  const chains = JR_TRACKS[line.id] || [];
  
  // All stations on this line (stations array + branches)
  const stationIdSet = new Set(line.stations);
  if (line.branches) {
    line.branches.forEach(branch => {
      branch.forEach(id => stationIdSet.add(id));
    });
  }

  for (const stId of stationIdSet) {
    const st = JR_STATIONS[stId];
    if (!st) {
      disconnectedStations.push({
        lineId: line.id,
        lineName: line.name,
        stId,
        stName: 'UNKNOWN_STATION',
        distMeters: Infinity,
        reason: 'Station definition missing'
      });
      continue;
    }

    const distM = minDistanceToPolylineMeters(st.lat, st.lng, chains);
    if (distM >= 150) {
      disconnectedStations.push({
        lineId: line.id,
        lineName: line.name,
        stId: st.id,
        stName: st.name,
        lat: st.lat,
        lng: st.lng,
        distMeters: Math.round(distM)
      });
    }
  }
});

console.log(`=== 全駅・線路近接監査結果 (>= 150m) ===`);
console.log(`総検出数: ${disconnectedStations.length} 件\n`);

// Group by line
const byLine = {};
for (const item of disconnectedStations) {
  if (!byLine[item.lineId]) byLine[item.lineId] = { name: item.lineName, stations: [] };
  byLine[item.lineId].stations.push(item);
}

for (const [lineId, data] of Object.entries(byLine)) {
  console.log(`[${lineId}] ${data.name} (${data.stations.length}駅):`);
  for (const s of data.stations) {
    console.log(`   - ${s.stName} (${s.stId}): ${s.distMeters}m`);
  }
}
