const fs = require('fs');
const content = fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/official_kilos_compact.js', 'utf8');
const lines = content.split('\n');
const chunkSize = 35;

let chunkIdx = 0;
for (let i = 0; i < lines.length; i += chunkSize) {
  const chunkLines = lines.slice(i, i + chunkSize);
  const text = chunkLines.join('\n') + (i + chunkSize < lines.length ? '\n' : '');
  fs.writeFileSync(`C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/chunk_${chunkIdx}.txt`, text, 'utf8');
  console.log(`Chunk ${chunkIdx}: lines ${i}..${Math.min(i + chunkSize, lines.length)}, ${Buffer.byteLength(text, 'utf8')} bytes`);
  chunkIdx++;
}
