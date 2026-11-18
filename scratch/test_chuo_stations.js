const fs = require('fs');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);

const cr = window.JR_LINES.find(l => l.id === 'chuo-rapid');
const cm = window.JR_LINES.find(l => l.id === 'chuo-main');

console.log('chuo-rapid stations:', cr.stations);
console.log('chuo-main stations:', cm.stations);

// Reverse cm stations to see if it starts from Takao or Shiojiri
console.log('cm stations reversed:', [...cm.stations].reverse());
