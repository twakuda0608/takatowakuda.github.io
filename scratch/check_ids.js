const fs = require('fs');
const html = fs.readFileSync('jr-map/index.html', 'utf8');
const js = fs.readFileSync('jr-map/app.js', 'utf8');

const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let m;
const idsInJs = new Set();
while ((m = idRegex.exec(js)) !== null) {
  idsInJs.add(m[1]);
}

console.log('Total getElementById in app.js:', idsInJs.size);
const missing = [];
idsInJs.forEach(id => {
  if (!html.includes('id="' + id + '"') && !html.includes("id='" + id + "'")) {
    missing.push(id);
  }
});
console.log('Missing IDs in index.html:', missing);
