// 各ステージ・各章の雰囲気で、主人公と近・中・遠のゾンビがどう見えるかを撮影する
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const SP = process.argv[2], tag = process.argv[3] || 'v';
  const cases = [['village', 0], ['village', 2], ['village', 3], ['city', 0], ['city', 2], ['stationIn', 0], ['stationIn', 1], ['stationIn', 2]];
  const p = await b.newPage({ viewport: { width: 960, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR: ' + e.message));
  await p.goto('http://localhost:8766/?' + Date.now()); await p.waitForTimeout(1500);
  for (const [st, w] of cases) {
    await p.evaluate(([st, w]) => {
      const g = window.__game, P = g.player;
      g.startGame(st); g.sim(0.5); g.startWave(w); g.sim(6); g.director.phase = 'combat';
      for (const e of g.enemies) e.alive && (e.pos.y = -50, e.speed = 0);
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
      const type = st === 'village' ? 'fork' : 'zombie';
      [[3.5, -0.8], [7, 1.2], [12, -1.5]].forEach(([d, s]) => { const e = g.spawnEnemy(type); e.pos.set(P.pos.x + fx * d + rx * s, 0, P.pos.z + fz * d + rz * s); e.speed = 0; });
      g.sim(0.6); for (const e of g.enemies) e.speed = 0;
    }, [st, w]);
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${SP}/${tag}-${st}-${w}.png` });
  }
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
