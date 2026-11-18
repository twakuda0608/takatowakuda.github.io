const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/.system_generated/logs/transcript_full.jsonl')
});

rl.on('line', (line) => {
  if (!line) return;
  if (line.includes('"step_index": 1029') || line.includes('"step_index":1029')) {
    const obj = JSON.parse(line);
    const tc = obj.tool_calls[0];
    console.log('TARGET LENGTH:', tc.args.Target.length);
    console.log('REPLACEMENT LENGTH:', tc.args.Replacement.length);
    console.log('TARGET FIRST 200:');
    console.log(tc.args.Target.slice(0, 200));
    console.log('TARGET LAST 200:');
    console.log(tc.args.Target.slice(-200));
    console.log('REPLACEMENT LAST 200:');
    console.log(tc.args.Replacement.slice(-200));
  }
});
