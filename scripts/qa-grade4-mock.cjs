const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const dist = path.resolve(__dirname, '../dist');
const live = process.argv.includes('--live');
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = path.resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(dist + path.sep)) return response.writeHead(403).end();
    const types = {'.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css',
      '.json':'application/json', '.mp3':'audio/mpeg'};
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    response.end(await fs.readFile(file));
  } catch {
    response.writeHead(404).end();
  }
});

async function main() {
  const {mockReading, mockListening, listeningPractice} = await import(pathToFileURL(path.join(dist, 'src/grade4-mock.js')));
  const {audioFiles} = await import(pathToFileURL(path.join(dist, 'src/grade4-mock-audio.js')));
  if (!live) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = live ? 'https://yggdrasilw-spec.github.io/english-stage/' : `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({channel:'msedge', headless:true});
  try {
    const page = await browser.newPage({viewport:{width:320,height:720}, acceptDownloads:true});
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install();
    await page.addInitScript(() => {
      const play = HTMLMediaElement.prototype.play;
      window.playedGrade4 = [];
      HTMLMediaElement.prototype.play = function () {
        if (!this.src.includes('/exam-g4-')) return play.call(this);
        const id = this.src.match(/exam-(g4-(?:listen|m1)-\d+)/)[1];
        window.playedGrade4.push(id);
        if (id === 'g4-m1-36' && !sessionStorage.getItem('g4-failed-once')) {
          sessionStorage.setItem('g4-failed-once', '1');
          return Promise.reject(new Error('Simulated audio failure'));
        }
        if (id === 'g4-listen-1' || id === 'g4-m1-36') {
          this.playbackRate = 8;
          return play.call(this);
        }
        setTimeout(() => this.dispatchEvent(new Event('ended')), 100);
        return Promise.resolve();
      };
    });

    await page.goto(base + '?grade4-mock-qa=' + Date.now());
    const readState = () => page.evaluate(async () => (await import('./src/storage.js')).read());
    const choice = index => page.locator(`[data-g4-exam-choice="${index}"]`);
    const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    await page.locator('[data-course="4"]').click();
    await page.getByRole('link',{name:'聞き取りを練習する'}).click();
    for (const [index, q] of listeningPractice.entries()) {
      await page.locator(`[data-g4-dialogue="${q.id}"]`).waitFor();
      assert(await choice(q.answer).isDisabled());
      await page.locator('audio').evaluate(audio => audio.play());
      await choice(q.answer).click();
      await page.getByRole('heading',{name:'正解',exact:true}).waitFor();
      assert(await page.locator('.transcript').isVisible());
      if (index === 0) {
        await page.reload();
        await page.getByRole('heading',{name:'正解',exact:true}).waitFor();
        assert(await fits());
      }
      await page.locator('#g4-dialogue-next').click();
    }
    await page.getByRole('heading',{name:'会話の聞き取り 練習終了'}).waitFor();
    assert.equal((await readState()).forest.total, 6);

    await page.getByRole('link',{name:'4級ホーム'}).click();
    await page.getByRole('link',{name:'模試を開く'}).click();
    await page.locator('#g4-mock-start').click();
    for (const [index, q] of mockReading.entries()) {
      const number = index + 1;
      await page.getByRole('heading',{name:new RegExp(' · ' + number + ' / 35$')}).waitFor();
      assert(await fits());
      if (q.passage) assert(await page.getByRole('heading',{name:q.passage.title}).isVisible());
      if (q.tiles) assert.equal(await page.locator('.g4-mock-tiles span').count(), 5);
      await choice(q.answer).click();
      await page.locator(`[data-g4-exam-choice="${q.answer}"][aria-pressed=true]`).waitFor();
      if (index === 0) {
        await page.reload();
        await page.locator(`[data-g4-exam-choice="${q.answer}"][aria-pressed=true]`).waitFor();
        assert.equal((await readState()).grade4Exam.active.answers[q.id], q.answer);
      }
      if (number < 35) await page.locator('#g4-mock-next').click();
    }
    await page.locator('#g4-mock-list summary').click();
    await page.locator('[data-g4-mock-jump="0"]').click();
    await page.getByRole('heading',{name:/ · 1 \/ 35$/}).waitFor();
    await page.locator('#g4-mock-finish').click();
    await page.locator('#g4-mock-submit-reading').click();
    await page.getByRole('heading',{name:'次はリスニング'}).waitFor();
    await page.locator('#g4-mock-listen').click();
    await page.getByText('音声を再生できません。通信や音量を確認して再開してください。').waitFor();
    assert.equal((await readState()).grade4Exam.active.repeats, 0);
    await page.locator('#g4-mock-play').click();
    for (const [index, q] of mockListening.entries()) {
      await page.getByRole('heading',{name:new RegExp(' · ' + (index + 1) + ' / 30$')}).waitFor();
      assert(await fits());
      assert(!(await page.getByText(q.prompt, {exact:true}).count()));
      if (q.section === 'l1') assert.deepEqual(await page.locator('[data-g4-exam-choice]').allTextContents().then(values => values.map(v => v.trim())), ['1','2','3']);
      await page.getByText('答えを選ぶ時間',{exact:true}).waitFor();
      await choice(q.answer).click();
      await page.locator(`[data-g4-exam-choice="${q.answer}"][aria-pressed=true]`).waitFor();
      if (index === 0) {
        assert.deepEqual((await page.evaluate(() => window.playedGrade4)).filter(id => id === q.id), [q.id,q.id,q.id]);
        await page.reload();
        await page.locator('#g4-mock-play').click();
      }
      await page.clock.fastForward(10500);
    }
    await page.getByRole('heading',{name:'4級模試の結果'}).waitFor();
    assert.equal(await page.locator('.result-score strong').innerText(), '65 / 65');
    assert.equal(await page.locator('.result-item').count(), 65);
    const saved = await readState();
    assert.equal(saved.grade4Exam.active, null);
    assert.equal(Object.keys(saved.grade4Exam.latest.answers).length, 65);
    assert.equal(saved.forest.total, 6);
    assert.deepEqual(errors, []);

    const durations = await page.evaluate(async paths => {
      const context = new AudioContext();
      try {
        return await Promise.all(paths.map(async path => {
          const response = await fetch(path);
          if (!response.ok) throw new Error(path + ': ' + response.status);
          return (await context.decodeAudioData(await response.arrayBuffer())).duration;
        }));
      } finally {
        await context.close();
      }
    }, Object.values(audioFiles));
    assert(durations.every(duration => duration > 4));
    const listeningDuration = mockListening.reduce((seconds, q) =>
      seconds + durations[Object.keys(audioFiles).indexOf(q.id)] * 2 + 10, 0);
    assert(listeningDuration < 30 * 60, 'Full listening playback must fit the time limit');
    console.log('PASS: all 36 MP3s decoded; timed listening nominal duration', Math.round(listeningDuration), 'seconds');

    await page.getByRole('link',{name:'4級ホーム'}).click();
    await page.locator('[data-course="5"]').click();
    await page.goto(base + '#exams');
    await page.getByRole('heading',{name:'実戦テスト',exact:true}).waitFor();
    console.log('PASS: 6 practice questions, all 65 exam questions, reload, retry, scoring, 320px, Grade 5 navigation');
  } finally {
    await browser.close();
    if (!live) server.close();
  }
}
main().catch(error => {console.error(error); server.close(); process.exitCode = 1;});
