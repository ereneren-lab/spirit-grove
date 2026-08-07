// 첫 전투 코치 흐름 검증: 전투 시작 → 기술 메뉴 → 턴 후 포획 유도 → 1회성 확인
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
  G.party = [SG.makeMon("foxfire", 8)];        // 불
  G.foe = SG.makeMon("leafdrake", 8);          // 풀 → 불이 2배
  G.inBattle = true;
  SG.setG(G);

  console.log("[1] 첫 야생 전투 시작");
  F.setupBattleUI();
  const tip = d.getElementById("coachTip");
  ok(tip.style.display === "block", "코치 말풍선이 뜬다: “" + tip.textContent.slice(0, 28) + "…”");
  ok(!!d.querySelector('#mainMenu [data-act="fight"].coach-glow'), "‘⚔️ 공격’ 버튼이 하이라이트된다");

  console.log("[2] 기술 메뉴 진입");
  F.showMoves();
  const glowing = d.querySelector("#moveMenu .move-btn.coach-glow");
  ok(!!glowing, "상성 유리한 기술이 하이라이트된다: " + (glowing && glowing.textContent.trim().split("PP")[0]));
  ok(!!(glowing && glowing.querySelector(".eff-good")), "그 기술엔 실제로 ‘효과 굉장’ 태그가 붙어 있다");
  ok(tip.innerHTML.includes("2배"), "말풍선이 상성을 설명한다");

  console.log("[3] 상대 체력을 절반 아래로 → 턴 종료");
  G.foe.hp = Math.floor(G.foe.maxHp * 0.4);
  F.Coach.afterTurn();
  ok(!!d.querySelector('#mainMenu [data-act="catch"].coach-glow'), "‘🔮 포획’ 버튼으로 하이라이트가 옮겨간다");
  ok(tip.innerHTML.includes("포획 기회"), "말풍선이 포획을 유도한다");

  console.log("[4] 전투 종료 → 1회성 확인");
  F.Coach.finish();
  ok(tip.style.display === "none", "말풍선이 사라진다");
  ok(d.querySelectorAll(".coach-glow").length === 0, "하이라이트가 모두 제거된다");
  ok(G.questFlags.coach1 === 1, "저장 플래그가 찍힌다 (questFlags.coach1)");

  F.Coach.maybeStart();
  ok(tip.style.display === "none", "두 번째 전투에선 코치가 다시 뜨지 않는다");

  console.log("[5] 기존 세이브(이미 진행한 플레이어) 보호");
  const V = SG.freshState();
  V.party = [SG.makeMon("foxfire", 30)];
  V.foe = SG.makeMon("leafdrake", 30);
  V.caught = new Set(["foxfire", "shellow", "racoonmon"]);   // 이미 여러 마리 잡음
  V.inBattle = true;
  SG.setG(V);
  F.Coach.maybeStart();
  ok(tip.style.display === "none", "베테랑에겐 코치가 뜨지 않는다");
  ok(V.questFlags.coach1 === 1, "플래그만 조용히 찍고 넘어간다");

  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 코치 흐름 전부 통과");
  process.exit(process.exitCode || 0);
}, 2500);
