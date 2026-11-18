const fs = require('fs');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);

const lines = window.JR_LINES;
console.log('Sample line properties:');
console.log(lines.slice(0, 5).map(l => ({
  id: l.id,
  name: l.name,
  en: l.en,
  description: l.description,
  section: l.section,
  company: l.company
})));

// Check lines without description or en
const missingDesc = lines.filter(l => !l.description);
console.log('Lines missing description:', missingDesc.length);
if (missingDesc.length > 0) {
  console.log('First 5 missing description:', missingDesc.slice(0, 5).map(l => l.id));
}
const missingEn = lines.filter(l => !l.en);
console.log('Lines missing en:', missingEn.length);
if (missingEn.length > 0) {
  console.log('First 5 missing en:', missingEn.slice(0, 5).map(l => l.id));
}
