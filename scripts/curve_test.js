// 난이도 커브 회귀 테스트: 게이트 램프의 단조성/점프 상한, 야생 하한 단조성,
// 그리고 그라인딩 양과 무관한 레벨 수렴(끌개)이 유지되는지 못박는다.
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const errs = [];
const dom = new JSDOM(fs.readFileSync(process.argv[2], "utf8"), {
  runScripts: "dangerously", pretendToBeVisual: true,
  virtualConsole: new VirtualConsole().on("jsdomError", e => errs.push(e.message)),
});
const w = dom.window;
const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

setTimeout(() => {
  if (errs.length) { console.log("❌ 로드 에러:", errs[0]); process.exit(1); }
  const SG = w.SG, DIFF = SG.DIFF, FLOOR = SG.flow.WILD_FLOOR, region = SG.flow.region;
  const ace = k => Math.max(...SG.TRAINERS[k].team.map(t => t[1]));
  const H = 50;

  console.log("[1] 야생 하한(=앵커) 단조 증가");
  let mono = true; for (let i = 1; i < FLOOR.length; i++) if (FLOOR[i] <= FLOOR[i - 1]) mono = false;
  ok(mono, "WILD_FLOOR = [" + FLOOR.join(",") + "] 단조 증가");

  console.log("[2] 메인 게이트 램프: 단조 + 점프 상한(≤8)");
  const chain = ["1", "2", "3", "4", "X"];
  let prev = 0, rampOk = true, jumpOk = true;
  for (const k of chain) {
    const a = ace(k);
    if (a <= prev) rampOk = false;
    if (prev && a - prev > 8) jumpOk = false;
    prev = a;
  }
  ok(rampOk, `체육관1~4→군주 에이스 단조 증가 (${chain.map(ace).join(" → ")})`);
  ok(jumpOk, "게이트 간 점프 모두 ≤8 (절벽 없음)");

  console.log("[3] 폭주 방지: 과다 그라인딩(2.5≈100전투)해도 게이트를 압도하지 못함");
  const depthAt = y => (H - 1 - y) / (H - 1);
  const wildLevel = (avg, y) => Math.max(2, Math.min(58, Math.round(Math.max(avg, FLOOR[region(y)] || 0) + depthAt(y) * 4) + DIFF.normal.lvl));
  const xpMult = (lv, y) => { const o = lv - (FLOOR[region(y)] || 0); return o < 0 ? 1.4 : o <= 2 ? 1.0 : o <= 5 ? 0.45 : 0.15; };
  const gates = [["체1", 43, ace("1")], ["체2", 35, ace("2")], ["체3", 26, ace("3")], ["체4", 17, ace("4")], ["군주", 8, ace("X")]];
  function sim(enc) {
    let lv = 5, xp = 0, gi = 0; const arr = {};
    for (let y = 48; y >= 8; y--) {
      while (gi < gates.length && y === gates[gi][1]) { arr[gates[gi][0]] = lv + xp / (lv * 30); gi++; }
      const n = Math.floor(enc) + ((y * 997 % 100) / 100 < enc - Math.floor(enc) ? 1 : 0);
      for (let k = 0; k < n; k++) { xp += Math.floor((wildLevel(lv, y) * 15 + 11) * xpMult(lv, y)); while (xp >= lv * 30 && lv < 60) { xp -= lv * 30; lv++; } }
    }
    while (gi < gates.length) { arr[gates[gi][0]] = lv + xp / (lv * 30); gi++; }
    return arr;
  }
  // 핵심 보장: 예전엔 100전투면 군주 도착 레벨이 59(에이스38 +21, 완전 시시)였다.
  // 끌개가 이 폭주를 막는다 — 어떤 게이트도 에이스+6 을 넘지 않아야 한다.
  const heavy = sim(2.5);
  for (const [name, , a] of gates) {
    const d = heavy[name] - a;
    ok(d <= 6, `${name}: 과다 그라인딩 도착 ${heavy[name].toFixed(1)} ≤ 에이스 ${a}+6 (격차 ${d.toFixed(1)})`);
  }

  console.log("[4] 메인 게이트가 '벽'도 '시시'도 아님 (보통 플레이 기준 ±4)");
  const mod = sim(1.1);
  for (const [name, , a] of gates) {
    const d = mod[name] - a;
    ok(Math.abs(d) <= 4.5, `${name}: 리더 에이스 ${a} vs 도착 ${mod[name].toFixed(1)} (격차 ${d.toFixed(1)})`);
  }

  console.log("[5] 초반 조우 완화: 마을 직후 야생이 스타터를 압도하지 않는다");
  // 마을을 갓 나선 플레이어(스타터 Lv5)가 지역1에서 만나는 야생이 +6 이상이면 첫 구간이 벽이 된다.
  // 실측으로 확인된 문제: 하한 9이던 시절 지역1 첫 야생 승률이 24%였다(→ 7로 낮춰 41%).
  const region1Wild = wildLevel(5, 44);   // 지역1(y=44), 파티 평균 = 스타터 Lv5
  // ⚠️ 임계값 +3: 하한 9이던 시절 지역1 야생이 Lv9(+4)였고 승률 24%였다. +3(Lv8)이면 catch한다.
  //    "+5까지 허용"으론 옛 값을 못 잡는다 — 레벨차는 작아 보여도 저레벨은 승률 낙폭이 크다(실측 기반).
  ok(region1Wild - 5 <= 3, `지역1 첫 야생 Lv${region1Wild} — 스타터 Lv5 대비 +${region1Wild-5} (≤+3, 벽 방지)`);
  // 마을(지역0)은 스타터와 대등해야 한다(첫 전투가 코치와 함께 나오는 곳)
  ok(wildLevel(5, 48) <= 7, `마을 야생 Lv${wildLevel(5,48)} — 스타터와 대등(≤7)`);

  // ⚠️ wildLevel(위 모델)은 진화형 레벨 보너스(tier2 +1~3, tier3 +2~4)를 반영하지 않는다.
  //    그래서 "지역1 Lv7"로 통과해도 실게임에선 진화형 야생이 Lv8~10으로 튀어 벽이 됐다(실측).
  //    → pickWild를 직접 뽑아 초반(스타터 Lv5) 파티가 진화형 야생을 만나지 않는지 못박는다.
  console.log("[6] 초반 진화형 야생 차단: 갓 나선 파티는 base형만 만난다");
  const pickWild = SG.flow.pickWild, DEX = SG.DEX, tierOf = id => (DEX.find(d => d.id === id) || {}).tier;
  const al1 = Math.max(5, FLOOR[1]);   // 지역1 첫 조우 기준레벨 = max(스타터5, 하한7)
  const dep1 = depthAt(44);
  let evolvedSeen = 0; const N = 4000;
  for (let i = 0; i < N; i++) { const sp = pickWild(al1, dep1); if ((tierOf(sp.id) || 1) >= 2) evolvedSeen++; }
  ok(evolvedSeen === 0, `지역1 야생 ${N}회 표본에 진화형(tier≥2) 0마리 (실측 ${evolvedSeen})`);
  // 반대 위생검사: 파티를 Lv9까지 키우면 진화형이 다시 등장해야 한다(영구 봉쇄가 아니라 완급).
  const al9 = Math.max(9, FLOOR[1]); let evolvedAt9 = 0;
  for (let i = 0; i < N; i++) { const sp = pickWild(al9, dep1); if ((tierOf(sp.id) || 1) >= 2) evolvedAt9++; }
  ok(evolvedAt9 > 0, `Lv9 파티엔 진화형 야생이 다시 등장(완급이지 영구봉쇄 아님) (${evolvedAt9}/${N})`);

  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 난이도 커브 전부 통과");
  process.exit(process.exitCode || 0);
}, 2500);
