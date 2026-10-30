const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 320, height: 240 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + e.stack));
  await p.goto('http://localhost:8766/?' + Date.now()); await p.waitForTimeout(1000);
  const r = await p.evaluate(() => {
    const g = window.__game, P = g.player, out = {};
    const key = (code, up = true) => { window.dispatchEvent(new KeyboardEvent('keydown', { code })); if (up) window.dispatchEvent(new KeyboardEvent('keyup', { code })); };
    g.startGame('village'); g.director.phase = 'rest'; g.sim(0.5);
    const setup = (behind) => {
      for (const e of g.enemies) { e.dead = true; e.removeT = 99; } g.sim(0.05);
      P.pos.set(0, 0, 8); P.yaw = 0; P.hp = 100; P.invuln = 0; P.state = 'normal'; P.guardCD = 0; P.grabbedBy = null;
      const e = g.spawnEnemy('fork'); e.pos.set(0, 0, behind ? 9.4 : 6.6); e.face = Math.atan2(P.pos.x - e.pos.x, P.pos.z - e.pos.z);
      e.t = { ...e.t, grab: 0, windup: 0.65 }; e.speed = 0.0001; e.cd = 99; e.setState('windup'); e.st = 0.6; return e;
    };
    const step = (sec) => { for (let t = 0; t < sec; t += 1 / 60) g.sim(1 / 60, 1 / 60); };
    // just guard: press, strike lands ~0.07s later
    let e = setup(); key('KeyF'); step(0.3); out.just = { hpLost: +(100 - P.hp).toFixed(1), enemy: e.state + '/' + e.staggerKind };
    // normal guard: press, wait 0.28s, then the strike
    e = setup(); e.st = 0.2; key('KeyF'); step(0.7); out.normal = { hpLost: +(100 - P.hp).toFixed(1), enemy: e.state + '/' + e.staggerKind };
    // no guard
    e = setup(); step(0.3); out.none = { hpLost: +(100 - P.hp).toFixed(1), enemy: e.state };
    // from behind while guarding
    e = setup(true); key('KeyF'); step(0.3); out.behind = { hpLost: +(100 - P.hp).toFixed(1) };
    // grab while guarding
    e = setup(); e.setState('grabWind'); e.st = 0.4; key('KeyF'); step(0.2); out.grab = { grabbed: !!P.grabbedBy, enemy: e.state + '/' + e.staggerKind };
    // grab without guard
    e = setup(); e.setState('grabWind'); e.st = 0.4; step(0.2); out.grabNoGuard = { grabbed: !!P.grabbedBy }; P.grabbedBy = null; for (const x of g.enemies) { x.dead = true; x.removeT = 99; } g.sim(0.05);
    // hold F: guard still ends after 0.5s; tapping during cooldown does nothing
    P.state = 'normal'; P.guardCD = 0; key('KeyF', false); step(0.6); out.holdState = P.state; window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyF' }));
    key('KeyF'); out.cooldownPress = P.state; step(0.4); key('KeyF'); out.afterCooldown = P.state;
    // speed while guarding
    step(0.6); P.state = 'normal'; P.guardCD = 0; P.pos.set(0, 0, 8); key('KeyF'); g.input.my = 1; const z0 = P.pos.z; step(0.4); out.guardSpeed = +((z0 - P.pos.z) / 0.4).toFixed(2); g.input.my = 0;
    return out;
  });
  console.log(JSON.stringify(r, null, 1)); console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
