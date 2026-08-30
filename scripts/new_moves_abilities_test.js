// 회귀 — 신규 기술 4종 + 신규 특성 3종의 데이터·학습·실제 전투 효과.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(() => {
    const S = window.SG, F = S.flow; const out = {};
    const M = S.MOVES;
    // 1) 기술 데이터
    out.moves = {
      powergem: !!(M.powergem && M.powergem.type === "rock" && M.powergem.cat === "spec" && M.powergem.power === 80),
      dragonrush: !!(M.dragonrush && M.dragonrush.type === "dragon" && M.dragonrush.cat === "phys" && M.dragonrush.power === 95),
      iciclecrash: !!(M.iciclecrash && M.iciclecrash.type === "ice" && M.iciclecrash.cat === "phys"),
      shadowclaw: !!(M.shadowclaw && M.shadowclaw.type === "ghost" && M.shadowclaw.cat === "phys" && M.shadowclaw.highCrit),
    };
    // 2) 학습 가능(각 기술을 배우거나 기본 보유한 종이 ≥1)
    const learnsAny = mv => S.DEX.some(d => (d.moves || []).includes(mv) || (d.learn || []).some(l => l[1] === mv));
    out.learnable = ["powergem", "dragonrush", "iciclecrash", "shadowclaw"].every(learnsAny);
    // 3) 특성 이름·설명
    out.abNamed = ["sandforce", "slushrush", "toughclaws"].every(a => S.ABILITY_KO[a] && S.ABILITY_DESC[a]);
    // 4) 종 배정(makeMon이 ABILITY_OVERRIDE를 반영)
    const ab = id => S.makeMon(id, 40).ability;
    out.assign = ab("sandwhirl") === "sandforce" && ab("burrowlord") === "sandforce"
      && ab("snowl") === "slushrush" && ab("iceling") === "slushrush"
      && ab("wyverna") === "toughclaws" && ab("drakeling") === "toughclaws";

    // ── 실제 전투 효과(고정 난수로 배율만 비교) ──
    const realRandom = Math.random; Math.random = () => 0.5;
    S.setG(S.freshState()); const G = S.G();
    const mk = (id, ability) => { const m = S.makeMon(id, 50); m.ability = ability; m.hp = m.maxHp; return m; };
    const def = () => { const d = S.makeMon("terrapin", 50); d.hp = d.maxHp; d.ability = "guts"; return d; };

    // toughclaws: 물리 기술 ×1.2 (같은 정령, 특성만 다름)
    G.weather = null;
    const phys = S.MOVES.tackle;
    const dT = S.damage(mk("wyverna", "toughclaws"), def(), phys).dmg;
    const dN = S.damage(mk("wyverna", "guts"), def(), phys).dmg;
    out.toughclaws = dT > dN && Math.abs(dT / dN - 1.2) < 0.06;

    // sandforce: 모래바람일 때 바위 기술 ×1.3 (모래바람 고정)
    G.weather = "sand";
    const rock = S.MOVES.rockthrow;
    const dSF = S.damage(mk("sandwhirl", "sandforce"), def(), rock).dmg;
    const dBase = S.damage(mk("sandwhirl", "guts"), def(), rock).dmg;
    out.sandforce = dSF > dBase && Math.abs(dSF / dBase - 1.3) < 0.06;
    // 모래바람이 아니면 부스트 없음
    G.weather = null;
    const dSFclear = S.damage(mk("sandwhirl", "sandforce"), def(), rock).dmg;
    const dBaseClear = S.damage(mk("sandwhirl", "guts"), def(), rock).dmg;
    out.sandforceOffWx = Math.abs(dSFclear / dBaseClear - 1) < 0.02;

    // slushrush: 싸라기눈일 때 속도 2배 (effSpd)
    G.weather = "hail";
    const fast = mk("snowl", "slushrush"); const norm = mk("snowl", "guts");
    out.slushrush = Math.abs(S.effSpd(fast) / S.effSpd(norm) - 2) < 0.02;
    G.weather = null;
    out.slushrushOffWx = Math.abs(S.effSpd(mk("snowl", "slushrush")) / S.effSpd(mk("snowl", "guts")) - 1) < 0.02;

    Math.random = realRandom;
    return out;
  });

  ok(r.moves.powergem, "파워젬: 바위·특수·80");
  ok(r.moves.dragonrush, "용의돌진: 용·물리·95");
  ok(r.moves.iciclecrash, "고드름떨구기: 얼음·물리");
  ok(r.moves.shadowclaw, "섀도클로: 고스트·물리·급소↑");
  ok(r.learnable, "신규 기술 4종이 전부 학습 가능(종 ≥1)");
  ok(r.abNamed, "신규 특성 3종 이름·설명 존재");
  ok(r.assign, "종 배정: 모래의힘(사막휠·굴왕)·눈헤치기(눈올빼·얼음정)·억센발톱(비룡·꼬마룡)");
  ok(r.toughclaws, "억센발톱: 물리 기술 ×1.2");
  ok(r.sandforce, "모래의힘: 모래바람 시 바위 기술 ×1.3");
  ok(r.sandforceOffWx, "모래의힘: 모래바람이 아니면 부스트 없음");
  ok(r.slushrush, "눈헤치기: 싸라기눈 시 속도 2배");
  ok(r.slushrushOffWx, "눈헤치기: 싸라기눈이 아니면 속도 그대로");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 신규 기술·특성 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
