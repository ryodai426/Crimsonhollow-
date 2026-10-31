// 追跡範囲（ゾーン）：プレイヤーが同じゾーンにいるときだけ追い、出たら出現地点へ戻って待つか。新しい敵はプレイヤーのゾーンに出るか
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 320, height: 240 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/?low&' + Date.now()); await p.waitForTimeout(1000);
  const r = await p.evaluate(() => {
    const g = window.__game, P = g.player, log = [];
    const hold = (sec, x, z) => { for (let t = 0; t < sec; t += 0.5) { P.hp = 100; P.invuln = 1; P.pos.set(x, 0, z); g.sim(0.5); } };
    // village: an enemy from the NW quadrant, the player in the SE quadrant
    g.startGame('village'); g.director.phase = 'rest'; for (const e of g.enemies) { e.dead = true; e.removeT = 99; } g.sim(0.1);
    P.pos.set(20, 0, 20); const e = g.spawnEnemy('fork'); e.home.set(-30, 0, -30); e.pos.set(-30, 0, -30); e.zone = g.stage.zones.findIndex(r => -30 >= r[0] && -30 < r[1] && -30 >= r[2] && -30 < r[3]); e.cd = 999; e.t = { ...e.t, grab: 0, thrower: false };
    hold(15, 20, 20); log.push(`player in other zone: enemy ${e.state} at ${e.pos.x.toFixed(0)},${e.pos.z.toFixed(0)} (home -30,-30)`);
    hold(8, -15, -15); log.push(`player enters its zone: enemy ${e.state}, dist ${e.pos.distanceTo(P.pos).toFixed(1)}`);
    hold(25, 20, 20); log.push(`player leaves again: enemy ${e.state} at ${e.pos.x.toFixed(0)},${e.pos.z.toFixed(0)}, ${e.pos.distanceTo(e.home).toFixed(1)}m from home`);
    // spawning prefers the player's zone
    const zones = []; for (let i = 0; i < 12; i++) { const s = g.spawnEnemy('fork'); zones.push(s.zone); }
    log.push(`spawned zones with the player in zone ${[0, 1, 2, 3].find(i => { const r = g.stage.zones[i]; return 20 >= r[0] && 20 < r[1] && 20 >= r[2] && 20 < r[3]; })}: ${zones.join(',')}`);
    // sewer: a croc in another quadrant stays home and never surfaces
    g.startGame('sewer'); g.director.spawned = 1e9; for (const e of g.enemies) { e.dead = true; e.removeT = 99; } g.sim(0.1);
    const c = g.spawnEnemy('croc'); c.home.set(-36, 0, -12); c.pos.set(-36, 0, -12); c.zone = 0; c.cd = 0;
    let surfaced = false; for (let t = 0; t < 20; t += 0.5) { P.hp = 100; P.invuln = 1; P.pos.set(4, 0, 38.5); g.sim(0.5); if (c.state !== 'lurk') surfaced = true; }
    log.push(`croc out of zone: surfaced ${surfaced}, ${c.pos.distanceTo(c.home).toFixed(1)}m from home`);
    return log;
  });
  console.log(r.join('\n')); console.log(errs.join('|') || 'no errors'); await b.close();
})();
