const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const SP = process.argv[2];
  const cases = [['pc', { viewport: { width: 1280, height: 720 } }], ['phoneP', { ...devices['Pixel 7'] }], ['phoneL', { ...devices['Pixel 7 landscape'] }]];
  for (const [name, opt] of cases) {
    const ctx = await b.newContext(opt); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push('PAGEERR: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
    await p.goto('http://localhost:8766/?' + Date.now()); await p.waitForTimeout(2500);
    await p.screenshot({ path: `${SP}/L-${name}-title.png` });
    await p.evaluate(() => { const g = window.__game; g.startGame('village'); g.sim(4); g.director.phase = 'combat';
      [['fork', -1.5, 4], ['sickle', 1.5, 3]].forEach(([t, x, z]) => { const e = g.spawnEnemy(t); e.pos.set(x, 0, z); e.speed = 0.2; }); g.sim(1); });
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `${SP}/L-${name}-game.png` });
    const r = await p.evaluate(() => { const s = document.getElementById('screen').getBoundingClientRect(); return [Math.round(s.left), Math.round(s.top), Math.round(s.width), Math.round(s.height), innerWidth, innerHeight]; });
    console.log(name, 'screen rect', r, errs.join(' | '));
    await ctx.close();
  }
  await b.close();
})();
