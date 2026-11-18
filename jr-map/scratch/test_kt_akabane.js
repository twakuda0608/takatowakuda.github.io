const fs = require('fs');
const { JR_TRACKS } = require('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/test_tm.js');
const kt0 = JR_TRACKS['keihin-tohoku'][0];

function dist(p1, p2) {
  const R = 6371;
  const dLat = (p2[0]-p1[0])*Math.PI/180;
  const dLng = (p2[1]-p1[1])*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(p1[0]*Math.PI/180)*Math.cos(p2[0]*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

// Akabane is around 35.7777, 139.7210
let minD = 999;
let akabaneIdx = -1;
for (let i = 0; i < kt0.length; i++) {
  const d = dist(kt0[i], [35.7777, 139.7210]);
  if (d < minD) { minD = d; akabaneIdx = i; }
}
console.log('Akabane in KT:', akabaneIdx, kt0[akabaneIdx], 'dist=', minD.toFixed(3));
console.log('KT[0] (Omiya):', kt0[0]);
console.log('Distance from Akabane to Omiya in KT points:', akabaneIdx + 1);
