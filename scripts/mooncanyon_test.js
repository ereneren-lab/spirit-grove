// 회귀 — 신규 지역 '달그림자 골짜기(mooncanyon)' 배선 전반.
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
    // 진입 타일: (10,32) = 'k', 걷기 불가(문형), 이웃 통행 가능
    out.kTile = F.tileAt(10, 32) === "k";
    out.kBlocks = !F.terrainWalkable(10, 32);
    out.kReachable = F.walkable(9, 32) && F.walkable(11, 32);
    // 인테리어 정의: str 높이=H, exit 걷기 가능, N 로어 타일 존재
    const I = F.INTERIORS.mooncanyon;
    out.interior = !!I && I.str.length === I.H && I.name === "달그림자 골짜기";
    // 인카운터 풀: 전 종 실존 + NO_WILD 위반 없음
    const NO_WILD = ["skydrake", "tidalore", "megalith", "taekwarrior", "mystfox", "blossfae", "lanternox", "voidpanther", "gearclad"];
    const pool = F.ENC_POOLS.mooncanyon;
    out.poolExist = pool.every(id => !!S.byId(id));
    out.poolNoWild = pool.filter(id => NO_WILD.includes(id)).length === 0;
    out.poolDarkish = pool.filter(id => { const d = S.byId(id); return d && ["dark", "ghost", "poison"].includes(d.type) || (d && ["dark", "ghost", "poison"].includes(d.type2)); }).length >= 4;
    // 진입 → indoor 세팅 · exit 걷기가능 · Seen 세팅
    F.enterInterior(I); await new Promise(rs => setTimeout(rs, 300));
    out.entered = G.indoor === "mooncanyon";
    out.exitWalkable = F.walkable(I.exitX, I.exitY);
    G.mooncanyonSeen = true;
    // 인카운터: moonPool 밤/낮 규칙(밤=전부, 낮=밤전용 제외)
    out.moonPoolFn = typeof F.moonPool === "function";
    // 영속: mooncanyonSeen 저장/복원
    G.party = [S.makeMon("foxfire", 30)];
    const ser = F.serialize(); out.serSeen = ser.mooncanyonSeen === true;
    G.mooncanyonSeen = false; F.deserialize(ser); out.restoredSeen = S.G().mooncanyonSeen === true;
    // 로어/인트로 정의
    out.hasLore = I.str.some(row => row.includes("N"));
    return out;
  });

  ok(r.kTile && r.kBlocks && r.kReachable, "진입 타일 'k'(10,32): 문형(걷기 불가)이고 이웃이 통행 가능");
  ok(r.interior, "INTERIORS.mooncanyon 정의(str 높이=H, 이름)");
  ok(r.poolExist, "인카운터 풀 전 종 실존");
  ok(r.poolNoWild, "인카운터 풀에 NO_WILD(진화 전용) 종 없음");
  ok(r.poolDarkish, "인카운터 풀이 어둠/고스트/독 위주");
  ok(r.entered && r.exitWalkable, "진입 시 indoor=mooncanyon · 출구 타일 통행 가능");
  ok(r.moonPoolFn && r.hasLore, "moonPool·로어 타일 존재");
  ok(r.serSeen && r.restoredSeen, "mooncanyonSeen 저장/복원 영속");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 신규 지역(달그림자 골짜기) 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
