const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 320, height: 180 } });
  const errs=[]; p.on('pageerror', e => errs.push('PAGEERR: ' + e.message + '\n' + e.stack));
  await p.goto('http://localhost:8766/?low&' + Date.now()); await p.waitForTimeout(800);
  const out = await p.evaluate((STG) => {
    const g = window.__game, P = g.player, log = []; const seen = new Set();
    g.startGame(STG); g.inv.owned.sg = true; g.inv.ammo.sg = 999; g.inv.ammo.hg = 999; g.inv.mag.sg = 6;
    let lastWave = -1;
    for (let i = 0; i < 12000; i++) {
      P.hp = 100; if (P.dead) { P.dead = false; P.state = 'normal'; }
      if (g.director.wave !== lastWave) { lastWave = g.director.wave; log.push(`step ${i}: wave ${lastWave} (${g.stage.waves[lastWave].sub})`); const d = g.stage.arenaDoor; if (g.stage.waves[lastWave].boss && d) P.pos.set(d[0], 0, d[1] - 2.5); }
      let best = null, bd = 1e9; for (const e of g.enemies) { if (!e.alive) continue; const d = e.pos.distanceTo(P.pos); if (d < bd) { bd = d; best = e; } }
      g.input.aim = false; g.input.fire = false;
      if (best) {
        // walk toward the target if far (follow nav-free straight line, good enough in open rooms)
        const c = g.camera.position, t = best.boss ? best.hb.neck : best.hb.head, dx = t.x - c.x, dy = t.y - c.y, dz = t.z - c.z;
        P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz));
        if (best.kickable && bd < (best.boss ? 3.4 : 2.4)) { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyF' })); }
        else { g.input.aim = true; g.input.fire = true; }
        if (best.boss) { const s = best.state; if (!seen.has(s)) { seen.add(s); log.push(`  boss ${s} hp ${Math.round(best.hp)}`); } }
      }
      if (P.grabbedBy || g.director.phase === 'combat' && !document.getElementById('qte').classList.contains('hidden')) { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })); }
      g.sim(0.1);
      if (g.director.phase === 'rest') { log.push(`  cleared at step ${i}, kills ${g.stats.kills}`); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter' })); }
      if (g.game.state === 'win') { log.push('WIN at ' + i); break; }
      if (i === 11999) log.push('TIMEOUT phase ' + g.director.phase + ' alive ' + g.enemies.filter(e => e.alive).map(e => e.type + '@' + e.pos.x.toFixed(1) + ',' + e.pos.z.toFixed(1) + ':' + e.state + ':hp' + Math.round(e.hp)).join(' '));
    }
    return log;
  }, process.argv[3] || 'stationIn');
  console.log(out.join('\n'));
  await p.waitForTimeout(500);
  await p.screenshot({ path: process.argv[2] + '/inwin.png' });
  console.log(errs.join('\n'));
  await b.close();
})();
