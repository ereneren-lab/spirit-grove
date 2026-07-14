// dist를 실제로 로드해서 런타임 에러를 잡고, 게임 흐름을 조금 돌려본다.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(process.argv[2], "utf8");
const errors = [];

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole: new (require("jsdom").VirtualConsole)()
    .on("jsdomError", e => errors.push("jsdomError: " + (e.message || e)))
    .on("error", (...a) => errors.push("console.error: " + a.join(" "))),
});

const w = dom.window;
setTimeout(() => {
  if (errors.length) {
    console.log("❌ 로드 중 에러 " + errors.length + "건:");
    errors.slice(0, 5).forEach(e => console.log("   " + e.slice(0, 160)));
    process.exit(1);
  }
  const SG = w.SG;
  if (!SG) { console.log("❌ window.SG 없음 — 스크립트가 끝까지 실행되지 않음"); process.exit(1); }

  console.log("✅ 페이지 로드: 런타임 에러 0건");
  console.log("   DEX " + SG.DEX.length + "종 · MOVES " + Object.keys(SG.MOVES).length + "개");
  console.log("   렌더러: " + SG.flow.getField());

  // 실제 게임 흐름: 상태 생성 → 파티 구성 → 전투 1턴 → 데미지 계산
  const G = SG.freshState();
  G.party = [SG.makeMon("foxfire", 12)];
  SG.setG(G);
  const me = G.party[0];
  const foe = SG.makeMon("leafdrake", 12);
  const r = SG.damage(me, foe, SG.MOVES.ember);   // 불 → 풀 = 2배
  console.log("   전투 계산: 파라꼬(불) ember → 새록꼬(풀) = " + r.dmg + " 피해, 상성 x" + r.eff);
  if (r.eff !== 2) { console.log("❌ 상성 계산이 깨졌다"); process.exit(1); }

  const ai = SG.foeChooseMove(foe, me);
  console.log("   적 AI 기술 선택: " + ai);

  // 저장/불러오기 왕복
  const blob = SG.flow.serialize();
  if (!SG.flow.deserialize(JSON.parse(JSON.stringify(blob)))) {
    console.log("❌ 저장/불러오기 왕복 실패"); process.exit(1);
  }
  console.log("   저장/불러오기 왕복 OK");
  console.log("🎉 스모크 테스트 통과");
  process.exit(0);
}, 2500);
