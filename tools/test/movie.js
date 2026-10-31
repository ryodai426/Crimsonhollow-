// ムービーの確認：指定した時刻の静止画を撮る＋スキップ・終了後にゲームが始まるか（node tools/test/movie.js <出力先> [movie]）
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const SP = process.argv[2], id = process.argv[3] || 'stage1';
  const p = await b.newPage({ viewport: { width: 800, height: 600 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + e.stack));
  await p.goto('http://localhost:8766/?' + Date.now()); await p.waitForTimeout(1500);
  const times = [0.9, 2.4, 3.3, 4.2, 5.5, 8.0, 9.5, 10.2, 11.1, 12.0, 13.5, 15.0, 17.0, 20.0, 21.0];
  await p.evaluate(id => { const g = window.__game; g.playMovie(id, () => window.__ended = true); g.cine.paused = true; }, id);
  for (const t of times) {
    await p.evaluate(t => { const g = window.__game; g.cine.t = t; g.renderCine(t); }, t);
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${SP}/movie-${t.toFixed(1).padStart(4, '0')}.png` });
  }
  // let it finish on its own, then check the game started
  const r = await p.evaluate(() => { const g = window.__game; g.cine.paused = false; g.cine.t = g.cine.movie.dur - 0.05; return new Promise(res => setTimeout(() => res({ ended: !!window.__ended, state: g.game.state, stage: g.stage.id }), 1500)); });
  console.log('after end:', JSON.stringify(r));
  // skip with Enter
  const s = await p.evaluate(() => { const g = window.__game; window.__ended = false; g.playMovie('stage1', () => { window.__ended = true; }); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' })); return { ended: window.__ended, state: g.game.state }; });
  console.log('skip:', JSON.stringify(s), errs.join(' | ') || 'no errors');
  await b.close();
})();
