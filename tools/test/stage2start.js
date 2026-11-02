// STAGE 2 TEST の開始：タイトルのカードから始めると「警察署へ」の章で、入口の手前に立っているか → 入口まで走ると署内に切り替わるか（node tools/test/stage2start.js <出力先>）
const { chromium } = require('playwright');
(async () => {
  const SP = process.argv[2] || '/tmp';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/?' + Date.now()); await p.waitForTimeout(1200);
  await p.click('.stage[data-stage="city"]'); await p.waitForTimeout(300);
  const info = () => p.evaluate(() => { const g = window.__game, P = g.player, S = g.solids;
    const inside = S.some(s => s.alive && P.pos.x > s.minX - 0.35 && P.pos.x < s.maxX + 0.35 && P.pos.z > s.minZ - 0.35 && P.pos.z < s.maxZ + 0.35);
    return `stage ${g.stage.id} wave ${g.director.wave} (${g.stage.waves[g.director.wave].sub}) pos ${P.pos.x.toFixed(1)},${P.pos.z.toFixed(1)} inWall ${inside} goShown ${!!g.director.goShown} obj="${document.getElementById('obj').textContent}"`; });
  console.log('start :', await info());
  await p.evaluate(() => { const g = window.__game; g.player.invuln = 99; g.sim(2); }); await p.waitForTimeout(800); await p.screenshot({ path: `${SP}/s2-start.png` });
  await p.evaluate(() => { const g = window.__game; for (let i = 0; i < 40 && !g.director.goShown; i++) { g.player.invuln = 99; g.sim(0.1); } });
  console.log('marker:', await info()); await p.waitForTimeout(800); await p.screenshot({ path: `${SP}/s2-marker.png` });
  // run north to the door with the normal movement keys
  await p.evaluate(() => { const g = window.__game, P = g.player; dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' })); for (let i = 0; i < 200 && g.stage.id === 'city'; i++) { P.invuln = 99; P.yaw = Math.atan2(-(0 - P.pos.x), -(-31.4 - P.pos.z)); g.sim(0.1); } dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' })); g.sim(1.5); });
  console.log('after :', await info()); await p.waitForTimeout(800); await p.screenshot({ path: `${SP}/s2-inside.png` });
  console.log(errs.join('|') || 'no errors'); await b.close();
})();
