const fs = require('fs');
const path = require('path');

// 1. Check fare-rules-data.js for WEST_DENSHA_TOKUTEI
const frText = fs.readFileSync(path.join(__dirname, 'data/fare-rules-data.js'), 'utf8');
frText.split('\n').forEach((l, i) => {
  if (l.includes('WEST') && (l.includes('TOKUTEI') || l.includes('KANJO') || l.includes('STATIONS'))) {
    console.log('fare-rules-data.js line', i + 1, l.slice(0, 100));
  }
  if (l.includes('DENSHA_TOKUTEI_STATIONS') || l.includes('OSAKA_KANJO_STATIONS')) {
    console.log('station line', i + 1, l.slice(0, 100));
  }
});

// 2. Check official-kilos.js
const ok = require(path.join(__dirname, 'data/official-kilos.js'));
console.log('official-kilos keys:', Object.keys(ok));
const shKeys = Object.keys(ok.OFFICIAL_LINE_KILOS || {}).filter(k => k.includes('shinkansen'));
console.log('shinkansen lines in OFFICIAL_LINE_KILOS:', shKeys);
shKeys.forEach(k => {
  const l = ok.OFFICIAL_LINE_KILOS[k];
  console.log('Line:', k, 'has stationKilos:', !!l.stationKilos, 'has edgeDistances:', !!l.edgeDistances);
  if (l.stationKilos) {
    const keys = Object.keys(l.stationKilos);
    console.log('   stationKilos key samples:', keys.slice(0, 5));
  }
});

// 3. Check app.js functions
const appText = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
appText.split('\n').forEach((l, i) => {
  if (l.includes('calcDirectShinkansenDistance') || l.includes('calcShinkansenDistance') || l.includes('getRelevantShinkansenPairs') || l.includes('addShinkansenSegment')) {
    console.log('app.js:', i + 1, l);
  }
});
