const fs = require('fs');
const { JR_LINES, JR_STATIONS } = require('../data/build-data.js');
const { JR_TRACKS } = require('../data/tracks.js');

// Deep clone JR_TRACKS for testing
const tracks = JSON.parse(JSON.stringify(JR_TRACKS));

// 1. Uchiko Line track coordinates
const uchikoToNiiya = [
  [33.54948, 132.64626], // Uchiko
  [33.54873, 132.64618],
  [33.54805, 132.64585],
  [33.54695, 132.64515],
  [33.54575, 132.64430],
  [33.54445, 132.64335],
  [33.54320, 132.64230],
  [33.54190, 132.64105],
  [33.54070, 132.63975],
  [33.53955, 132.63820],
  [33.53860, 132.63690],
  [33.53808, 132.63636], // Ikazaki
  [33.53730, 132.63510],
  [33.53660, 132.63380],
  [33.53585, 132.63190],
  [33.53520, 132.62980],
  [33.53465, 132.62730],
  [33.53420, 132.62470],
  [33.53385, 132.62210],
  [33.53360, 132.61920],
  [33.53345, 132.61630],
  [33.53338, 132.61380],
  [33.53343, 132.61144], // Kitayama
  [33.53340, 132.60950],
  [33.53350, 132.60740],
  [33.53365, 132.60510],
  [33.53380, 132.60300],
  [33.53395, 132.60110],
  [33.53408, 132.59970],
  [33.53416, 132.59853]  // Niiya
];

// Set shikoku-uchiko
tracks['shikoku-uchiko'] = [ uchikoToNiiya ];

// Set shikoku-yosan-new
const yosan0 = tracks['shikoku-yosan'][0];
const yosan1 = tracks['shikoku-yosan'][1];
const yosanNewTrack = [
  ...yosan0.slice(2496),
  ...uchikoToNiiya,
  ...yosan1.slice(731, 824).reverse()
];
tracks['shikoku-yosan-new'] = [ yosanNewTrack ];

// Also in shikoku-yosan, add uchikoToNiiya to chains so Yosan line renders smoothly
tracks['shikoku-yosan'] = [
  yosan0,
  uchikoToNiiya,
  ...tracks['shikoku-yosan'].slice(1)
];

// 2. hokkaido-hakodate-sawara
const hakodate0 = tracks['hokkaido-hakodate'][0];
const sawaraBranch = [
  [42.10888, 140.57403], // Mori station
  ...hakodate0.slice(0, 481),
  [41.97202, 140.66937]  // Onuma station
];
tracks['hokkaido-hakodate-sawara'] = [ sawaraBranch ];

// 3. hokkaido-muroran-branch
const muroran2 = tracks['hokkaido-muroran'][2];
const muroranBranch = [
  [42.31783, 140.97617], // Muroran
  ...muroran2,
  [42.34929, 141.02621]  // Higashi-Muroran
];
tracks['hokkaido-muroran-branch'] = [ muroranBranch ];

// 4. sanyo-wadamisaki
const sanyo12 = tracks['sanyo-main'][12];
const wadamisakiBranch = [
  [34.6575, 135.17376],  // Wadamisaki
  ...sanyo12,
  [34.66783, 135.16449]  // Hyogo
];
tracks['sanyo-wadamisaki'] = [ wadamisakiBranch ];

// 5. sanin-senzaki
const sanin0 = tracks['sanin-main'][0];
const senzakiBranch = [
  [34.37538, 131.18559], // Nagatoshi
  ...sanin0.slice(10051, 10072),
  [34.38778, 131.19902]  // Senzaki
];
tracks['sanin-senzaki'] = [ senzakiBranch ];

// 6. kyushu-nagasaki-nagayo
const nagasaki1 = tracks['kyushu-nagasaki'][1];
const nagasaki2 = tracks['kyushu-nagasaki'][2];
const nagayoBranch = [
  [32.76545, 129.86328], // Urakami
  ...nagasaki2.slice(14, 31),
  ...nagasaki1,
  [32.8327, 129.98649]   // Kikitsu
];
tracks['kyushu-nagasaki-nagayo'] = [ nagayoBranch ];

// 7. hokkaido-chitose-airport
const chitose1 = tracks['hokkaido-chitose'][1];
const airportBranch = [
  [42.78754, 141.68079], // New Chitose Airport
  ...chitose1.slice(0, 44),
  [42.80821, 141.67521]  // Minami-Chitose
];
tracks['hokkaido-chitose-airport'] = [ airportBranch ];

// 8. tohoku-main Saikyo and Rifu branches
const saikyo0 = tracks['saikyo'][0];
const saikyoBranch = saikyo0.slice(67, 154);
const rifuBranch = [
  [38.30058, 140.95475], // Iwakiri
  [38.30500, 140.95850],
  [38.31000, 140.96350],
  [38.31500, 140.96900],
  [38.32000, 140.97450],
  [38.32422, 140.97893], // Shin-Rifu
  [38.32680, 140.98180],
  [38.32935, 140.9848]   // Rifu
];
tracks['tohoku-main'].push(saikyoBranch);
tracks['tohoku-main'].push(rifuBranch);
// Prepend Tokyo to tohoku-main
tracks['tohoku-main'][0].unshift([35.68093, 139.76667]);

