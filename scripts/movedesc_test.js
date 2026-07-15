// 기술 설명 헬퍼 회귀 테스트: 배우기/잊기/재습득 UI가 쓰는 moveSummary가 모든 기술
// 유형(공격/상태/랭크/회복/흡수/연타/선제/장막/함정/날씨)을 사람이 읽을 수 있게 만드는가.
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
  const S = w.SG.moveSummary, D = w.SG.moveDesc;

  const cases = [
    ["flare", ["불", "위력 58", "화상", "PP"]],        // 공격 + 상태
    ["growl", ["노말", "공격↓", "PP"]],                 // 상대 랭크 하락
    ["agility", ["속도↑", "자신", "PP"]],               // 자신 랭크 상승
    ["furyswipe", ["위력 17", "연타", "PP"]],           // 연속기
    ["recover", ["회복", "PP"]],                        // 회복
    ["absorb", ["흡수", "PP"]],                         // 흡수
    ["quickjab", ["선제", "PP"]],                       // 선제공격
    ["reflect", ["물리 피해", "PP"]],                    // 장막
    ["leechseed", ["씨뿌리기", "PP"]],                  // 씨앗
    ["toxic", ["독", "PP"]],                            // 상태이상
    ["sunnyday", ["쨍쨍", "PP"]],                       // 날씨
    ["stealthrock", ["바위 설치", "PP"]],               // 함정
    ["headbutt", ["풀죽음", "PP"]],                     // 풀죽음
  ];
  for (const [mv, needles] of cases) {
    const s = S(mv);
    const good = needles.every(n => s.includes(n));
    ok(good, `${mv} → "${s}"`);
  }
  // 존재하지 않는 기술은 키 그대로(크래시 안 함)
  ok(S("__nope__") === "__nope__", "미정의 기술도 안전");

  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 기술 설명 헬퍼 통과");
  process.exit(process.exitCode || 0);
}, 2500);
