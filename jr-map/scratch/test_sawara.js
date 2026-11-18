const fs = require('fs');
const JR_TRACKS = global.window = {};
require('./jr-map/data/tracks.js');
const tracks = window.JR_TRACKS;
const sawara = tracks['hokkaido-hakodate-sawara'];
console.log('Sawara chains count:', sawara ? sawara.length : 'none');
if (sawara) {
  sawara.forEach((c, i) => {
    console.log(`Chain ${i}: len=${c.length}, start=${c[0]}, end=${c[c.length-1]}`);
  });
}
