// スマホで商人に近づくと「商人と取引」ボタンが出て、タップで買い物画面が開くか
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const SP = process.argv[2];
  for (const dev of ['Pixel 7', 'Pixel 7 landscape']) {
    const name = dev.replace(/ /g, '');
    const ctx = await b.newContext({ ...devices[dev] }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/?low&' + Date.now()); await p.waitForTimeout(1500);
    const vis = () => p.evaluate(() => ({ trade: !document.getElementById('tTrade').classList.contains('hidden'), shop: !document.getElementById('shop').classList.contains('hidden'), prompt: document.getElementById('prompt').textContent, obj: document.getElementById('obj')?.textContent }));
    const center = id => p.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; return { x, y, top: document.elementFromPoint(x, y).id }; }, id);
    await p.evaluate(() => { const g = window.__game; g.startGame('village'); for (let i = 0; i < 100 && g.director.phase !== 'combat'; i++) g.sim(0.2);
      for (const e of g.enemies) e.alive = false; g.director.spawned = g.stage.waves[0].total; g.sim(1.5); g.player.pos.set(g.TRADER_POS.x + 8, 0, g.TRADER_POS.z); g.sim(0.2); });
    console.log(name, 'far:', JSON.stringify(await vis()));
    await p.evaluate(() => { const g = window.__game; g.player.pos.set(g.TRADER_POS.x + 2, 0, g.TRADER_POS.z); g.sim(0.2); });
    await p.waitForTimeout(800);
    console.log(name, 'near:', JSON.stringify(await vis()));
    await p.screenshot({ path: `${SP}/trade-${name}-near.png` });
    const a = await center('tAct'); await p.touchscreen.tap(a.x, a.y); await p.waitForTimeout(300);
    console.log(name, 'after guard tap:', JSON.stringify(await vis()));
    const t = await center('tTrade'); console.log(name, 'trade button hit-test:', t.top);
    await p.touchscreen.tap(t.x, t.y); await p.waitForTimeout(500);
    console.log(name, 'after trade tap:', JSON.stringify(await vis()));
    await p.screenshot({ path: `${SP}/trade-${name}-shop.png` });
    await p.evaluate(() => document.getElementById('shopClose').scrollIntoView()); console.log(name, 'close label:', await p.evaluate(() => document.getElementById('shopClose').textContent));
    const c = await center('shopClose'); await p.touchscreen.tap(c.x, c.y); await p.waitForTimeout(500);
    console.log(name, 'after close:', JSON.stringify(await vis()), errs.join(' | ') || 'no errors');
    await ctx.close();
  }
  await b.close();
})();
