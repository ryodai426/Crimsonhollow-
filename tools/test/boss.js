const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 480, height: 270 } });
  const errs=[]; p.on('pageerror', e => errs.push('PAGEERR: ' + e.message + e.stack));
  await p.goto('http://localhost:8766/?low&' + Date.now()); await p.waitForTimeout(800); await p.click('.stage[data-stage="city"]');
  const out = await p.evaluate(() => {
    const g = window.__game, P = g.player; const log=[]; const seen=new Set();
    g.inv.owned.sg = true; g.inv.ammo.sg = 999; g.inv.ammo.hg = 999; g.inv.mag.sg = 6;
    g.startWave(3);
    for (let i=0;i<4000;i++) {
      P.hp = 100; if (P.dead) { P.dead=false; P.state='normal'; }
      const boss = g.director.boss;
      let best=null, bd=1e9; for (const e of g.enemies) { if (!e.alive) continue; const d=e.pos.distanceTo(P.pos); if (d<bd){bd=d;best=e;} }
      g.input.aim=false; g.input.fire=false;
      if (best) {
        const c=g.camera.position, t=best.boss?best.hb.neck:best.hb.head; const dx=t.x-c.x, dy=t.y-c.y, dz=t.z-c.z;
        P.yaw=Math.atan2(-dx,-dz); P.pitch=Math.atan2(dy,Math.hypot(dx,dz));
        if (best.kickable && bd < (best.boss?3.4:2.4)) { window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyF'})); window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyF'})); }
        else { g.input.aim=true; g.input.fire=true; }
      }
      if (document.getElementById('qte').classList.contains('hidden')===false && i%3===0) { window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space'})); window.dispatchEvent(new KeyboardEvent('keyup',{code:'Space'})); }
      if (boss) { if (!seen.has(boss.state)) { seen.add(boss.state); log.push(i+': boss '+boss.state+' hp '+Math.round(boss.hp)); } }
      g.sim(0.1);
      if (g.game.state==='win') { log.push('WIN at '+i); break; }
    }
    log.push('final phase '+g.director.phase+' state '+g.game.state+' bossHp '+(g.director.boss&&Math.round(g.director.boss.hp))+' dodges '+g.stats.dodges+' kills '+g.stats.kills);
    return log;
  });
  console.log(out.join('\n'));
  await p.waitForTimeout(600);
  await p.screenshot({ path: process.argv[2] + '/win.png' });
  console.log(errs.join('\n'));
  await b.close();
})();
