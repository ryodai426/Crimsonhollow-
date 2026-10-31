// STAGE 2：街の最終章（警察署へ）で入口に着くと、署内（stationIn）に切り替わり、所持品と体力が引き継がれるか
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 320, height: 240 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/?low&' + Date.now()); await p.waitForTimeout(1000);
  const r = await p.evaluate(() => {
    const g = window.__game, P = g.player, log = [];
    g.startGame('city'); log.push('waves: ' + g.stage.waves.map(w => w.sub).join(' / '));
    g.inv.gold = 7777; g.startWave(3); P.hp = 64;
    for (let i = 0; i < 150 && !g.director.goShown; i++) { P.hp = 64; g.sim(0.1); }
    log.push(`goShown ${g.director.goShown} obj="${document.getElementById('obj').textContent}"`);
    P.pos.set(0, 0, -31.4); P.hp = 64; P.invuln = 5;
    for (let i = 0; i < 40 && g.stage.id === 'city'; i++) g.sim(0.1);
    log.push(`stage now ${g.stage.id}, wave ${g.director.wave} (${g.stage.waves[g.director.wave].sub}), gold ${g.inv.gold}, hp ${P.hp}, pos ${P.pos.x.toFixed(1)},${P.pos.z.toFixed(1)}`);
    return log;
  });
  console.log(r.join('\n')); console.log(errs.join('|') || 'no errors'); await b.close();
})();
