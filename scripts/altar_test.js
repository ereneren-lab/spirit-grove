// 숲의 군주 경로 복구 검증: 제단 A 타일이 클라이맥스 → 포스트게임 순서로 흐르는가,
// 그리고 숲의 군주 보스가 실제로 시작되어 EPILOGUE/재대결 사슬을 되살리는가.
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const errors = [];
const dom = new JSDOM(fs.readFileSync(process.argv[2], "utf8"), {
  runScripts: "dangerously", pretendToBeVisual: true,
  virtualConsole: new VirtualConsole().on("jsdomError", e => errors.push(e.message)),
});
const w = dom.window;
const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

setTimeout(() => {
  if (errors.length) { console.log("❌ 로드 에러:", errors[0]); process.exit(1); }
  const SG = w.SG, F = SG.flow;

  const G = SG.freshState();
  G.party = [SG.makeMon("blazelion", 34)];
  SG.setG(G);

  console.log("[1] 제단 진행 순서: 군주 → 흑요마 → 오로르 → 고요");
  ok(F.altarStage() === "lord", "인장 4조각 직후 A 타일 = 숲의 군주(lord)");
  G.badge = true; G.defeated.add("X");                       // 군주 격파
  ok(F.altarStage() === "shadow", "군주 격파 후 = 흑요마(shadow)");
  G.shadowDone = true;
  ok(F.altarStage() === "dawn", "흑요마 격파 후 = 오로르(dawn)");
  G.dawnDone = true;
  ok(F.altarStage() === "quiet", "둘 다 격파 후 = 고요(quiet)");

  console.log("[2] 숲의 군주 보스가 실제로 시작되는가");
  const G2 = SG.freshState();
  G2.party = [SG.makeMon("blazelion", 34)];
  G2.badges = ["1", "2", "3", "4"];
  SG.setG(G2);
  ok(F.altarStage() === "lord", "인장 4조각 플레이어에게 lord가 뜬다");
  F.startTrainer("X");
  ok(G2.trainer && G2.trainer.key === "X", "숲의 군주 전투가 시작됨 (trainer.key=X)");
  ok(G2.trainer.boss === true, "boss 플래그가 켜져 있다 → 승리 시 EPILOGUE/인장 발동");
  ok(SG.TRAINERS.X.outro.includes("인장을 네게 맡기마"), "클라이맥스 대사가 연결돼 있다");

  console.log("[3] 이미 진행한 세이브: 포스트게임만 남은 상태");
  const G3 = SG.freshState();
  G3.party = [SG.makeMon("blazelion", 40)];
  G3.badge = true; G3.defeated.add("X"); G3.shadowDone = true; G3.dawnDone = true;
  SG.setG(G3);
  ok(F.altarStage() === "quiet", "모든 보스 격파한 세이브는 조용한 제단");

  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 숲의 군주 복구 전부 통과");
  process.exit(process.exitCode || 0);
}, 2500);
