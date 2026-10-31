// 新ステージの各エリアを撮影する（node tools/test/tour.js <出力先> [stage,...]）
const { chromium } = require('playwright');
const SHOTS = {
  subway: [[0, 39, 0, 0, '地下道'], [7, 31, 1.4, 0, 'ポンプ室'], [0, 23, 0, 0, '改札'], [0, 10, 0, 1, 'ホーム'], [11, -13, 0, 2, 'トンネル'], [0, -29, 0, 3, '車両倉庫']],
  lab: [[0, 40, 0, 0, 'エアロック'], [0, 30, 0, 0, '入口ホール'], [0, 14, 0, 0, '培養槽'], [-20, 2, 1.57, 1, '標本保管室'], [20, 2, -1.57, 1, '制御室'], [0, -17, 0, 3, '発生源']],
};
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const SP = process.argv[2], stages = (process.argv[3] || 'subway,lab').split(',');
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/?' + Date.now()); await p.waitForTimeout(1500);
  for (const st of stages) for (const [x, z, yaw, wave, name] of SHOTS[st]) {
    await p.evaluate(([st, x, z, yaw, wave]) => {
      const g = window.__game, P = g.player;
      if (g.stage.id !== st) g.startGame(st);
      g.startWave(wave); g.sim(5.5); for (const e of g.enemies) { e.alive = false; e.h.root.visible = false; }
      g.director.spawned = 1e9; P.hp = 100;
      P.pos.set(x, 0, z); P.yaw = yaw; P.modelYaw = yaw + Math.PI; P.pitch = -0.05;
      for (let i = 0; i < 2; i++) { const e = g.spawnEnemy(g.stage.waves[wave].mix ? Object.keys(g.stage.waves[wave].mix)[i % 2] : 'zombie'); e.pos.set(x - Math.sin(yaw) * (4 + i * 3) + (i ? 1.2 : -1), 0, z - Math.cos(yaw) * (4 + i * 3)); e.speed = 0; }
      g.sim(0.5); for (const e of g.enemies) e.speed = 0;
    }, [st, x, z, yaw, wave]);
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `${SP}/tour-${st}-${name}.png` });
  }
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
