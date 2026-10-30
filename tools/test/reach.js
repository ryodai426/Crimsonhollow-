const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 320, height: 180 } });
  p.on('pageerror', e => console.log('PAGEERR: ' + e.message));
  await p.goto('http://localhost:8766/?low&' + Date.now()); await p.waitForTimeout(800);
  for (const stage of ['village', 'city']) {
    const r = await p.evaluate((stage) => {
      const g = window.__game; g.startGame(stage); g.director.phase = 'rest';
      const out = [];
      for (const pos of [[0,0],[-20,0],[0,-20],[12,25]]) {
        for (const e of g.enemies) { e.dead = true; e.removeT = 99; } g.sim(0.1);
        g.player.pos.set(pos[0],0,pos[1]);
        const es = g.stage.spawns.map(([x,z]) => { const e = g.spawnEnemy(stage==='city'?'zombie':'fork'); e.pos.set(x,0,z); e.cd = 999; e.t = {...e.t, grab:0, thrower:false}; return e; });
        for (let t = 0; t < 120; t += 0.5) { g.player.hp = 100; g.player.invuln = 1; g.player.pos.set(pos[0],0,pos[1]); g.sim(0.5); }
        const far = es.map((e,i) => [i, Math.round(e.pos.distanceTo(g.player.pos)), Math.round(e.pos.x), Math.round(e.pos.z)]).filter(a => a[1] > 4);
        out.push(`player@${pos}: stuck ${far.length}/${es.length} ${JSON.stringify(far)}`);
      }
      return out;
    }, stage);
    console.log(stage + '\n' + r.join('\n'));
  }
  await b.close();
})();
