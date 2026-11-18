const fs = require('fs');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(trackCode);

const t1 = window.JR_TRACKS['uetsu-niigata'][0];
const t2 = window.JR_TRACKS['uetsu-north'][0];

console.log('uetsu-niigata points:', t1.length, 'start:', t1[0], 'end:', t1[t1.length - 1]);
console.log('uetsu-north points:', t2.length, 'start:', t2[0], 'end:', t2[t2.length - 1]);
