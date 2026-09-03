// 회귀 — 신규 벌레 물리 라인(애사마귀 mantlet → 낫사마귀 scythel → 대검사마귀 reapmantis).
// 희소 타입(벌레) 보강용 순수 bug 3단 라인. sporelet 나방(특수)과 대비되는 사마귀(물리·고속·크리).
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(() => {
    const S = window.SG, F = S.flow; const out = {};
    const a = S.byId("mantlet"), c = S.byId("scythel"), z = S.byId("reapmantis");
    // 1) 종 실존 + 전부 순수 벌레 타입
    out.exist = !!a && !!c && !!z;
    out.pureBug = [a, c, z].every(d => d && d.type === "bug" && !d.type2);
    // 2) 3단 진화 사슬
    out.evo1 = a && a.evolveTo === "scythel" && a.evolveLv === 16;
    out.evo2 = c && c.evolveTo === "reapmantis" && c.evolveLv === 34;
    out.evo3end = z && !z.evolveTo;
    out.baseChain = S.baseForm("scythel") === "mantlet" && S.baseForm("reapmantis") === "mantlet";
    // 3) 물리 어태커 정체성: 전 단계 atk>spa (sporelet 특수형과 대비)
    out.physical = [a, c, z].every(d => d.base.atk > d.base.spa);
    // 4) 스탯 총합 단조 증가
    const sum = d => Object.values(d.base).reduce((s, v) => s + v, 0);
    out.statGrows = sum(a) < sum(c) && sum(c) < sum(z);
    // 5) 모든 기술이 MOVES에 실존 (신규 무브 없이 기존 자산만)
    out.movesExist = [a, c, z].every(d =>
      (d.moves || []).concat((d.learn || []).map(l => l[1])).every(mv => !!S.MOVES[mv]));
    // 6) FLAVOR 커버 + 진화 시 키·무게 단조 증가
    const FLV = S.FLAVOR;
    out.flavor = !!(FLV.mantlet && FLV.scythel && FLV.reapmantis);
    out.grows = FLV && FLV.scythel.h > FLV.mantlet.h && FLV.reapmantis.h > FLV.scythel.h
      && FLV.scythel.w > FLV.mantlet.w && FLV.reapmantis.w > FLV.scythel.w;
    // 7) 서식지: 야생 2종(애사마귀·낫사마귀)은 골짜기·언덕길 풀, 대검사마귀는 진화 전용(NO_WILD)
    const pools = F.ENC_POOLS;
    out.wildPlaced = (pools.mosshollow || []).includes("mantlet") && (pools.mosshollow || []).includes("scythel")
      && (pools.hillpath || []).includes("mantlet") && (pools.hillpath || []).includes("scythel");
    out.finalNoWild = !Object.values(pools).some(arr => (arr || []).includes("reapmantis"));
    // 8) 순수 벌레 종 실제 보강 (기존 sporelet 1종 → 4종)
    out.bugPure = S.DEX.filter(d => d.type === "bug" && !d.type2).length;
    // 9) 생성·특성 폴백·정상 스탯
    S.setG(S.freshState());
    const m = S.makeMon("mantlet", 20);
    out.ability = !!m.ability; out.spawnStat = m.maxHp > 1;
    // 10) 도감 상세 3종 크래시 없이 렌더 + 전용 아트(data:image) 인라인
    let artErr = null, allPaint = true;
    try {
      ["mantlet", "scythel", "reapmantis"].forEach(id => {
        F.openDetail(id);
        const bd = document.querySelector("#dexDetailBody");
        if (!bd || bd.innerHTML.indexOf("data:image") < 0) allPaint = false;
      });
    } catch (e) { artErr = String(e); }
    const body = document.querySelector("#dexDetailBody");
    out.detailRenders = !artErr && !!(body && body.innerHTML && body.innerHTML.length > 100);
    out.paintArt = !artErr && allPaint;
    // 11) 실제 야생 조우로 등장(골짜기)
    S.setG(S.freshState()); let G = S.G(); G.party = [S.makeMon("foxfire", 40)];
    let saw = false;
    for (let i = 0; i < 300 && !saw; i++) {
      if (F.startHollowEncounter) F.startHollowEncounter();
      if (G.foe && (G.foe.id === "mantlet" || G.foe.id === "scythel")) saw = true;
      G.foe = null; G.inBattle = false;
    }
    out.wildAppears = saw;
    return out;
  });

  ok(r.exist, "신규 벌레 3종 실존(애사마귀·낫사마귀·대검사마귀)");
  ok(r.pureBug, "전부 순수 벌레 타입(희소 타입 보강)");
  ok(r.evo1 && r.evo2 && r.evo3end, "3단 진화: 애사마귀 →(Lv16) 낫사마귀 →(Lv34) 대검사마귀");
  ok(r.baseChain, "baseForm 사슬이 전부 애사마귀로 수렴");
  ok(r.physical, "물리 어태커 정체성(atk>spa) — sporelet 특수형과 대비");
  ok(r.statGrows, "진화할수록 스탯 총합 단조 증가");
  ok(r.movesExist, "세 종의 모든 기술이 MOVES에 실존(신규 무브 없음)");
  ok(r.flavor && r.grows, "FLAVOR 커버 + 진화 시 키·무게 단조 증가");
  ok(r.wildPlaced && r.finalNoWild, "야생 2종은 골짜기·언덕길 풀 · 대검사마귀는 진화 전용(NO_WILD)");
  ok(r.bugPure >= 4, `순수 벌레 종 보강 확인 (1종 → ${r.bugPure}종)`);
  ok(r.ability && r.spawnStat, "특성 폴백(bug) + 정상 스탯 산출");
  ok(r.detailRenders, "도감 상세 3종 크래시 없이 렌더");
  ok(r.paintArt, "전용 페인트 아트 3종 인라인");
  ok(r.wildAppears, "골짜기 야생 조우에 실제로 등장한다");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 신규 벌레 물리 라인 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
