const { JR_STATIONS } = require('../data/build-data.js');
const ids = ['oimachi', 'omori', 'kamata', 'tsurumi', 'shin-koyasu', 'higashi-kanagawa', 'higashi-totsuka', 'st-afn49v'];
for (const id of ids) {
  console.log(id, ':', JR_STATIONS[id]);
}
