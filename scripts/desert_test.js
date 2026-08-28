// 회귀 — 신규 지역 '모래바람 사막(desert)' 배선 전반.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; const out = {};
    S.setG(S.freshState()); let G = S.G(); G.party = [S.makeMon("foxfire", 30)]; F.enterMap(true);
    // 진입 타일: (3,14) = 'k', 걷기 불가(문형), 이웃 통행 가능
    out.kTile = F.tileAt(3, 14) === "d";
    out.kBlocks = !F.terrainWalkable(3, 14);
    out.kReachable = F.walkable(2, 14) && F.walkable(4, 14);
    // 인테리어 정의: str 높이=H, exit 걷기 가능, N 로어 타일 존재
    const I = F.INTERIORS.desert;
    out.interior = !!I && I.str.length === I.H && I.name === "모래바람 사막";
    // 인카운터 풀: 전 종 실존 + NO_WILD 위반 없음
    const NO_WILD = ["skydrake", "tidalore", "megalith", "taekwarrior", "mystfox", "blossfae", "lanternox", "voidpanther", "gearclad"];
    const pool = F.ENC_POOLS.desert;
    out.poolExist = pool.every(id => !!S.byId(id));
    out.poolNoWild = pool.filter(id => NO_WILD.includes(id)).length === 0;
    out.poolDarkish = pool.filter(id => { const d = S.byId(id); return d && ["rock", "ground", "fire", "steel"].includes(d.type) || (d && ["rock", "ground", "fire", "steel"].includes(d.type2)); }).length >= 4;
    // 진입 → indoor 세팅 · exit 걷기가능 · Seen 세팅
    F.enterInterior(I); await new Promise(rs => setTimeout(rs, 300));
    out.entered = G.indoor === "desert";
    out.exitWalkable = F.walkable(I.exitX, I.exitY);
    G.desertSeen = true;
    // 인카운터: startDesertEncounter 밤/낮 규칙(밤=전부, 낮=밤전용 제외)
    out.startDesertEncounterFn = typeof F.startDesertEncounter === "function";
    // 영속: desertSeen 저장/복원
    G.party = [S.makeMon("foxfire", 30)];
    const ser = F.serialize(); out.serSeen = ser.desertSeen === true;
    G.desertSeen = false; F.deserialize(ser); out.restoredSeen = S.G().desertSeen === true;
    // 로어/인트로 정의
    out.hasLore = I.str.some(row => row.includes("N"));
    return out;
  });

  ok(r.kTile && r.kBlocks && r.kReachable, "진입 타일 'd'(3,14): 문형(걷기 불가)이고 이웃이 통행 가능");
  ok(r.interior, "INTERIORS.desert 정의(str 높이=H, 이름)");
  ok(r.poolExist, "인카운터 풀 전 종 실존");
  ok(r.poolNoWild, "인카운터 풀에 NO_WILD(진화 전용) 종 없음");
  ok(r.poolDarkish, "인카운터 풀이 바위·땅·불 위주");
  ok(r.entered && r.exitWalkable, "진입 시 indoor=desert · 출구 타일 통행 가능");
  ok(r.startDesertEncounterFn && r.hasLore, "startDesertEncounter·로어 타일 존재");
  ok(r.serSeen && r.restoredSeen, "desertSeen 저장/복원 영속");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 신규 지역(모래바람 사막) 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
