// 회귀 — 시야 트레이너(t-시리즈) 레벨 램프가 북진(y↓) 방향으로 "뒤로 꺾이지 않는가".
//
// 왜 있나
//   트레이너들은 각 지역을 지나 게이트로 오르는 징검다리다. 이미 Lv15 트레이너를 이겼는데
//   바로 다음에 Lv12 트레이너가 나오면 그 전투는 시시하다(경험상 "완급이 지그재그"). 실제로
//   t20(숲)·t21(깊은숲)이 앞 트레이너보다 3레벨 낮아 '이미 더 센' 무의미 전투였다 → 평탄화.
//
// 무엇을 단정하나 (클러스터에 견고한 형태)
//   각 트레이너의 에이스는 **자기보다 엄격히 높은 y(=먼저 지나온 자리)** 의 트레이너 최대
//   에이스보다 2 넘게 낮으면 안 된다. 같은 y의 트레이너끼리는 비교하지 않아(같은 자리 = 순서
//   임의) 지역 내 다수 배치나 의도적 난이도 분산은 허용한다. "이미 클리어한 구간보다 3+ 낮은
//   트레이너"만 잡는다.
//
// ⚠️ 게이트(체육관) 램프 자체는 curve_test[2]가, 도착 승률은 balance_test가 지킨다. 이건 그
//    사이를 잇는 시야 트레이너의 국소 역행만 본다.
const { chromium } = require("playwright"); const path = require("path");
const TOL = 2;   // 허용 역행 폭(이보다 크게 낮으면 실패)
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const R = await p.evaluate(() => {
    const S = window.SG, T = S.TRAINERS, N = S.NPCS || [];
    const region = y => y >= 47 ? 0 : y >= 41 ? 1 : y >= 34 ? 2 : y >= 27 ? 3 : y >= 20 ? 4 : y >= 12 ? 5 : 6;
    const rows = N.filter(n => /^t\d+$/.test(n.id || "")).map(n => {
      const tr = T[n.battleKey] || {}; const team = tr.team || [];
      return { id: n.id, y: n.y, reg: region(n.y), ace: team.length ? Math.max(...team.map(t => t[1])) : 0 };
    }).filter(r => r.ace > 0);
    return rows;
  });

  const RN = ["마을", "초원", "숲", "깊은숲", "수정호수", "고원", "제단"];
  // 각 트레이너: 자기보다 엄격히 높은 y의 최대 에이스(=이미 지나온 구간의 최고치)
  const dips = [];
  for (const t of R) {
    const prior = R.filter(o => o.y > t.y).map(o => o.ace);
    if (!prior.length) continue;                 // 가장 남쪽(첫) 트레이너는 기준 없음
    const priorMax = Math.max(...prior);
    const dip = priorMax - t.ace;
    if (dip > TOL) dips.push({ ...t, priorMax, dip });
  }

  // [1] 지역별 최대 에이스는 지역 순서대로 단조 증가(큰 그림 위생 검사)
  const regMax = {};
  for (const t of R) regMax[t.reg] = Math.max(regMax[t.reg] || 0, t.ace);
  const regs = Object.keys(regMax).map(Number).sort((a, b) => a - b);
  let mono = true; for (let i = 1; i < regs.length; i++) if (regMax[regs[i]] < regMax[regs[i - 1]]) mono = false;
  ok(mono, `지역별 시야 트레이너 최대 에이스 단조 증가 (${regs.map(r => `${RN[r]}${regMax[r]}`).join(" → ")})`);

  // [2] 국소 역행: 이미 지나온 구간의 최고 에이스보다 3+ 낮은 트레이너 없음
  ok(dips.length === 0,
    `이미 지나온 자리보다 ${TOL}레벨 초과로 낮은 시야 트레이너 없음` +
    (dips.length ? " — " + dips.map(d => `${d.id}(${RN[d.reg]} y${d.y}) 에이스${d.ace} < 앞선 최고 ${d.priorMax}−${TOL}`).join(" / ") : ""));

  ok(errs.length === 0, `런타임 에러 0 (${errs.length})`);
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 시야 트레이너 레벨 램프 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
