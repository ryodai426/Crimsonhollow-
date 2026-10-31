const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 480, height: 270 } });
  const errs=[]; p.on('pageerror', e => errs.push('PAGEERR: ' + e.message + '\n' + e.stack)); p.on('console', m => { if (m.type()==='error') errs.push('ERR '+m.text()); });
  await p.goto('http://localhost:8766/?low&' + Date.now()); await p.waitForTimeout(1000);
  await p.click('.stage[data-stage="city"]');
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const g = window.__game, S = g.solids;
    const inside = (x,z,r=0.4) => S.some(s => s.alive && x>s.minX-r && x<s.maxX+r && z>s.minZ-r && z<s.maxZ+r);
    const st = g.stage, N = g.NAV; const out = { solids: S.length, bad: [] };
    const reach = (x,z) => { const i = Math.floor(z - N.org) * N.n + Math.floor(x - N.org); return N.dist[i]; };
    for (const id of ['village','city','station','stationIn','subway','lab']) {
      g.buildStage(id); const st = g.stage; N.t=0;
      const check = (name,x,z) => { const ins = inside(x,z,0.35); /* reach from start */ const d = reach(x,z); if (ins || d < 0) out.bad.push(`${id} ${name} (${x},${z}) inside=${ins} dist=${d}`); };
      check('start', st.start[0], st.start[1]); check('trader', st.trader[0], st.trader[1]); if (st.bossPos) check('boss', st.bossPos[0], st.bossPos[1]+3); if (st.goal) check('goal', st.goal[0], st.goal[1]);
      st.spawns.forEach(([x,z],i) => check('spawn'+i, x, z));
    }
    g.buildStage('city');
    return out;
  });
  console.log(JSON.stringify(r));
  console.log(errs.join('\n'));
  await b.close();
})();
