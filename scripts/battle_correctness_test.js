// 회귀 — 전투 정합성 4건:
//  (1) 피해기의 부가 능력치 변화(eff.stat)가 실제로 발동한다(예전엔 power>0이면 죽음)
//  (2) 타입표 canon 저항 3칸(grass→bug·flying→elec·ground→bug = 0.5)
//  (3) 기합의 띠가 sash 필드로 동작(키 하드코딩 아님)
//  (4) 급소는 장막(리플렉터/빛의장막)을 무시한다
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  // (2) 타입표 — 순수 데이터
  const chart = await p.evaluate(() => {
    const E = window.SG.EFF;
    return { grassBug: E.grass.bug, flyElec: E.flying.elec, groundBug: E.ground.bug };
  });
  ok(chart.grassBug === 0.5, `풀→벌레 저항 0.5 (${chart.grassBug})`);
  ok(chart.flyElec === 0.5, `비행→전기 저항 0.5 (${chart.flyElec})`);
  ok(chart.groundBug === 0.5, `땅→벌레 저항 0.5 (${chart.groundBug})`);

  // (1) eff.stat: 얼음바람(spd -1, chance 1) — 상대 속도 랭크 하락
  const icy = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    const me = S.makeMon("frostpup", 40); const foe = S.makeMon("mossback", 40); foe.stages.spd = 0;
    G.party = [me]; G.active = 0; G.foe = foe; G.inBattle = true; G.busy = false;
    if (F.setupBattleUI) try { F.setupBattleUI(true); } catch (e) {}
    try { await F.doMove("icywind"); } catch (e) { return { err: String(e) }; }
    return { spd: foe.stages.spd };
  });
  ok(icy.spd === -1, `피해기 얼음바람이 상대 속도를 낮춘다 (${icy.spd})`);

  // (1b) eff.stat self: 인파이트(자신 def -1)
  const cc = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    const me = S.makeMon("zenapex", 50); me.moves = ["closecombat", "karatechop", "tackle", "slam"]; me.pp = { closecombat: 5, karatechop: 10, tackle: 10, slam: 10 }; me.stages.def = 0;
    const foe = S.makeMon("mossback", 40); foe.hp = foe.maxHp;
    G.party = [me]; G.active = 0; G.foe = foe; G.inBattle = true; G.busy = false;
    if (F.setupBattleUI) try { F.setupBattleUI(true); } catch (e) {}
    try { await F.doMove("closecombat"); } catch (e) { return { err: String(e) }; }
    return { def: me.stages.def };
  });
  ok(cc.def === -1, `인파이트가 자신 방어를 낮춘다 (${cc.def})`);

  // (3) 기합의 띠: 풀피에서 치사 피해를 1HP로 버틴다 (sash 필드 경로)
  const sash = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    const me = S.makeMon("blazelion", 55); me.atk = 250;
    const foe = S.makeMon("mossback", 5); foe.hp = foe.maxHp; foe.held = "focussash"; foe.ability = "guts";   // 옹골참이면 sturdy가 먼저 버텨 sash 검증이 안 됨
    G.party = [me]; G.active = 0; G.foe = foe; G.inBattle = true; G.busy = false;
    if (F.setupBattleUI) try { F.setupBattleUI(true); } catch (e) {}
    try { await F.doMove("flare"); } catch (e) { return { err: String(e) }; }
    return { foeHp: foe.hp, held: foe.held };
  });
  ok(sash.foeHp === 1 && sash.held === null, `기합의 띠가 치사타를 1HP로 버티고 소모된다 (hp=${sash.foeHp})`);

  // (4) 급소는 장막을 무시한다 — Math.random=0으로 급소 강제, 장막 유무 데미지가 같아야
  const critScr = await p.evaluate(() => {
    const S = window.SG; const att = S.makeMon("mystfox", 50); att.spa = 120; att.stages = { atk: 0, def: 0, spd: 0, spa: 0, spDef: 0, acc: 0, eva: 0 };
    const def = S.makeMon("mossback", 50); def.spDef = 60; def.maxHp = def.hp = 9999; def.stages = { atk: 0, def: 0, spd: 0, spa: 0, spDef: 0, acc: 0, eva: 0 };
    const mv = S.MOVES.psybeam; // 특수기(빛의장막 대상)
    S.setG(S.freshState()); const G = S.G(); G.foe = def;
    const critDmg = () => { const _r = Math.random; Math.random = () => 0; const d = S.damage(att, def, mv); Math.random = _r; return d; };
    // 급소 강제, 장막 ON
    G.screens = { me: { reflect: 0, light: 0 }, foe: { reflect: 0, light: 5 } }; const withScr = critDmg();
    G.screens.foe.light = 0; const noScr = critDmg();
    // 일반(비급소) 히트는 장막에 반감되는지도 확인 — Math.random=0.99면 crit 안 뜸
    const normDmg = (force) => { const _r = Math.random; Math.random = () => force; const d = S.damage(att, def, mv).dmg; Math.random = _r; return d; };
    G.screens.foe.light = 5; const normWith = normDmg(0.99);
    G.screens.foe.light = 0; const normNo = normDmg(0.99);
    return { critIsCrit: withScr.crit, withScr: withScr.dmg, noScr: noScr.dmg, normRatio: normWith / normNo };
  });
  ok(critScr.critIsCrit && critScr.withScr === critScr.noScr, `급소는 장막을 무시한다(장막 유무 급소 데미지 동일: ${critScr.withScr} vs ${critScr.noScr})`);
  ok(critScr.normRatio > 0.45 && critScr.normRatio < 0.55, `일반 히트는 장막에 정상 반감된다 (비율 ${critScr.normRatio.toFixed(2)})`);

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 전투 정합성 수정 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
