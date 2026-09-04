// 회귀 — 신규 에스퍼 예지 라인(점술구슬 mystorb → 천리안 seergaze → 심안자 omniseer).
// 희소 타입(에스퍼) 보강용 순수 psychic 3단 라인. 여우 라인(psykit)과 대비되는 예지자 계열.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(() => {
    const S = window.SG, F = S.flow; const out = {};
    const a = S.byId("mystorb"), c = S.byId("seergaze"), z = S.byId("omniseer");
    out.exist = !!a && !!c && !!z;
    out.purePsychic = [a, c, z].every(d => d && d.type === "psychic" && !d.type2);
    out.evo1 = a && a.evolveTo === "seergaze" && a.evolveLv === 16;
    out.evo2 = c && c.evolveTo === "omniseer" && c.evolveLv === 36;
    out.evo3end = z && !z.evolveTo;
    out.baseChain = S.baseForm("seergaze") === "mystorb" && S.baseForm("omniseer") === "mystorb";
    out.special = [a, c, z].every(d => d.base.spa > d.base.atk);
    const sum = d => Object.values(d.base).reduce((s, v) => s + v, 0);
    out.statGrows = sum(a) < sum(c) && sum(c) < sum(z);
    // 밸런스 정합: 최종형 총합이 기존 순수 에스퍼 최종형 mystfox(190) 이하
    out.finalInBand = sum(z) <= sum(S.byId("mystfox"));
    out.movesExist = [a, c, z].every(d =>
      (d.moves || []).concat((d.learn || []).map(l => l[1])).every(mv => !!S.MOVES[mv]));
    const FLV = S.FLAVOR;
    out.flavor = !!(FLV.mystorb && FLV.seergaze && FLV.omniseer);
    out.grows = FLV && FLV.seergaze.h > FLV.mystorb.h && FLV.omniseer.h > FLV.seergaze.h
      && FLV.seergaze.w > FLV.mystorb.w && FLV.omniseer.w > FLV.seergaze.w;
    const pools = F.ENC_POOLS;
    out.wildPlaced = (pools.fairyglade || []).includes("mystorb") && (pools.fairyglade || []).includes("seergaze")
      && (pools.crystalcave || []).includes("mystorb") && (pools.crystalcave || []).includes("seergaze");
    out.finalNoWild = !Object.values(pools).some(arr => (arr || []).includes("omniseer"));
    out.psyPure = S.DEX.filter(d => d.type === "psychic" && !d.type2).length;
    S.setG(S.freshState());
    const m = S.makeMon("mystorb", 20);
    out.ability = !!m.ability; out.spawnStat = m.maxHp > 1;
    let artErr = null, allPaint = true;
    try {
      ["mystorb", "seergaze", "omniseer"].forEach(id => {
        F.openDetail(id);
        const bd = document.querySelector("#dexDetailBody");
        if (!bd || bd.innerHTML.indexOf("data:image") < 0) allPaint = false;
      });
    } catch (e) { artErr = String(e); }
    const body = document.querySelector("#dexDetailBody");
    out.detailRenders = !artErr && !!(body && body.innerHTML && body.innerHTML.length > 100);
    out.paintArt = !artErr && allPaint;
    S.setG(S.freshState()); let G = S.G(); G.party = [S.makeMon("foxfire", 40)];
    let saw = false;
    for (let i = 0; i < 300 && !saw; i++) {
      if (F.startFairyEncounter) F.startFairyEncounter();
      if (G.foe && (G.foe.id === "mystorb" || G.foe.id === "seergaze")) saw = true;
      G.foe = null; G.inBattle = false;
    }
    out.wildAppears = saw;
    return out;
  });

  ok(r.exist, "신규 에스퍼 3종 실존(점술구슬·천리안·심안자)");
  ok(r.purePsychic, "전부 순수 에스퍼 타입(희소 타입 보강)");
  ok(r.evo1 && r.evo2 && r.evo3end, "3단 진화: 점술구슬 →(Lv16) 천리안 →(Lv36) 심안자");
  ok(r.baseChain, "baseForm 사슬이 전부 점술구슬로 수렴");
  ok(r.special, "특수 어태커 정체성(spa>atk)");
  ok(r.statGrows, "진화할수록 스탯 총합 단조 증가");
  ok(r.finalInBand, "최종형 총합이 기존 순수 에스퍼 최종형(mystfox 190) 이하 — 밸런스 정합");
  ok(r.movesExist, "세 종의 모든 기술이 MOVES에 실존(신규 무브 없음)");
  ok(r.flavor && r.grows, "FLAVOR 커버 + 진화 시 키·무게 단조 증가");
  ok(r.wildPlaced && r.finalNoWild, "야생 2종은 요정의뜰·수정동굴 풀 · 심안자는 진화 전용(NO_WILD)");
  ok(r.psyPure >= 4, `순수 에스퍼 종 보강 확인 (2종 → ${r.psyPure}종)`);
  ok(r.ability && r.spawnStat, "특성 폴백(psychic) + 정상 스탯 산출");
  ok(r.detailRenders, "도감 상세 3종 크래시 없이 렌더");
  ok(r.paintArt, "전용 페인트 아트 3종 인라인");
  ok(r.wildAppears, "요정의 뜰 야생 조우에 실제로 등장한다");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 신규 에스퍼 예지 라인 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
