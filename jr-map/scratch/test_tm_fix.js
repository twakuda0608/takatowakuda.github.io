const fs = require('fs');
const { JR_TRACKS } = require('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/test_tm.js');
const tm0 = JR_TRACKS['tohoku-main'][0];
const kt0 = JR_TRACKS['keihin-tohoku'][0];

const tokyoToAkabane = tm0.slice(0, 68);
const akabaneToOmiya = kt0.slice(0, 63).reverse();
const omiyaNorth = tm0.slice(640);

const fullTohoku = [...tokyoToAkabane, ...akabaneToOmiya, ...omiyaNorth];
console.log('Full tohoku points:', fullTohoku.length);
console.log('Start:', fullTohoku[0], 'End:', fullTohoku[fullTohoku.length - 1]);

function dist(p1, p2) {
  const R = 6371;
  const dLat = (p2[0]-p1[0])*Math.PI/180;
  const dLng = (p2[1]-p1[1])*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(p1[0]*Math.PI/180)*Math.cos(p2[0]*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

let maxD = 0;
let maxIdx = -1;
for (let i = 0; i < fullTohoku.length - 1; i++) {
  const d = dist(fullTohoku[i], fullTohoku[i+1]);
  if (d > maxD) { maxD = d; maxIdx = i; }
  if (d > 5) {
    console.log(`Jump at ${i}: d=${d.toFixed(2)}km from ${fullTohoku[i]} to ${fullTohoku[i+1]}`);
  }
}
console.log(`Max jump in tohoku-main: ${maxD.toFixed(2)}km at index ${maxIdx}`);
