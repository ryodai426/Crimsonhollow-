// レーダー：前・右・後ろの敵が正しい向きに表示され、壁の向こうの敵や範囲外の敵が出ないか
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const SP = process.argv[2];
  const cases = [['pc', { viewport: { width: 1280, height: 720 } }], ['phoneP', { ...devices['Pixel 7'] }], ['phoneL', { ...devices['Pixel 7 landscape'] }]];
  for (const [name, opt] of cases) {
    const ctx = await b.newContext(opt); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/?low&' + Date.now()); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => {
      const g = window.__game, P = g.player;
      g.startGame('city'); for (let i = 0; i < 100 && g.director.phase !== 'combat'; i++) g.sim(0.2);
      for (const e of g.enemies) e.alive = false; g.director.spawned = 1e9;
      P.pos.set(0, 0, 0); P.yaw = 0.7; g.sim(0.1);
      const f = [-Math.sin(P.yaw), -Math.cos(P.yaw)], rt = [Math.cos(P.yaw), -Math.sin(P.yaw)];
      const put = (fw, side) => { const e = g.spawnEnemy('zombie'); e.pos.set(P.pos.x + f[0] * fw + rt[0] * side, 0, P.pos.z + f[1] * fw + rt[1] * side); e.speed = 0; return e; };
      const ahead = put(8, 0), right = put(0, 6), behind = put(-5, 0), far = put(30, 0);
      // a wall between the player and one more enemy (to the left)
      const hid = put(0, -7);
      { const mx = (P.pos.x + hid.pos.x) / 2, mz = (P.pos.z + hid.pos.z) / 2; g.solids.push({ alive: true, minX: mx - 1, maxX: mx + 1, minZ: mz - 1, maxZ: mz + 1, maxY: 5 }); }
      g.sim(0.5); for (const e of g.enemies) e.speed = 0;
      // freeze positions for the shot
      return Object.fromEntries(Object.entries({ ahead, right, behind, far, hid }).map(([k, e]) => [k, +(e.radarT || 0).toFixed(2)]));
    });
    console.log(name, 'radarT', JSON.stringify(r));
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${SP}/radar-${name}.png` });
    const box = await p.evaluate(() => { const r = document.getElementById('radar').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); });
    console.log(name, 'radar rect', box, errs.join(' | ') || 'no errors');
    await p.screenshot({ path: `${SP}/radar-${name}-zoom.png`, clip: { x: box[0] - 4, y: box[1] - 4, width: box[2] + 8, height: box[3] + 8 } });
    await ctx.close();
  }
  await b.close();
})();
