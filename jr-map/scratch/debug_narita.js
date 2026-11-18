const { JR_TRACKS } = require('../data/tracks.js');
const { JR_LINES } = require('../data/build-data.js');

const nlTracks = JR_TRACKS['narita-line'];
console.log('Narita line chain count:', nlTracks.length);
nlTracks.forEach((c, i) => {
  console.log(`Chain ${i}: length ${c.length}, start:`, c[0], 'end:', c[c.length - 1]);
});

const { JR_STATIONS } = require('../data/build-data.js');

const sakura = JR_STATIONS['sakura'];
const narita = JR_STATIONS['narita'];
const shisui = JR_STATIONS['st-livb6'];
console.log('Sakura:', sakura);
console.log('Shisui:', shisui);
console.log('Narita:', narita);

// Check distances to sobu-main
const sm = JR_TRACKS['sobu-main'];
sm.forEach((c, i) => {
  console.log(`sobu-main chain ${i} length ${c.length}`);
});

