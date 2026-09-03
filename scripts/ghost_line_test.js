// 회귀 — 신규 고스트 특수 라인(저주탈 hexmask → 탈망령 wraithmask → 원귀탈 dreadmask).
// 희소 타입(고스트) 보강용 순수 ghost 3단 라인. 저주받은 탈이 원귀로 자라는 특수 어태커.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(() => {
    const S = window.SG, F = S.flow; const out = {};
    const a = S.byId("hexmask"), c = S.byId("wraithmask"), z = S.byId("dreadmask");
    out.exist = !!a && !!c && !!z;
    out.pureGhost = [a, c, z].every(d => d && d.type === "ghost" && !d.type2);
    out.evo1 = a && a.evolveTo === "wraithmask" && a.evolveLv === 16;
    out.evo2 = c && c.evolveTo === "dreadmask" && c.evolveLv === 36;
    out.evo3end = z && !z.evolveTo;
    out.baseChain = S.baseForm("wraithmask") === "hexmask" && S.baseForm("dreadmask") === "hexmask";
    // 특수 어태커 정체성: spa>atk (물리 사마귀와 대비)
    out.special = [a, c, z].every(d => d.base.spa > d.base.atk);
    const sum = d => Object.values(d.base).reduce((s, v) => s + v, 0);
    out.statGrows = sum(a) < sum(c) && sum(c) < sum(z);
    // 밸런스 정합: 최종형 총합이 비전설 tier3 상단(205) 이하
    out.finalInBand = sum(z) <= 205;
    out.movesExist = [a, c, z].every(d =>
      (d.moves || []).concat((d.learn || []).map(l => l[1])).every(mv => !!S.MOVES[mv]));
    const FLV = S.FLAVOR;
    out.flavor = !!(FLV.hexmask && FLV.wraithmask && FLV.dreadmask);
    out.grows = FLV && FLV.wraithmask.h > FLV.hexmask.h && FLV.dreadmask.h > FLV.wraithmask.h
      && FLV.wraithmask.w > FLV.hexmask.w && FLV.dreadmask.w > FLV.wraithmask.w;
    // 서식지: 야생 2종(저주탈·탈망령)은 달그림자골짜기·유적 풀, 원귀탈은 진화 전용(NO_WILD)
    const pools = F.ENC_POOLS;
    out.wildPlaced = (pools.mooncanyon || []).includes("hexmask") && (pools.mooncanyon || []).includes("wraithmask")
      && (pools.ruins || []).includes("hexmask") && (pools.ruins || []).includes("wraithmask");
    out.finalNoWild = !Object.values(pools).some(arr => (arr || []).includes("dreadmask"));
    // 순수 고스트 종 실제 보강
    out.ghostPure = S.DEX.filter(d => d.type === "ghost" && !d.type2).length;
    S.setG(S.freshState());
    const m = S.makeMon("hexmask", 20);
    out.ability = !!m.ability; out.spawnStat = m.maxHp > 1;
    let artErr = null, allPaint = true;
    try {
      ["hexmask", "wraithmask", "dreadmask"].forEach(id => {
        F.openDetail(id);
        const bd = document.querySelector("#dexDetailBody");
        if (!bd || bd.innerHTML.indexOf("data:image") < 0) allPaint = false;
      });
    } catch (e) { artErr = String(e); }
    const body = document.querySelector("#dexDetailBody");
    out.detailRenders = !artErr && !!(body && body.innerHTML && body.innerHTML.length > 100);
    out.paintArt = !artErr && allPaint;
    // 실제 야생 조우로 등장(달그림자 골짜기)
    S.setG(S.freshState()); let G = S.G(); G.party = [S.makeMon("foxfire", 40)];
    let saw = false;
    for (let i = 0; i < 300 && !saw; i++) {
      if (F.startMoonEncounter) F.startMoonEncounter();
      if (G.foe && (G.foe.id === "hexmask" || G.foe.id === "wraithmask")) saw = true;
      G.foe = null; G.inBattle = false;
    }
    out.wildAppears = saw;
    return out;
  });

  ok(r.exist, "신규 고스트 3종 실존(저주탈·탈망령·원귀탈)");
  ok(r.pureGhost, "전부 순수 고스트 타입(희소 타입 보강)");
  ok(r.evo1 && r.evo2 && r.evo3end, "3단 진화: 저주탈 →(Lv16) 탈망령 →(Lv36) 원귀탈");
  ok(r.baseChain, "baseForm 사슬이 전부 저주탈로 수렴");
  ok(r.special, "특수 어태커 정체성(spa>atk) — 물리 사마귀와 대비");
  ok(r.statGrows, "진화할수록 스탯 총합 단조 증가");
  ok(r.finalInBand, "최종형 총합이 비전설 tier3 상단(205) 이하 — 밸런스 정합");
  ok(r.movesExist, "세 종의 모든 기술이 MOVES에 실존(신규 무브 없음)");
  ok(r.flavor && r.grows, "FLAVOR 커버 + 진화 시 키·무게 단조 증가");
  ok(r.wildPlaced && r.finalNoWild, "야생 2종은 달그림자골짜기·유적 풀 · 원귀탈은 진화 전용(NO_WILD)");
  ok(r.ghostPure >= 4, `순수 고스트 종 보강 확인 (2종 → ${r.ghostPure}종)`);
  ok(r.ability && r.spawnStat, "특성 폴백(ghost) + 정상 스탯 산출");
  ok(r.detailRenders, "도감 상세 3종 크래시 없이 렌더");
  ok(r.paintArt, "전용 페인트 아트 3종 인라인");
  ok(r.wildAppears, "달그림자 골짜기 야생 조우에 실제로 등장한다");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 신규 고스트 특수 라인 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
