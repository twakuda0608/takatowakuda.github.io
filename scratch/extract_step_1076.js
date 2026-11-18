const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/.system_generated/logs/transcript_full.jsonl')
});

rl.on('line', (line) => {
  if (!line) return;
  if (line.includes('"step_index": 1076') || line.includes('"step_index":1076')) {
    const obj = JSON.parse(line);
    const tc = obj.tool_calls[0];
    console.log('Step 1076 Edit path:', tc.args.Path);
    console.log('Target:\n', tc.args.Target);
    console.log('Replacement:\n', tc.args.Replacement);
  }
});
