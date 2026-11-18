const fs = require('fs');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);

const stations = window.JR_STATIONS;

const oitoStations = [
  'itoigawa', 'st-ft5e', 'st-jkgza5', 'st-z787s1', 'st-011n2t', 'st-8k50', 'st-cmk4f', 'st-drwy',
  'st-cnvkv', 'st-en16', 'st-b2oovk', 'st-s5a7', 'hakuba', 'st-51b63t', 'st-r986', 'st-r8x8',
  'st-q97k', 'st-q8r2', 'st-q77q', 'st-8j3v', 'st-e11r1c', 'shinano-omachi', 'st-8iqe',
  'st-d9v8', 'st-g79j', 'st-f7z0', 'st-f6h0', 'st-f50q', 'st-f421', 'st-f3bb', 'st-f24b',
  'st-365g96', 'st-2216k3', 'st-f03j', 'st-1t90w4', 'st-0t78i4', 'st-f9p5e', 'st-f80e0',
  'st-g9cf', 'st-coath', 'matsumoto'
];

console.log('Total stations:', oitoStations.length);
oitoStations.forEach((id, idx) => {
  const s = stations[id];
  console.log(`${idx + 1}. [${id}]: ${s ? s.name : 'MISSING'}`);
});
