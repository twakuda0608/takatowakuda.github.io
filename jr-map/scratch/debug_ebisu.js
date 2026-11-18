const { JR_STATIONS } = require('../data/build-data.js');
const { JR_TRACKS } = require('../data/tracks.js');

const ebisu = JR_STATIONS['ebisu'];
console.log('Ebisu station:', ebisu);
const y = JR_TRACKS['yamanote'][0];
console.log('Yamanote points count:', y.length);

const dists = y.map((pt, idx) => {
  const d = Math.hypot(
    (pt[0] - ebisu.lat) * 111132,
    (pt[1] - ebisu.lng) * 111412 * Math.cos(ebisu.lat * Math.PI / 180)
  );
  return { idx, pt, d };
});

dists.sort((a, b) => a.d - b.d);
console.log('Closest 5 points to Ebisu:', dists.slice(0, 5));
