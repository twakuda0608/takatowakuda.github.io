const fs = require('fs');
const vm = require('vm');

const sandbox = { window: {}, console, require, module: { exports: {} } };
vm.createContext(sandbox);

// 1. build-data.js
vm.runInContext(fs.readFileSync('jr-map/data/build-data.js', 'utf8'), sandbox);

// 2. official-kilos.js
vm.runInContext(fs.readFileSync('jr-map/data/official-kilos.js', 'utf8'), sandbox);

const JR_LINES = sandbox.window.JR_LINES;
const JR_STATIONS = sandbox.window.JR_STATIONS;
const registeredKilos = sandbox.window.JR_OFFICIAL_KILOS || sandbox.module.exports.OFFICIAL_STATION_KILOS;

console.log('Total JR_LINES in build-data.js:', JR_LINES.length);
console.log('Total lines currently registered in official-kilos.js:', Object.keys(registeredKilos).length);

const unregistered = [];
JR_LINES.forEach(line => {
  if (!registeredKilos[line.id]) {
    unregistered.push({
      id: line.id,
      name: line.name,
      category: line.category,
      stationsCount: line.stations ? line.stations.length : 0
    });
  }
});

console.log('Unregistered lines count:', unregistered.length);
console.log(JSON.stringify(unregistered, null, 2));

// カテゴリ別集計
const catMap = {};
unregistered.forEach(l => {
  catMap[l.category] = (catMap[l.category] || 0) + 1;
});
console.log('Unregistered by category:', catMap);
