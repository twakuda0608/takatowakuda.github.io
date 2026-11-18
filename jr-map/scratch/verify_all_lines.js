const fs = require('fs');
const vm = require('vm');
const buildData = require('../data/build-data.js');

const code = fs.readFileSync('jr-map/data/official-kilos.js', 'utf8');
const ctx = { module: { exports: {} }, exports: {} };
vm.createContext(ctx);
vm.runInContext(code, ctx);
const OFFICIAL = ctx.module.exports.OFFICIAL_STATION_KILOS;

let errorCount = 0;
for (const line of buildData.JR_LINES) {
  const lineKilos = OFFICIAL[line.id];
  if (!lineKilos) {
    console.log(`[MISSING_LINE] ${line.id}`);
    errorCount++;
    continue;
  }
  const stList = line.stations;
  let prevKilo = -1;
  let prevName = null;
  let isAscending = null;

  for (let i = 0; i < stList.length; i++) {
    const stId = stList[i];
    const stObj = buildData.JR_STATIONS[stId];
    const name = stObj ? stObj.name : stId;
    const kilo = lineKilos[stId] ?? lineKilos[name];

    if (kilo === undefined) {
      console.log(`[MISSING_STATION] Line ${line.id} Station ${name} (${stId})`);
      errorCount++;
      continue;
    }

    if (prevKilo !== -1) {
      if (isAscending === null) {
        if (kilo > prevKilo) isAscending = true;
        else if (kilo < prevKilo) isAscending = false;
        else {
          console.log(`[DUPLICATE_KILO] Line ${line.id} Station ${prevName} and ${name} have same kilo ${kilo}`);
          errorCount++;
        }
      } else if (isAscending && kilo <= prevKilo) {
        console.log(`[NON_MONOTONIC_ASC] Line ${line.id} Station ${prevName} (${prevKilo}) -> ${name} (${kilo})`);
        errorCount++;
      } else if (!isAscending && kilo >= prevKilo) {
        console.log(`[NON_MONOTONIC_DESC] Line ${line.id} Station ${prevName} (${prevKilo}) -> ${name} (${kilo})`);
        errorCount++;
      }
    }
    prevKilo = kilo;
    prevName = name;
  }
}
console.log(`Total line verification errors in official-kilos.js: ${errorCount}`);