// 9. Junction / terminal station extensions
function prependPoint(lineId, chainIdx, pt) {
  if (tracks[lineId] && tracks[lineId][chainIdx]) {
    tracks[lineId][chainIdx].unshift(pt);
  }
}
function appendPoint(lineId, chainIdx, pt) {
  if (tracks[lineId] && tracks[lineId][chainIdx]) {
    tracks[lineId][chainIdx].push(pt);
  }
}

// banetsu-west: Aizu-Wakamatsu switchback into chain 0
tracks['banetsu-west'][0].splice(338, 0,
  [37.51200, 139.93080],
  [37.50895, 139.93017], // Aizu-Wakamatsu
  [37.51200, 139.93080]
);

// narita-line: Sakura station & Abiko
prependPoint('narita-line', 0, [35.70974, 140.22676]); // Sakura
prependPoint('narita-line', 0, [35.87287, 140.01046]); // Abiko
prependPoint('narita-line', 1, [35.87287, 140.01046]); // Abiko

// hokkaido-sekihoku: Engaru station switchback into chain 0
tracks['hokkaido-sekihoku'][0].splice(1165, 0,
  [44.05850, 143.51950],
  [44.06028, 143.52068], // Engaru
  [44.05850, 143.51950]
);

// keiyo: Tokyo station
prependPoint('keiyo', 0, [35.68093, 139.76667]);

// Shinkansen to Tokyo
['shinkansen-tohoku', 'shinkansen-joetsu', 'shinkansen-hokuriku', 'shinkansen-yamagata', 'shinkansen-akita'].forEach(id => {
  prependPoint(id, 0, [35.68093, 139.76667]);
});

// sobu-main to Tokyo
prependPoint('sobu-main', 0, [35.68093, 139.76667]);

// nikko-line: Utsunomiya
prependPoint('nikko-line', 0, [36.55944, 139.89865]);

// shinetsu-takasaki: Takasaki
prependPoint('shinetsu-takasaki', 0, [36.32245, 139.01232]);

// joetsu-line: Takasaki
prependPoint('joetsu-line', 0, [36.32245, 139.01232]);

// shinkansen-tokaido: Shin-Osaka
appendPoint('shinkansen-tokaido', 0, [34.73348, 135.5001]);

// shinkansen-sanyo: Hakata
appendPoint('shinkansen-sanyo', 0, [33.59006, 130.42065]);

// shinkansen-joetsu: Niigata
appendPoint('shinkansen-joetsu', 0, [37.91219, 139.06173]);

// shinkansen-kyushu: Kagoshima-Chuo
appendPoint('shinkansen-kyushu', 0, [31.58392, 130.54139]);

// yonesaka-line: Yonezawa
prependPoint('yonesaka-line', 0, [37.91206, 140.12878]);

// agatsuma-line: Shibukawa
prependPoint('agatsuma-line', 0, [36.49132, 139.00684]);

// togane-line: Naruto
appendPoint('togane-line', 0, [35.60853, 140.41028]);

// hachiko-line: Kuragano
appendPoint('hachiko-line', 0, [36.30058, 139.04944]);

// kamaishi-line: Hanamaki
prependPoint('kamaishi-line', 0, [39.39343, 141.11294]);

// rikuusai-line: Shinjo
prependPoint('rikuusai-line', 0, [38.76252, 140.30612]);

// uetsu-main: Niitsu
prependPoint('uetsu-main', 0, [37.8003, 139.12121]);

// yahiko-line: Higashi-Sanjo
appendPoint('yahiko-line', 0, [37.62854, 138.97475]);

// tokaido: Tamachi & Tokyo
tracks['tokaido'][0].splice(26, 0, [35.64575, 139.7476]); // Tamachi
prependPoint('tokaido', 0, [35.68093, 139.76667]);

// yamanote: Shinagawa
prependPoint('yamanote', 0, [35.62863, 139.73849]);

// tokai-tokaido: Mikawa-Anjo
tracks['tokai-tokaido'][4].splice(98, 0, [34.96935, 137.05999]);

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
      if (d2 < minDistSq) minDistSq = d2;
    }
  }
  return Math.sqrt(minDistSq);
}

const disconnected = [];
JR_LINES.forEach(line => {
  const chains = tracks[line.id] || [];
  const stationIdSet = new Set(line.stations);
  if (line.branches) {
    line.branches.forEach(branch => branch.forEach(id => stationIdSet.add(id)));
  }

  for (const stId of stationIdSet) {
    const st = JR_STATIONS[stId];
    if (!st) {
      disconnected.push({ lineId: line.id, lineName: line.name, stId, distMeters: Infinity });
      continue;
    }
    const distM = minDistanceToPolylineMeters(st.lat, st.lng, chains);
    if (distM >= 150) {
      disconnected.push({
        lineId: line.id,
        lineName: line.name,
        stId: st.id,
        stName: st.name,
        distMeters: Math.round(distM)
      });
    }
  }
});

console.log('=== TEST PROXIMITY AUDIT RESULT ===');
console.log('Remaining disconnected stations (>= 150m):', disconnected.length);
disconnected.forEach(d => console.log(`[${d.lineId}] ${d.lineName}: ${d.stName} (${d.stId}) - ${d.distMeters}m`));
