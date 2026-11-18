const fs = require('fs');
const lines = fs.readFileSync('jr-map/data/build-data.js', 'utf8').split('\n');

const ids = [
  'tokaido',
  'sagami',
  'ito-line',
  'tsurumi-line',
  'osaka-loop',
  'hakataminami-line',
  'hokkaido-soya',
  'kyushu-nippo',
  'kyushu-kyudai'
];

ids.forEach(id => {
  lines.forEach((l, i) => {
    if (l.includes('"id": "' + id + '"')) {
      console.log(`${id}: line ${i + 1}`);
    }
  });
});
