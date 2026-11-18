const fs = require('fs');
const lines = fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/.system_generated/logs/transcript.jsonl', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (!l) continue;
  try {
    const obj = JSON.parse(l);
    if (obj.step_index >= 1010 && obj.step_index <= 1054) {
      if (obj.tool_calls && obj.tool_calls.length > 0) {
        console.log(`Step ${obj.step_index}: ${obj.tool_calls[0].name}`);
        if (obj.tool_calls[0].name === 'edit_file') {
          console.log('Path:', obj.tool_calls[0].args.Path);
          fs.writeFileSync(`scratch/step_${obj.step_index}_edit.json`, JSON.stringify(obj.tool_calls[0].args, null, 2));
        }
      }
    }
  } catch (e) {}
}
