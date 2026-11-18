const fs = require('fs');

const content = fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/official-kilos-updated.js', 'utf8');

global.window = {};
require('../data/build-data.js');
const { JR_LINES, JR_STATIONS } = window;

const sandbox = { window: {}, console, module: { exports: {} } };
const vm = require('vm');
vm.createContext(sandbox);
vm.runInContext(content, sandbox);

const OFFICIAL_STATION_KILOS = sandbox.module.exports.OFFICIAL_STATION_KILOS;

require('../data/tracks.js');
const JR_TRACKS = window.JR_TRACKS;

JR_TRACKS['hokkaido-hakodate-sawara'] = [JR_TRACKS['hokkaido-hakodate'][1]];
JR_TRACKS['hokkaido-chitose-airport'] = [JR_TRACKS['hokkaido-chitose'][1]];
JR_TRACKS['hokkaido-muroran-branch'] = [JR_TRACKS['hokkaido-muroran'][1]];
JR_TRACKS['sanyo-wadamisaki'] = [JR_TRACKS['sanyo-main'][1]];
JR_TRACKS['sanin-senzaki'] = [JR_TRACKS['sanin-main'][1]];
JR_TRACKS['shikoku-uchiko'] = [JR_TRACKS['shikoku-yosan'][2]];
JR_TRACKS['shikoku-yosan-new'] = [JR_TRACKS['shikoku-yosan'][2]];
JR_TRACKS['kyushu-nagasaki-nagayo'] = [JR_TRACKS['kyushu-nagasaki'][1]];

const tokyoToAkabane = JR_TRACKS['tohoku-main'][0].slice(0, 68);
const akabaneToOmiya = JR_TRACKS['keihin-tohoku'][0].slice(1, 134).reverse();
const omiyaNorth = JR_TRACKS['tohoku-main'][0].slice(640);
JR_TRACKS['tohoku-main'] = [
  [...tokyoToAkabane, ...akabaneToOmiya, ...omiyaNorth],
  JR_TRACKS['tohoku-main'][0].slice(68, 317)
];

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
  chains = chains.filter(c => c.length > 5);
  chains = chains.map(chain => {
    const clean = [];
    for (let i = 0; i < chain.length; i++) {
      if (i > 0 && i < chain.length - 1) {
        const pPrev = chain[i - 1];
        const pCurr = chain[i];
        const pNext = chain[i + 1];
        const dOut = calcDistKm(pPrev[0], pPrev[1], pCurr[0], pCurr[1]);
        const dChord = calcDistKm(pPrev[0], pPrev[1], pNext[0], pNext[1]);
        if (dChord < 0.05 && dOut > 0.5) continue;
      }
      clean.push(chain[i]);
    }
    return clean;
  });
  JR_TRACKS[lineId] = chains;
}

const auditResults = {
  tracksShortOrDuplicateChains: [],
  tracksMissingLines: [],
  tracksJumps: [],
  kilosNonMonotonic: [],
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
    if (k1 !== undefined && k2 !== undefined) {
      const rawDiff = k2 - k1;
      const currentDir = rawDiff > 0 ? 1 : -1;
      if (rawDiff === 0) {
        auditResults.kilosNonMonotonic.push({ type: 'ZERO_DIFF', lineId: line.id, s1: s1.name, s2: s2.name });
      } else if (dir === 0) {
        dir = currentDir;
      } else if (dir !== currentDir) {
        auditResults.kilosNonMonotonic.push({ type: 'REVERSED', lineId: line.id, s1: s1.name, s2: s2.name, k1, k2 });
      }
    }
  }
});

console.log('--- FINAL AUDIT VERIFICATION ---');
console.log('tracksMissingLines:', auditResults.tracksMissingLines.length);
console.log('tracksShortOrDuplicateChains:', auditResults.tracksShortOrDuplicateChains.length);
console.log('tracksJumps (boomerangs):', auditResults.tracksJumps.length);
console.log('kilosNonMonotonic:', auditResults.kilosNonMonotonic.length);
