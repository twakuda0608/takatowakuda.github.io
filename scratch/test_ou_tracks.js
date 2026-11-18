const fs = require('fs');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);
eval(trackCode);

const fukushima = window.JR_STATIONS['fukushima'];
const aomori = window.JR_STATIONS['aomori'];
const sTrack = window.JR_TRACKS['ou-main-south'][0];
const nTrack = window.JR_TRACKS['ou-main-north'][0];

console.log('Fukushima:', fukushima.lat, fukushima.lng);
console.log('Aomori:   ', aomori.lat, aomori.lng);
console.log('ou-main-south start:', sTrack[0], 'dist:', Math.hypot(sTrack[0][0] - fukushima.lat, sTrack[0][1] - fukushima.lng));
console.log('ou-main-south end:  ', sTrack[sTrack.length-1], 'dist:', Math.hypot(sTrack[sTrack.length-1][0] - aomori.lat, sTrack[sTrack.length-1][1] - aomori.lng));

console.log('ou-main-north start:', nTrack[0], 'dist:', Math.hypot(nTrack[0][0] - fukushima.lat, nTrack[0][1] - fukushima.lng));
console.log('ou-main-north end:  ', nTrack[nTrack.length-1], 'dist:', Math.hypot(nTrack[nTrack.length-1][0] - aomori.lat, nTrack[nTrack.length-1][1] - aomori.lng));
