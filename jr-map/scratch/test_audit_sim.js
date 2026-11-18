const fs = require('fs');
const path = require('path');

const { JR_LINES, JR_STATIONS } = require('../data/build-data.js');
const { OFFICIAL_STATION_KILOS } = require('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/official-kilos-updated.js');
const { JR_TRACKS } = require('../data/tracks.js');

// 1. Missing branch line tracks extraction
// Sawara branch
if (JR_TRACKS['hokkaido-hakodate'] && JR_TRACKS['hokkaido-hakodate'][1]) {
  JR_TRACKS['hokkaido-hakodate-sawara'] = [JR_TRACKS['hokkaido-hakodate'][1]];
}

// Chitose Airport branch
if (JR_TRACKS['hokkaido-chitose'] && JR_TRACKS['hokkaido-chitose'][1]) {
  JR_TRACKS['hokkaido-chitose-airport'] = [JR_TRACKS['hokkaido-chitose'][1]];
}

// Muroran branch
if (JR_TRACKS['hokkaido-muroran'] && JR_TRACKS['hokkaido-muroran'][1]) {
  JR_TRACKS['hokkaido-muroran-branch'] = [JR_TRACKS['hokkaido-muroran'][1]];
}

// Wadamisaki branch
if (JR_TRACKS['sanyo-main'] && JR_TRACKS['sanyo-main'][1]) {
  JR_TRACKS['sanyo-wadamisaki'] = [JR_TRACKS['sanyo-main'][1]];
}

// Senzaki branch
if (JR_TRACKS['sanin-main'] && JR_TRACKS['sanin-main'][1]) {
  JR_TRACKS['sanin-senzaki'] = [JR_TRACKS['sanin-main'][1]];
}

// Uchiko branch
if (JR_TRACKS['shikoku-yosan'] && JR_TRACKS['shikoku-yosan'][1]) {
  JR_TRACKS['shikoku-uchiko'] = [JR_TRACKS['shikoku-yosan'][1]];
}

// Nagasaki Nagayo branch
if (JR_TRACKS['kyushu-nagasaki'] && JR_TRACKS['kyushu-nagasaki'][1]) {
  JR_TRACKS['kyushu-nagasaki-nagayo'] = [JR_TRACKS['kyushu-nagasaki'][1]];
}

// 2. Tohoku Main Line double line fix
if (JR_TRACKS['tohoku-main'] && JR_TRACKS['keihin-tohoku']) {
  const tokyoToAkabane = JR_TRACKS['tohoku-main'][0].slice(0, 68);
  const akabaneToOmiya = JR_TRACKS['keihin-tohoku'][0].slice(1, 134).reverse();
  const omiyaNorth = JR_TRACKS['tohoku-main'][0].slice(640);
  JR_TRACKS['tohoku-main'] = [
    [...tokyoToAkabane, ...akabaneToOmiya, ...omiyaNorth],
    JR_TRACKS['tohoku-main'][0].slice(68, 317)
  ];
}

// 3. Remove stub chains (<= 5 pts) and boomerangs from all lines
function calcDistKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

for (const lineId in JR_TRACKS) {
  let chains = JR_TRACKS[lineId];
  if (!chains) continue;
  // filter stub chains <= 5 pts
  chains = chains.filter(c => c.length > 5);
  // remove boomerang points
  chains = chains.map(chain => {
    const clean = [];
    for (let i = 0; i < chain.length; i++) {
      if (i > 0 && i < chain.length - 1) {
        const pPrev = chain[i - 1];
        const pCurr = chain[i];
        const pNext = chain[i + 1];
        const dOut = calcDistKm(pPrev[0], pPrev[1], pCurr[0], pCurr[1]);
        const dBack = calcDistKm(pCurr[0], pCurr[1], pNext[0], pNext[1]);
        const dChord = calcDistKm(pPrev[0], pPrev[1], pNext[0], pNext[1]);
        if (dChord < 0.05 && dOut > 0.5) {
          // Skip boomerang spike point
          continue;
        }
      }
      clean.push(chain[i]);
    }
    return clean;
  });
  JR_TRACKS[lineId] = chains;
}

// Now run audit checks
const auditResults = {
  tracksShortOrDuplicateChains: [],
  tracksMissingLines: [],
  tracksJumps: [],
  kilosNonMonotonic: [],
  kilosGeometryAnomalies: [],
  stationZigzags: []
};

JR_LINES.forEach(line => {
  const chains = JR_TRACKS[line.id];
  if (!chains || chains.length === 0) {
    auditResults.tracksMissingLines.push(line.id);
    return;
  }
  chains.forEach((chain, cIdx) => {
    if (chain.length <= 5) {
      auditResults.tracksShortOrDuplicateChains.push({ lineId: line.id, cIdx, len: chain.length });
    }
    for (let i = 0; i < chain.length - 1; i++) {
      const p1 = chain[i];
      const p2 = chain[i + 1];
      const d = calcDistKm(p1[0], p1[1], p2[0], p2[1]);
      if (i > 0) {
        const p0 = chain[i - 1];
        const distReturn = calcDistKm(p0[0], p0[1], p2[0], p2[1]);
        if (distReturn < 0.05 && d > 0.5) {
          auditResults.tracksJumps.push({ type: 'BOOMERANG', lineId: line.id, cIdx, i, d });
        }
      }
    }
  });
});

JR_LINES.forEach(line => {
  const lineKilos = OFFICIAL_STATION_KILOS[line.id] || {};
  const stations = line.stations.map(id => JR_STATIONS[id]).filter(Boolean);
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
      const currentDir = rawDiff > 0 ? 1 : -1;
      if (rawDiff === 0) {
        auditResults.kilosNonMonotonic.push({ type: 'ZERO_DIFF', lineId: line.id, s1: s1.name, s2: s2.name });
      } else if (dir === 0) {
        dir = currentDir;
      } else if (dir !== currentDir) {
        auditResults.kilosNonMonotonic.push({ type: 'REVERSED', lineId: line.id, s1: s1.name, s2: s2.name, k1, k2 });
      }

      if (salesDist < geoDist * 0.95 && geoDist > 0.5) {
        auditResults.kilosGeometryAnomalies.push({ type: 'SHORTER', lineId: line.id, s1: s1.name, s2: s2.name, salesDist, geoDist });
      }
    }
  }
});

console.log('--- AUDIT SIMULATION RESULTS ---');
console.log('tracksMissingLines:', auditResults.tracksMissingLines.length);
if (auditResults.tracksMissingLines.length > 0) console.log(auditResults.tracksMissingLines);
console.log('tracksShortOrDuplicateChains:', auditResults.tracksShortOrDuplicateChains.length);
console.log('tracksJumps (boomerangs):', auditResults.tracksJumps.length);
console.log('kilosNonMonotonic:', auditResults.kilosNonMonotonic.length);
if (auditResults.kilosNonMonotonic.length > 0) console.log(auditResults.kilosNonMonotonic);
console.log('kilosGeometryAnomalies (shorter than straight):', auditResults.kilosGeometryAnomalies.length);
if (auditResults.kilosGeometryAnomalies.length > 0) console.log(auditResults.kilosGeometryAnomalies);
