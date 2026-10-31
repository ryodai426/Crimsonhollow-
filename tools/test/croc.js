// ワニ：水中で近づく → 背びれを見せる → 背びれを撃つとひっくり返って浮かぶ／撃たないと噛みつく
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const SP = process.argv[2];
  const p = await b.newPage({ viewport: { width: 800, height: 600 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/?' + Date.now()); await p.waitForTimeout(1500);
  const step = (code) => p.evaluate(code);
  // 1) shoot the fin
  let r = await step(() => {
    const g = window.__game, P = g.player, log = [];
    g.startGame('sewer'); g.sim(4); for (const e of g.enemies) { e.dead = true; e.removeT = 99; e.h.root.visible = false; } g.director.spawned = 1e9;
    g.inv.mag.hg = 99; P.pos.set(4, 0, 38.5); P.yaw = 0; P.pitch = -0.1;
    const c = g.spawnEnemy('croc'); c.pos.set(4, 0, 27); c.cd = 0; window.__c = c;
    const seen = [];
    for (let i = 0; i < 120 && c.state !== 'stalk'; i++) { g.sim(0.05); if (!seen.includes(c.state)) seen.push(c.state); }
    log.push('states before: ' + seen.join('>') + ` dist ${c.pos.distanceTo(P.pos).toFixed(1)} finY ${c.hb.fin.y.toFixed(2)} visible ${c.h.root.visible}`);
    return log;
  });
  console.log(r.join('\n'));
  await p.waitForTimeout(1200); await p.screenshot({ path: `${SP}/croc-fin.png` });
  r = await step(() => {
    const g = window.__game, P = g.player, c = window.__c, log = []; const hp0 = c.hp;
    for (let i = 0; i < 60 && c.state === 'stalk'; i++) {
      const cam = g.camera.position, t = c.hb.fin, dx = t.x - cam.x, dy = t.y - cam.y, dz = t.z - cam.z;
      P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz)); g.input.aim = true; g.input.fire = i % 4 === 3; g.sim(0.05);
    }
    g.input.fire = false; g.input.aim = false;
    log.push(`after shooting fin: state ${c.state}, hp ${hp0.toFixed(0)}→${c.hp.toFixed(0)}, playerHP ${P.hp}`);
    g.sim(0.6); return log;
  });
  console.log(r.join('\n'));
  await p.waitForTimeout(1200); await p.screenshot({ path: `${SP}/croc-float.png` });
  // 2) shoot it while it floats, then let another one bite
  r = await step(() => {
    const g = window.__game, P = g.player, c = window.__c, log = [];
    for (let i = 0; i < 80 && c.alive && c.state === 'float'; i++) {
      const cam = g.camera.position, t = c.hb.head, dx = t.x - cam.x, dy = t.y - cam.y, dz = t.z - cam.z;
      P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz)); g.input.aim = true; g.input.fire = i % 4 === 3; g.sim(0.05);
    }
    g.input.fire = false; g.input.aim = false;
    log.push(`while floating: state ${c.state}, hp ${c.hp.toFixed(0)}, alive ${c.alive}`);
    P.hp = 100; P.invuln = 0; P.yaw = 0;
    const d = g.spawnEnemy('croc'); d.pos.set(4, 0, 30); d.cd = 0; const seen = [];
    for (let i = 0; i < 200 && P.hp === 100; i++) { g.sim(0.05); if (!seen.includes(d.state)) seen.push(d.state); }
    log.push(`unshot croc: ${seen.join('>')}, playerHP ${P.hp.toFixed(0)}`);
    return log;
  });
  console.log(r.join('\n'));
  console.log(errs.join('|') || 'no errors'); await b.close();
})();
