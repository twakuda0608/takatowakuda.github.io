const fs = require('fs');

const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(dataCode);
eval(trackCode);

const crTrack = window.JR_TRACKS['chuo-rapid'][0];
const cmTrack = window.JR_TRACKS['chuo-main'][0];
const otsuki = window.JR_STATIONS['otsuki'];

console.log('Otsuki Station:', otsuki);
console.log('chuo-rapid points:', crTrack.length);
console.log('chuo-rapid last 3 points:', crTrack.slice(-3));

console.log('chuo-main points:', cmTrack.length);
console.log('chuo-main first 3 points:', cmTrack.slice(0, 3));
console.log('chuo-main last 3 points:', cmTrack.slice(-3));

// find closest point in cmTrack to Otsuki
let minD = 999999, minIdx = -1;
cmTrack.forEach((pt, idx) => {
  const d = Math.hypot(pt[0] - otsuki.lat, pt[1] - otsuki.lng);
  if (d < minD) {
    minD = d;
    minIdx = idx;
  }
});
console.log(`Closest point in cmTrack to Otsuki: idx ${minIdx}, coord: [${cmTrack[minIdx]}], dist: ${minD}`);

// Also check Takao
const takao = window.JR_STATIONS['takao'];
let minTakaoD = 999999, minTakaoIdx = -1;
cmTrack.forEach((pt, idx) => {
  const d = Math.hypot(pt[0] - takao.lat, pt[1] - takao.lng);
  if (d < minTakaoD) {
    minTakaoD = d;
    minTakaoIdx = idx;
  }
});
console.log(`Closest point in cmTrack to Takao: idx ${minTakaoIdx}, coord: [${cmTrack[minTakaoIdx]}], dist: ${minTakaoD}`);
