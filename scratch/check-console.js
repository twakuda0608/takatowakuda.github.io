const { exec } = require('child_process');

// Chrome headless で console.log や console.error を取得
// Node から CDP (Chrome DevTools Protocol) か puppeteer を使うか、
// Chrome に remote debugging port を付けて接続する。

const http = require('http');

async function testPage() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const cmd = `"${chromePath}" --headless --remote-debugging-port=9222 "file:///C:/takatowakuda.github.io/jr-map/index.html"`;

  const child = exec(cmd);
  
  // 少し待ってから http://localhost:9222/json を取得
  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const list = await listRes.json();
    console.log('Pages:', list);
    const page = list.find(p => p.type === 'page');
    if (!page) {
      console.log('No page found');
      child.kill();
      return;
    }

    const WebSocket = require('ws'); // ws がなければ標準 fetch で
  } catch (e) {
    console.error('Error fetching pages:', e.message);
  } finally {
    child.kill();
  }
}

testPage();
