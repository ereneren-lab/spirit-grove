// 신규 특성 회귀 — 자기과신·가속·재생력·적응력·테크니션·필터.
// 데미지 계열(적응력·테크니션·필터)은 SG.damage를 표본 평균으로 배율 검증한다(damage엔 0.85~1.0 난수 롤이 있음).
// 상태 계열(자기과신·가속·재생력)은 부여·이름·설명·구현 훅 존재를 검증한다.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(() => {
    const S = window.SG;
    const KO = S.ABILITY_KO, DESC = S.ABILITY_DESC, OV = S.ABILITY_OVERRIDE;
    const NEW = ["moxie", "speedboost", "regenerator", "adaptability", "technician", "filter"];
    const koDesc = NEW.every(a => KO[a] && DESC[a]);
    const assigned = { zenapex: "moxie", taekwarrior: "moxie", ravenveil: "speedboost", grovespirit: "regenerator", tidalore: "adaptability", mystfox: "technician", titanoak: "filter" };
    const assignOk = Object.entries(assigned).every(([id, ab]) => OV[id] === ab);

    // ── 데미지 배율: 표본 평균으로 비교(난수 롤 상쇄) ──
    const avg = (att, def, mv, n = 400) => { let s = 0; for (let i = 0; i < n; i++) s += S.damage(att, def, mv).dmg; return s / n; };
    // 적응력: 자속 기술이 1.5→2.0 (기대 배율 ~1.333)
    const dragon = S.makeMon("skydrake", 50);          // dragon 타입
    const dummy = S.makeMon("mossback", 50);           // 중립 방어측(용에 등배)
    const dmv = S.MOVES.dragonclaw;                     // dragon 자속
    dragon.ability = "guts"; const baseAdapt = avg(dragon, dummy, dmv);
    dragon.ability = "adaptability"; const withAdapt = avg(dragon, dummy, dmv);
    const adaptRatio = withAdapt / baseAdapt;

    // 테크니션: 위력 60 이하 ×1.5
    const tec = S.makeMon("mystfox", 50);
    const weak = S.MOVES.confusion;                     // 위력 50 (≤60)
    const strong = S.MOVES.psystrike || S.MOVES.psybeam; // 위력 85/65
    tec.ability = "guts"; const baseTecW = avg(tec, dummy, weak);
    tec.ability = "technician"; const withTecW = avg(tec, dummy, weak);
    const tecRatio = withTecW / baseTecW;
    // 65 초과 기술엔 적용 안 됨(psystrike 85)
    let tecStrongRatio = 1;
    if (strong && strong.power > 60) { tec.ability = "guts"; const a0 = avg(tec, dummy, strong); tec.ability = "technician"; const a1 = avg(tec, dummy, strong); tecStrongRatio = a1 / a0; }

    // 필터: 효과 굉장(super-effective) 피해 ×0.75
    const atkr = S.makeMon("emberdrake", 50);           // fire 공격
    const grassDef = S.makeMon("grovespirit", 50);      // 순수 grass — fire에 약점(2배)
    const fireMv = S.MOVES.flare;
    grassDef.ability = "overgrow"; const baseFil = avg(atkr, grassDef, fireMv);
    grassDef.ability = "filter"; const withFil = avg(atkr, grassDef, fireMv);
    const filRatio = withFil / baseFil;

    return { koDesc, assignOk, adaptRatio, tecRatio, tecStrongRatio, filRatio,
      strongPow: strong && strong.power };
  });

  // ── 상태 계열은 실제 전투 흐름으로 검증 ──
  // 재생력: 교체로 물러나면 HP 1/3 회복
  const regen = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    const a = S.makeMon("grovespirit", 40); a.ability = "regenerator"; a.hp = Math.floor(a.maxHp * 0.4);
    G.party = [a, S.makeMon("mossback", 40)]; G.active = 0; G.foe = S.makeMon("mossback", 40); G.inBattle = true;
    const before = a.hp; try { await F.chooseSwitch(1); } catch (e) { return { err: String(e) }; }
    return { gained: a.hp - before, expect: Math.floor(a.maxHp / 3) };
  });
  // 가속: 한 턴 끝에 속도 랭크 +1 (상대 생존)
  const boost = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    const me = S.makeMon("ravenveil", 50); me.ability = "speedboost"; me.stages.spd = 0;
    G.party = [me]; G.active = 0; G.foe = S.makeMon("mossback", 50); G.inBattle = true; G.busy = false;
    if (F.setupBattleUI) try { F.setupBattleUI(true); } catch (e) {}
    try { await F.doMove("peck"); } catch (e) { return { err: String(e) }; }
    return { spd: me.stages.spd };
  });
  // 자기과신: 트레이너전에서 상대를 쓰러뜨리면 공격 +1 (전투가 이어져 랭크 유지)
  const moxie = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    const me = S.makeMon("zenapex", 60); me.ability = "moxie"; me.stages.atk = 0; me.atk = 250; me.hp = me.maxHp;
    G.party = [me]; G.active = 0;
    const f1 = S.makeMon("mossback", 20); f1.hp = 1; f1.maxHp = 300; const f2 = S.makeMon("mossback", 20);
    G.foe = f1; G.inBattle = true; G.busy = false;
    G.trainer = { key: "zz", name: "T", team: [["mossback", 20], ["mossback", 20]], idx: 0, mons: [f1, f2], fainted: new Set(), switches: 0, reward: 0, money: 0 };
    if (F.setupBattleUI) try { F.setupBattleUI(true); } catch (e) {}
    try { await F.doMove("karatechop"); } catch (e) { return { err: String(e) }; }
    return { atk: me.stages.atk, foeHp: f1.hp };
  });

  ok(r.koDesc, "신규 6종 특성이 ABILITY_KO·DESC에 모두 있다");
  ok(r.assignOk, "7종에 신규 특성이 올바로 부여됐다");
  ok(r.adaptRatio > 1.28 && r.adaptRatio < 1.40, `적응력: 자속 피해 ×1.33 (실측 ${r.adaptRatio.toFixed(3)})`);
  ok(r.tecRatio > 1.42 && r.tecRatio < 1.58, `테크니션: 위력 50 기술 ×1.5 (실측 ${r.tecRatio.toFixed(3)})`);
  ok(r.tecStrongRatio > 0.94 && r.tecStrongRatio < 1.06, `테크니션: 위력 ${r.strongPow} 기술엔 무효 (실측 ${r.tecStrongRatio.toFixed(3)})`);
  ok(r.filRatio > 0.70 && r.filRatio < 0.80, `필터: 효과 굉장 피해 ×0.75 (실측 ${r.filRatio.toFixed(3)})`);
  ok(regen.gained === regen.expect, `재생력: 교체로 물러나면 HP 1/3 회복 (${regen.gained}/${regen.expect})`);
  ok(boost.spd === 1, `가속: 한 턴 끝에 속도 랭크 +1 (실측 ${boost.spd})`);
  ok(moxie.foeHp === 0 && moxie.atk === 1, `자기과신: 상대 KO 시 공격 랭크 +1 (실측 ${moxie.atk})`);
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 2).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 신규 특성 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
