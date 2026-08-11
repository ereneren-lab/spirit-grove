// 대사 이름 중복 제거 회귀 테스트: 이름 라벨 + "이름: 본문"이 겹쳐 이름이 두 번
// 나오던 버그(트레이너/NPC). stripNamePrefix가 접두사만 벗기고 서술형은 안 건드리는지.
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
  const S = w.SG.stripNamePrefix;

  ok(S("벌레소년 메아", "벌레소년 메아: 내 정령들 좀 봐줄래?") === "내 정령들 좀 봐줄래?", "1인칭 대사: '이름:' 접두사 제거");
  ok(S("라이벌 카이", "라이벌 카이: 또 보네") === "또 보네", "NPC 대사: 접두사 제거");
  ok(S("탐험가 미루", "트레이너 미루가 길을 막아섰다!") === "트레이너 미루가 길을 막아섰다!", "3인칭 서술형: 그대로 유지");
  ok(S("엄마", "드디어 떠나는 날이구나") === "드디어 떠나는 날이구나", "접두사 없는 대사: 그대로");
  ok(S("", "아무 대사") === "아무 대사", "이름 없으면 그대로(안전)");
  // 실제 트레이너 데이터 전수: intro에 "이름:" 접두사가 남아 라벨과 겹치는 게 없는지
  const T = w.SG.TRAINERS;
  let dupCount = 0;
  for (const k in T) { const tr = T[k]; if (!tr.intro) continue; const cleaned = S(tr.name, tr.intro); if (cleaned.indexOf(tr.name + ":") === 0) dupCount++; }
  ok(dupCount === 0, `전체 트레이너 intro에서 이름 중복 0건 (검사 ${Object.keys(T).length}명)`);

  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 대사 이름 중복 제거 통과");
  process.exit(process.exitCode || 0);
}, 2500);
