const fs = require('fs');
const lines = fs.readFileSync('jr-map/app.js', 'utf8').split('\n');
const targetIds = [
  'chuo-rapid', 'chuo-main', 'utsunomiya-line', 'tohoku-main-sendai', 
  'tohoku-main-morioka', 'tohoku-main', 'uetsu-niigata', 'uetsu-north', 
  'ou-main-south', 'ou-main-north', 'oito-west', 'oito-line'
];

lines.forEach((line, idx) => {
  targetIds.forEach(id => {
    if (line.includes(id)) {
      console.log(`Line ${idx + 1} [${id}]: ${line.trim()}`);
    }
  });
});
