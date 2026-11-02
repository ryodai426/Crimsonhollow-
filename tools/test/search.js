// STAGE 1-1：家に入る → 手紙（手掛かり）を3つ読む → 家の中で襲撃ムービー → 入ってきた村人を倒す → 外に出る → 村のムービー → 1-2 が始まるか
// node tools/test/search.js <出力先>
const { chromium } = require('playwright');
(async () => {
  const SP = process.argv[2] || '/tmp';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + '\n' + e.stack));
  await p.goto('http://localhost:8766/?' + Date.now()); await p.waitForTimeout(1200);
  const key = c => p.evaluate(c => dispatchEvent(new KeyboardEvent('keydown', { code: c })) || dispatchEvent(new KeyboardEvent('keyup', { code: c })), c);
  const shot = async n => { await p.waitForTimeout(700); await p.screenshot({ path: `${SP}/s11-${n}.png` }); };
  console.log(await p.evaluate(() => { const g = window.__game; g.startGame('village'); g.sim(4.2);
    return `wave ${g.director.wave} ${g.stage.waves[0].title} houses ${g.HOUSES.length} looks ${g.LOOKS.length} clues ${g.LOOKS.filter(l => l.clue).length} enemies ${g.enemies.length} obj="${document.getElementById('obj').textContent}"`; }));
  // walk in through a door (checks the doorway is open)
  console.log(await p.evaluate(() => { const g = window.__game, H = g.HOUSES[0], P = g.player; P.invuln = 99;
    P.pos.copy(H.door).addScaledVector(H.out, 2.5); P.yaw = Math.atan2(H.out.x, H.out.z); dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' })); g.sim(2.2); dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' })); g.sim(0.2);
    return `walked in: inside=${!!g.houseAt(P.pos.x, P.pos.z)} pos ${P.pos.x.toFixed(1)},${P.pos.z.toFixed(1)}`; }));
  await shot('0-inside');
  // read three letters (in three houses)
  const letters = await p.evaluate(() => window.__game.LOOKS.map((l, i) => [i, l.clue, l.house]).filter(x => x[1]).slice(0, 3).map(x => x[0]));
  for (const [n, i] of letters.entries()) {
    await p.evaluate(i => { const g = window.__game, L = g.LOOKS[i], H = g.HOUSES[L.house], P = g.player; const d = new (P.pos.constructor)(H.x - L.pos.x, 0, H.z - L.pos.z).normalize(); P.pos.set(L.pos.x + d.x * 1.0, 0, L.pos.z + d.z * 1.0); P.yaw = Math.atan2(d.x, d.z); g.sim(0.3); }, i);
    if (n === 0) await shot('1-prompt');
    await key('KeyE'); const st = await p.evaluate(() => `${window.__game.game.state} "${document.getElementById('readTitle').textContent}"`); console.log('read:', st);
    if (n === 0) await shot('2-letter');
    await key('KeyE'); await p.evaluate(() => window.__game.sim(0.3));
  }
  console.log(await p.evaluate(() => { const g = window.__game; return `after 3 letters: state ${g.game.state} step ${g.search.step} movie ${g.cine.movie && g.cine.movie.dur}`; }));
  await p.evaluate(() => { window.__game.cine.paused = true; });
  for (const t of [1.5, 4.8, 6.5, 8.8]) { await p.evaluate(t => { const g = window.__game; g.cine.t = t; g.renderCine(t); }, t); await shot('3-ambush-' + t); }
  console.log(await p.evaluate(() => { const g = window.__game; g.cine.paused = false; g.cine.t = g.cine.movie.dur; g.sim(0.1);
    return `ambush over: state ${g.game.state} enemies ${g.enemies.filter(e => e.alive).length} inside ${g.enemies.filter(e => e.alive && g.houseAt(e.pos.x, e.pos.z)).length}`; }));
  await shot('4-fight');
  console.log(await p.evaluate(() => { const g = window.__game, P = g.player; let n = 0;
    for (let i = 0; i < 400 && g.search.step === 'ambush'; i++) { P.invuln = 99; P.hp = 100; for (const e of g.enemies) if (e.alive && e.pos.distanceTo(P.pos) < 7) { e.damage(999, 'body', new (P.pos.constructor)(0, 0, 1)); n++; } g.sim(0.25); }
    return `killed ${n}, step ${g.search.step}, obj="${document.getElementById('obj').textContent}", marker ${g.director && true}`; }));
  // walk out of the door
  console.log(await p.evaluate(() => { const g = window.__game, H = g.search.house, P = g.player; P.pos.copy(H.door).addScaledVector(H.out, -1); P.yaw = Math.atan2(-H.out.x, -H.out.z) ;
    dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' })); for (let i = 0; i < 30 && g.game.state === 'play'; i++) g.sim(0.1); dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    return `outside: state ${g.game.state} step ${g.search.step} movie ${g.cine.movie.dur}`; }));
  await p.evaluate(() => { window.__game.cine.paused = true; });
  for (const t of [2, 6, 10.5]) { await p.evaluate(t => { const g = window.__game; g.cine.t = t; g.renderCine(t); }, t); await shot('5-outbreak-' + t); }
  console.log(await p.evaluate(() => { const g = window.__game; g.cine.paused = false; g.cine.t = g.cine.movie.dur; g.sim(0.1); g.sim(4);
    return g.enemies.map(e => `[${e.type} alive=${e.alive} dead=${e.dead} st=${e.state} d=${e.pos.distanceTo(g.player.pos).toFixed(1)} vis=${e.h.root.visible}]`).join(' ') + ` scene villagers ${g.scene.children.length} ` + `after: state ${g.game.state} wave ${g.director.wave} ${g.stage.waves[g.director.wave].title} ${g.stage.waves[g.director.wave].sub} phase ${g.director.phase} enemies ${g.enemies.length}`; }));
  await shot('6-mission12');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
