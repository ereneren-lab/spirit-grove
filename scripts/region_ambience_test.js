// 회귀 — 신규 지역 4곳의 BGM(fieldMusic) · 전투 배경(INDOOR_BATTLE_BG) 차별화.
// ⚠️ fieldMusic은 Audio.tracks에 실존하는 트랙만 반환해야 한다(없는 이름은 매 프레임 크래시).
// ⚠️ 실내는 region(y)가 전부 6이라 예전엔 전투 배경이 다 제단(보라)이었다 → 지역별로 갈라졌는지 단정.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const VALID_TRACKS = ["town", "explore", "forest", "lake", "highland", "altar", "gym", "cave", "boss", "battle", "title", "victory"];

  const r = await p.evaluate(async (VALID) => {
    const S = window.SG, F = S.flow; const out = {};
    const REGIONS = { mooncanyon: "altar", desert: "explore", crystalcave: "cave", wyverngorge: "highland" };
    // BGM: 각 지역이 기대 트랙을 반환하고, 그 트랙이 실존 트랙 집합에 든다
    S.setG(S.freshState()); let G = S.G(); G.party = [S.makeMon("foxfire", 40)];
    out.music = {}; out.musicValid = true;
    for (const id in REGIONS) { G.indoor = id; G.pos = { x: 6, y: 5 };
      const t = F.fieldMusic(); out.music[id] = t;
      if (t !== REGIONS[id] || !VALID.includes(t)) out.musicValid = false; }
    // 서로 다른 세 종류 이상(달=altar,사막=explore,수정=cave,협곡=highland → 4종 전부 다름)
    out.musicDistinct = new Set(Object.values(out.music)).size === 4;
    G.indoor = null;

    // 전투 배경: INDOOR_BATTLE_BG 4지역 정의 · 유효 형식 · 서로 다름 · 제단(6)과도 다름
    const IB = F.INDOOR_BATTLE_BG || {};
    const keys = Object.keys(IB);
    out.bgCount = keys.length;
    out.bgFormat = keys.every(k => typeof IB[k] === "string" && IB[k].indexOf("url(\"data:image/svg+xml,") === 0);
    out.bgDistinct = new Set(keys.map(k => IB[k])).size === keys.length;
    const altarBg = (F.REGION_BATTLE_BG || [])[6];
    out.bgNotAltar = keys.every(k => IB[k] !== altarBg);

    // 런타임: 지역 안에서 조우 → battleField 배경이 그 지역 전용 배경으로 세팅된다(제단 아님)
    S.setG(S.freshState()); G = S.G(); G.party = [S.makeMon("blazelion", 45)];
    F.enterInterior(F.INTERIORS.wyverngorge);
    for (let w = 0; w < 40 && S.G().indoor !== "wyverngorge"; w++) await new Promise(rs => setTimeout(rs, 50));
    F.startWyvernEncounter();
    for (let w = 0; w < 50 && !S.G().inBattle; w++) await new Promise(rs => setTimeout(rs, 50));
    await new Promise(rs => setTimeout(rs, 900));
    const bf = document.getElementById("battleField");
    const applied = bf ? bf.style.background : "";
    // 브라우저가 CSS를 재직렬화하므로 정확 일치 대신 협곡 고유 서명색(#6a4038)으로 확인 + 제단 서명(#352b52) 아님
    out.battleBgApplied = applied.indexOf("6a4038") >= 0 && applied.indexOf("352b52") < 0;
    return out;
  }, VALID_TRACKS);

  ok(r.musicValid, `네 지역 BGM이 기대 트랙 반환 + 실존 트랙 (${JSON.stringify(r.music)})`);
  ok(r.musicDistinct, "네 지역 BGM이 서로 다르다");
  ok(r.bgCount === 5, `INDOOR_BATTLE_BG 5지역 정의 (${r.bgCount})`);
  ok(r.bgFormat, "전투 배경이 유효한 data-URI SVG 형식");
  ok(r.bgDistinct, "네 지역 전투 배경이 서로 다르다");
  ok(r.bgNotAltar, "전투 배경이 기존 제단(보라) 배경과 다르다");
  ok(r.battleBgApplied, "런타임: 지역 조우 전투에 그 지역 전용 배경이 적용된다");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 신규 지역 BGM·전투 배경 차별화 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
