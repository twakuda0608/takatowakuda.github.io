const fs = require('fs');

// tracks と build-data を読み込む
const tracksContent = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const dataContent = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

// window モック
const window = {};
eval(tracksContent);
eval(dataContent);

const TRACKS = window.JR_TRACKS || {};
const LINES = window.JR_LINES;
const STATIONS = window.JR_STATIONS;

console.log(`Loaded ${LINES.length} lines, ${Object.keys(TRACKS).length} tracks.`);

function cleanLineName(name) {
  return name.replace(/\s*[\(（].*?[\)）]/g, '').trim();
}

function findSmoothOffsetRatio(points, preferredRatio, searchRange = 0.15) {
  const n = points.length;
  if (n < 10) return preferredRatio;

  const centerIdx = Math.floor(n * preferredRatio);
  const delta = Math.floor(n * searchRange);
  const startIdx = Math.max(5, centerIdx - delta);
  const endIdx = Math.min(n - 6, centerIdx + delta);

  let bestIdx = centerIdx;
  let minCurvature = Infinity;

  for (let i = startIdx; i <= endIdx; i++) {
    let maxAngleDiff = 0;
    for (let j = i - 3; j <= i + 3; j++) {
      const p0 = points[j - 1], p1 = points[j], p2 = points[j + 1];
      const a1 = Math.atan2(p1[0] - p0[0], p1[1] - p0[1]) * 180 / Math.PI;
      const a2 = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180 / Math.PI;
      let diff = Math.abs(a2 - a1);
      if (diff > 180) diff = 360 - diff;
      if (diff > maxAngleDiff) maxAngleDiff = diff;
    }
    if (maxAngleDiff < minCurvature) {
      minCurvature = maxAngleDiff;
      bestIdx = i;
    }
  }

  return bestIdx / n;
}

let totalSlots = 0;
let invertedSlots = 0;
let reversedForOrientation = 0;

LINES.forEach(line => {
  const cleanName = cleanLineName(line.name);
  const chains = TRACKS[line.id] || [];
  let mainChain = null;
  if (chains.length > 0) {
    mainChain = chains[0];
    for (let i = 1; i < chains.length; i++) {
      if (chains[i].length > mainChain.length) mainChain = chains[i];
    }
  } else {
    const rawLatlngs = [];
    (line.trackPath || line.stations).forEach(stId => {
      const st = STATIONS[stId];
      if (st) rawLatlngs.push([st.lat, st.lng]);
    });
    mainChain = rawLatlngs;
  }

  if (!mainChain || mainChain.length < 2) return;
  const latlngs = mainChain.map(pt => (pt[0] > 90 ? [pt[1], pt[0]] : pt));

  let rawGuidePts = latlngs;
  if (line.id === 'yamanote') {
    rawGuidePts = latlngs.slice(40, 110);
  } else if (line.id === 'osaka-loop') {
    rawGuidePts = latlngs.slice(80, 240);
  }

  const totalPts = rawGuidePts.length;
  if (totalPts < 2) return;

  const isLongLine = line.category === 'shinkansen' || totalPts >= 100;
  const candidateRatios = isLongLine
    ? [findSmoothOffsetRatio(rawGuidePts, 0.35), findSmoothOffsetRatio(rawGuidePts, 0.68)]
    : [findSmoothOffsetRatio(rawGuidePts, 0.50)];

  const uniqueRatios = [];
  candidateRatios.forEach(r => {
    if (!uniqueRatios.some(u => Math.abs(u - r) < 0.15)) {
      uniqueRatios.push(r);
    }
  });

  uniqueRatios.forEach((ratio, slotIdx) => {
    totalSlots++;
    const centerIdx = Math.floor(totalPts * ratio);
    const halfWindow = Math.min(25, Math.floor(totalPts / 2));
    const startIdx = Math.max(0, centerIdx - halfWindow);
    const endIdx = Math.min(totalPts, centerIdx + halfWindow);
    let slotPts = rawGuidePts.slice(startIdx, endIdx);
    if (slotPts.length < 2) slotPts = rawGuidePts.slice();

    const pStart = slotPts[0];
    const pEnd = slotPts[slotPts.length - 1];
    const dLng = pEnd[1] - pStart[1];
    const dLat = pEnd[0] - pStart[0];

    let shouldReverse = false;
    if (Math.abs(dLng) >= 0.001) {
      if (dLng < 0) shouldReverse = true;
    } else {
      if (dLat < 0) shouldReverse = true;
    }

    if (shouldReverse) {
      reversedForOrientation++;
      slotPts.reverse();
    }

    // 検証：正立化後の向き
    const finalStart = slotPts[0];
    const finalEnd = slotPts[slotPts.length - 1];
    const finalDLng = finalEnd[1] - finalStart[1];
    const finalDLat = finalEnd[0] - finalStart[0];

    // もし西向き（finalDLng < -0.001）、または南北で南向き（Math.abs(finalDLng) < 0.001 かつ finalDLat < 0）なら倒立エラー
    if (finalDLng < -0.001 || (Math.abs(finalDLng) < 0.001 && finalDLat < 0)) {
      invertedSlots++;
      console.error(`Inversion detected: ${line.id} (${cleanName}) slot ${slotIdx}, finalDLng: ${finalDLng}, finalDLat: ${finalDLat}`);
    }
  });
});

console.log(`Verification Complete:
- Total Label Slots: ${totalSlots}
- Reoriented (Reversed) Slots: ${reversedForOrientation}
- Inverted (Upside Down) Slots: ${invertedSlots}`);
