// 목표 트래커 검증: 진행 사슬(체육관 4 → 리그 → 챔피언 → 도감)이 상태를 정확히 따라가는가
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const errors = [];
const dom = new JSDOM(fs.readFileSync(process.argv[2], "utf8"), {
  runScripts: "dangerously", pretendToBeVisual: true,
  virtualConsole: new VirtualConsole().on("jsdomError", e => errors.push(e.message)),
});
const w = dom.window, d = w.document;
const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

setTimeout(() => {
  if (errors.length) { console.log("❌ 로드 에러:", errors[0]); process.exit(1); }
  const SG = w.SG, F = SG.flow;

  const G = SG.freshState();
  G.party = [SG.makeMon("foxfire", 5)];
  SG.setG(G);

  const track = d.getElementById("goalTrack");
  const nm = () => d.getElementById("goalName").textContent;
  const sub = () => d.getElementById("goalSub").textContent;

  console.log("[1] 뱃지 0개 — 첫 체육관을 가리키는가");
  F.updateGoal();
  ok(track.classList.contains("on"), "트래커가 화면에 뜬다");
  ok(nm() === "초원 체육관", "목표: " + nm());
  ok(sub().includes("0/4"), "인장 진행도 표시: " + sub());
  ok(/\d+칸/.test(sub()), "목표까지 거리 표시됨");
  const g1 = F.currentGoal();
  ok(g1.x === 8 && g1.y === 43, "좌표가 실제 체육관 타일(8,43)과 일치");

  console.log("[2] 뱃지를 하나씩 획득 — 다음 체육관으로 넘어가는가");
  const expect = [["1", "숲 체육관", 35], ["2", "수정 호수 체육관", 26], ["3", "고원 체육관", 17]];
  for (const [badge, name, y] of expect) {
    G.badges.push(badge);
    const g = F.currentGoal();
    ok(g.name === name && g.y === y, `뱃지 ${G.badges.length}개 → ${g.name} (8,${g.y})`);
  }

  console.log("[3] 인장 4조각 — 리그가 열리는가");
  G.badges.push("4");
  const gl = F.currentGoal();
  ok(gl.name === "정령 리그", "목표: " + gl.name);
  ok(gl.x === 18 && gl.y === 9, "좌표가 실제 리그 입구 U 타일(18,9)과 일치");

  console.log("[4] 챔피언 달성 — 최종 목표로 전환");
  G.champion = true;
  const gc = F.currentGoal();
  ok(gc.name === "도감 완성", "목표: " + gc.name);
  ok(gc.done === true && gc.x === null, "방향이 아닌 수집 현황을 보여준다");
  F.updateGoal();
  ok(track.classList.contains("done"), "트로피 스타일로 바뀐다");
  ok(sub().includes("/86"), "도감 진행도: " + sub());

  console.log("[5] 전투 중엔 숨는가");
  G.inBattle = true; F.updateGoal();
  ok(!track.classList.contains("on"), "전투 중 트래커 숨김");

  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 목표 트래커 전부 통과");
  process.exit(process.exitCode || 0);
}, 2500);
