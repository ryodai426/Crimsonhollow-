// ESCメニュー（感度・操作設定・ホームに戻る）と、調べる画面（手紙）を PC・スマホ縦・スマホ横で撮る。ホームに戻るとタイトルに戻るか
// node tools/test/menu.js <出力先>
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const SP = process.argv[2] || '/tmp';
  const cases = [['pc', { viewport: { width: 1280, height: 720 } }], ['phoneP', { ...devices['Pixel 7'] }], ['phoneL', { ...devices['Pixel 7 landscape'] }]];
  for (const [name, opt] of cases) {
    const ctx = await b.newContext(opt); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/?low&' + Date.now()); await p.waitForTimeout(2000);
    await p.evaluate(() => { const g = window.__game; g.startGame('village'); g.sim(4); const L = g.LOOKS.find(l => l.clue), H = g.HOUSES[L.house], P = g.player;
      const d = new (P.pos.constructor)(H.x - L.pos.x, 0, H.z - L.pos.z).normalize(); P.pos.set(L.pos.x + d.x, 0, L.pos.z + d.z); P.yaw = Math.atan2(d.x, d.z); g.sim(0.4); });
    await p.waitForTimeout(1200); await p.screenshot({ path: `${SP}/M-${name}-look.png` });
    const btn = await p.evaluate(() => { const b = document.getElementById('tLook'); return b && !b.classList.contains('hidden'); });
    await p.evaluate(() => dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' })));
    await p.waitForTimeout(600); await p.screenshot({ path: `${SP}/M-${name}-letter.png` });
    await p.evaluate(() => dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' })));
    await p.evaluate(() => { window.__game.game.state = 'play'; document.getElementById('read').classList.add('hidden'); });
    if (name === 'pc') await p.evaluate(() => { document.exitPointerLock(); window.__game.game.state = 'play'; document.getElementById('pause').classList.remove('hidden'); window.__game.game.state = 'pause'; });
    else await p.tap('#tMenu');
    await p.waitForTimeout(600); await p.screenshot({ path: `${SP}/M-${name}-pause.png` });
    const st = await p.evaluate(() => window.__game.game.state);
    await p.click('#homeBtn'); await p.waitForTimeout(500);
    const after = await p.evaluate(() => `${window.__game.game.state} title=${!document.getElementById('title').classList.contains('hidden')} hud=${!document.getElementById('hud').classList.contains('hidden')}`);
    console.log(name, `touchLookButton=${btn}`, 'pause state', st, '-> home:', after, errs.join(' | ') || 'no errors');
    await ctx.close();
  }
  await b.close();
})();
