const fs = require('fs');
const content = fs.readFileSync('jr-map/data/official-kilos.js', 'utf8');

console.log('shinkansen-sanyo pos:', content.indexOf('"shinkansen-sanyo"'));
console.log('tokaido-west pos:', content.indexOf('"tokaido-west"'));
console.log('sanyo-main pos:', content.indexOf('"sanyo-main"'));
console.log('sanin-main pos:', content.indexOf('"sanin-main"'));
console.log('shikoku-yosan pos:', content.indexOf('"shikoku-yosan"'));
