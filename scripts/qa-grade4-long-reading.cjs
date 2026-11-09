const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const live = process.argv.includes('--live');
const dist = path.resolve(__dirname, '../dist');
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = path.resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(dist + path.sep)) return response.writeHead(403).end();
    const types = {'.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json'};
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    response.end(await fs.readFile(file));
  } catch {
    response.writeHead(404).end();
  }
});

async function main() {
  if (!live) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = live ? 'https://yggdrasilw-spec.github.io/english-stage/' : `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({channel:'msedge', headless:true});
  try {
    const page = await browser.newPage({viewport:{width:320,height:720}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '?long-reading-qa=' + Date.now());
    await page.locator('[data-course="4"]').click();
    await page.getByRole('heading',{name:'長めの文章に挑戦'}).waitFor();
    const readState = () => page.evaluate(async () => (await import('./src/storage.js')).read());
    const sets = ['notice', 'email', 'description'];
    for (const kind of sets) {
      const id = 'g4-reading-' + kind;
      await page.locator(`[data-g4-reading="${id}"]`).click();
      for (let index = 0; index < 4; index++) {
        const questionId = `${id}-${index + 1}`;
        await page.locator(`[data-long-question="${questionId}"]`).waitFor();
        assert.equal(await page.locator('.g4-passage p').count(), 3);
        assert.equal(await page.locator('.g4-evidence-picker').count(), 0);
        assert.equal(await page.getByText('本文と日本語訳').count(), 0);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        if (kind === 'notice' && index === 1) {
          await page.locator('#g4-long-hint').click();
          await page.getByText('ここからは支援ありの解答として記録します。',{exact:false}).waitFor();
        }
        const selected = kind === 'notice' && index === 1 ? 1 : 0;
        await page.locator(`[data-long-choice="${selected}"]`).click();
        await page.locator('#g4-long-next').waitFor();
        assert.equal(await page.getByText('根拠の段落を見る').count(), 0);
        if (kind === 'notice' && index === 0) {
          const before = (await readState()).grade4.session;
          await page.goto(base + '#home');
          await page.locator('#g4-start').click();
          await page.locator('#g4-long-next').waitFor();
          await page.reload();
          await page.locator('#g4-long-next').waitFor();
          assert.deepEqual((await readState()).grade4.session, before);
          assert.equal((await readState()).forest.total, 1);
        }
        await page.locator('#g4-long-next').click();
      }
      await page.getByRole('heading',{name:'読んだ答えを確かめよう'}).waitFor();
      assert.equal(await page.getByText('根拠の段落を見る').count(), 4);
      await page.getByText('本文と日本語訳').click();
      assert.equal(await page.locator('.g4-translation[open] p').count(), 6);
      await page.getByRole('link',{name:'4級のホームへ →'}).click();
    }
    const saved = await readState();
    assert.equal(saved.grade4.attempts.length, 12);
    assert.equal(saved.grade4.attempts.filter(attempt => attempt.guided).length, 3);
    assert.equal(saved.forest.total, 12);
    assert.deepEqual(saved.progress, {});
    await page.locator('[data-unit="past-be"]').click();
    await page.locator('[data-g4-question="g4-past-be-a-vocab-1"]').waitFor();
    assert.equal((await readState()).grade4.session.queue.length, 7);
    assert.deepEqual(errors, []);
    console.log(`PASS ${live ? 'LIVE' : 'LOCAL'} 12 longer reading questions; resume, hidden feedback, help, forest, short-unit entry, 320px`);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
