const fs = require('fs');
const { JR_TRACKS } = require('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/test_tm.js');
const tm0 = JR_TRACKS['tohoku-main'][0];

function dist(p1, p2) {
  const R = 6371;
  const dLat = (p2[0]-p1[0])*Math.PI/180;
  const dLng = (p2[1]-p1[1])*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(p1[0]*Math.PI/180)*Math.cos(p2[0]*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

let minD = 999;
let omiyaIdx = -1;
for (let i = 0; i < tm0.length; i++) {
  const d = dist(tm0[i], [35.9063, 139.6240]);
  if (d < minD) { minD = d; omiyaIdx = i; }
}
console.log('Omiya in TM:', omiyaIdx, tm0[omiyaIdx], 'dist=', minD.toFixed(3));
