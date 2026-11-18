const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const STATIONS = window.JR_STATIONS;
const TRACKS = window.JR_TRACKS;

const ogaki = STATIONS['st-fn8c'];
const tarui = STATIONS['st-fbdf'];
const arao = STATIONS['st-mucs-1'];

console.log('Searching all lines for tracks connecting Ogaki/Arao and Tarui...');

for (const lid in TRACKS) {
  const chains = TRACKS[lid];
  chains.forEach((ch, cidx) => {
    const pts = ch.map(p => p[0] > 90 ? [p[1], p[0]] : p);
    let minDO = Infinity, minDT = Infinity, minDA = Infinity;
    pts.forEach(p => {
      const dO = Math.hypot(p[0] - ogaki.lat, p[1] - ogaki.lng);
      const dT = Math.hypot(p[0] - tarui.lat, p[1] - tarui.lng);
      const dA = Math.hypot(p[0] - arao.lat, p[1] - arao.lng);
      if (dO < minDO) minDO = dO;
      if (dT < minDT) minDT = dT;
      if (dA < minDA) minDA = dA;
    });
    if (minDT < 0.01) {
      console.log(`Line ${lid}, Chain ${cidx}: points=${pts.length}, distToTarui=${(minDT*111).toFixed(2)}km, distToOgaki=${(minDO*111).toFixed(2)}km, distToArao=${(minDA*111).toFixed(2)}km`);
    }
  });
}
