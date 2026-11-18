const { JR_TRACKS } = require('../data/tracks.js');
const { JR_STATIONS } = require('../data/build-data.js');

const c0 = JR_TRACKS['narita-line'][0];
const sakura = JR_STATIONS['sakura'];
const shisui = JR_STATIONS['st-livb6'];
const narita = JR_STATIONS['narita'];

function getClosest(pt, chain) {
  let minD = Infinity, minI = -1;
  chain.forEach((p, i) => {
    const d = Math.hypot(p[0] - pt.lat, p[1] - pt.lng) * 111000;
    if (d < minD) { minD = d; minI = i; }
  });
  return { dist: Math.round(minD), idx: minI, pt: chain[minI] };
}

console.log('Chain 0 around index 460:');
console.log('450:', c0[450]);
console.log('455:', c0[455]);
console.log('460:', c0[460]);
console.log('465:', c0[465]);
console.log('470:', c0[470]);

// Let's trace where chain 0 goes
console.log('Length of chain 0:', c0.length);
console.log('Start (0):', c0[0], 'End:', c0[c0.length - 1]);
const sm0 = JR_TRACKS['sobu-main'][0];
console.log('Closest to Sakura in sobu-main chain 0:');
console.log(getClosest(sakura, sm0));


