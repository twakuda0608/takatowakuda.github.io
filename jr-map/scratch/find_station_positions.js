const fs = require('fs');
const code = fs.readFileSync('./jr-map/data/build-data.js', 'utf8');
for (const id of ['oimachi', 'omori', 'kamata', 'tsurumi', 'shin-koyasu', 'higashi-kanagawa', 'higashi-totsuka', 'st-afn49v']) {
  const target = `"${id}": {`;
  const idx = code.indexOf(target);
  console.log(id, 'idx:', idx);
}
