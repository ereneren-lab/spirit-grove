// 회귀 — 신규 강철 정령 라인(쇳덩이 orelet → 무쇠병 ironforge → 강철거병 steelgolem).
// 희소 타입(강철) 보강용 3단 진화 라인. 데이터·진화·기술·서식지·아트·도감을 전부 검증한다.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(() => {
    const S = window.SG, F = S.flow; const out = {};
    const ore = S.byId("orelet"), forge = S.byId("ironforge"), golem = S.byId("steelgolem");
    // 1) 종 데이터 실존 + 전부 순수 강철 타입
    out.exist = !!ore && !!forge && !!golem;
    out.pureSteel = [ore, forge, golem].every(d => d && d.type === "steel" && !d.type2);
    // 2) 3단 진화 사슬: 쇳덩이 →(Lv18) 무쇠병 →(Lv36) 강철거병
    out.evo1 = ore && ore.evolveTo === "ironforge" && ore.evolveLv === 18;
    out.evo2 = forge && forge.evolveTo === "steelgolem" && forge.evolveLv === 36;
    out.evo3end = golem && !golem.evolveTo; // 최종 진화형은 더 진화하지 않는다
    out.baseChain = S.baseForm("ironforge") === "orelet" && S.baseForm("steelgolem") === "orelet";
    // 3) 스탯 단조 증가(진화할수록 강해진다) — 총합 기준
    const sum = d => Object.values(d.base).reduce((a, v) => a + v, 0);
    out.statGrows = sum(ore) < sum(forge) && sum(forge) < sum(golem);
    // 4) 모든 기술이 MOVES에 실존
    out.movesExist = [ore, forge, golem].every(d =>
      (d.moves || []).concat((d.learn || []).map(l => l[1])).every(mv => !!S.MOVES[mv]));
    // 5) FLAVOR 커버 + 진화 시 키·무게 증가
    const FLV = S.FLAVOR;
    out.flavor = !!(FLV.orelet && FLV.ironforge && FLV.steelgolem);
    out.grows = FLV && FLV.ironforge.h > FLV.orelet.h && FLV.steelgolem.h > FLV.ironforge.h
      && FLV.ironforge.w > FLV.orelet.w && FLV.steelgolem.w > FLV.ironforge.w;
    // 6) 서식지: 야생 2종(쇳덩이·무쇠병)은 광산+수정동굴 풀 소속, 거병은 진화 전용(NO_WILD)
    const pools = F.ENC_POOLS;
    out.wildPlaced = (pools.mine || []).includes("orelet") && (pools.mine || []).includes("ironforge")
      && (pools.crystalcave || []).includes("orelet") && (pools.crystalcave || []).includes("ironforge");
    out.golemNoWild = !Object.values(pools).some(arr => (arr || []).includes("steelgolem"));
    // 7) 강철 타입 실제 보강 — 순수 강철 종 수가 늘었다(코글릿 라인 외 신규 라인)
    out.steelCount = S.DEX.filter(d => d.type === "steel" && !d.type2).length;
    // 8) 생성·특성 폴백
    S.setG(S.freshState());
    const m = S.makeMon("orelet", 20);
    out.ability = !!m.ability; // DEFAULT_ABILITY[steel] 폴백
    out.spawnStat = m.maxHp > 1; // 정상 스탯 산출(알 아님)
    // 9) 도감 상세가 3종 모두 크래시 없이 렌더 + 전용 페인트 아트(data:image) 인라인
    let artErr = null; let allPaint = true;
    try {
      ["orelet", "ironforge", "steelgolem"].forEach(id => {
        F.openDetail(id);
        const bd = document.querySelector("#dexDetailBody");
        if (!bd || bd.innerHTML.indexOf("data:image") < 0) allPaint = false;
      });
    } catch (e) { artErr = String(e); }
    const body = document.querySelector("#dexDetailBody");
    out.detailRenders = !artErr && !!(body && body.innerHTML && body.innerHTML.length > 100);
    // 10) 전용 아트 존재(절차적 폴백이 아니라 실제 페인트 아트가 인라인됨)
    out.paintArt = !artErr && allPaint;
    // 11) 실제 야생 조우로 등장(광산) — 대표 다수 시도
    S.setG(S.freshState()); let G = S.G(); G.party = [S.makeMon("foxfire", 40)];
    let sawOre = false;
    for (let i = 0; i < 300 && !sawOre; i++) {
      if (F.startMineEncounter) F.startMineEncounter();
      else if (F.startEncounterIn) F.startEncounterIn("mine");
      if (G.foe && (G.foe.id === "orelet" || G.foe.id === "ironforge")) sawOre = true;
      G.foe = null; G.inBattle = false;
    }
    out.wildAppears = sawOre;
    return out;
  });

  ok(r.exist, "신규 강철 3종 실존(쇳덩이·무쇠병·강철거병)");
  ok(r.pureSteel, "전부 순수 강철 타입(희소 타입 보강)");
  ok(r.evo1 && r.evo2 && r.evo3end, "3단 진화: 쇳덩이 →(Lv18) 무쇠병 →(Lv36) 강철거병");
  ok(r.baseChain, "baseForm 사슬이 전부 쇳덩이로 수렴");
  ok(r.statGrows, "진화할수록 스탯 총합 단조 증가");
  ok(r.movesExist, "세 종의 모든 기술이 MOVES에 실존");
  ok(r.flavor && r.grows, "FLAVOR 커버 + 진화 시 키·무게 단조 증가");
  ok(r.wildPlaced && r.golemNoWild, "야생 2종은 광산·수정동굴 풀 · 거병은 진화 전용(NO_WILD)");
  ok(r.steelCount >= 4, `순수 강철 종 보강 확인 (1종 → ${r.steelCount}종)`);
  ok(r.ability && r.spawnStat, "특성 폴백(steel) + 정상 스탯 산출");
  ok(r.detailRenders, "도감 상세 3종 크래시 없이 렌더");
  ok(r.paintArt, "전용 페인트 아트 3종 인라인(절차적 폴백 아님)");
  ok(r.wildAppears, "광산 야생 조우에 실제로 등장한다");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 신규 강철 정령 라인 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
