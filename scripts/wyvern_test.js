// 회귀 — 신규 지역 '비룡 협곡(wyverngorge)' 배선 전반.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; const out = {};
    S.setG(S.freshState()); let G = S.G(); G.party = [S.makeMon("foxfire", 40)]; F.enterMap(true);
    // 진입 타일: (16,14) = 'r', 걷기 불가(문형), 이웃 통행 가능
    out.rTile = F.tileAt(16, 14) === "r";
    out.rBlocks = !F.terrainWalkable(16, 14);
    out.rReachable = F.walkable(16, 13) && F.walkable(17, 14) && F.walkable(16, 15);
    // 인테리어 정의: str 높이=H, exit 걷기 가능, N 로어 타일 존재
    const I = F.INTERIORS.wyverngorge;
    out.interior = !!I && I.str.length === I.H && I.name === "비룡 협곡";
    // 인카운터 풀: 전 종 실존 + NO_WILD 위반 없음 + 용/비행 위주
    const NO_WILD = ["skydrake", "tidalore", "megalith", "taekwarrior", "mystfox", "blossfae", "lanternox", "voidpanther", "gearclad"];
    const pool = F.ENC_POOLS.wyverngorge;
    out.poolExist = pool.every(id => !!S.byId(id));
    out.poolNoWild = pool.filter(id => NO_WILD.includes(id)).length === 0;
    out.poolDraconic = pool.filter(id => { const d = S.byId(id); return d && (["dragon", "flying"].includes(d.type) || ["dragon", "flying"].includes(d.type2)); }).length >= 6;
    // 진입 → indoor 세팅 · exit 걷기가능 · Seen 세팅
    F.enterInterior(I); await new Promise(rs => setTimeout(rs, 300));
    out.entered = G.indoor === "wyverngorge";
    out.exitWalkable = F.walkable(I.exitX, I.exitY);
    G.wyverngorgeSeen = true;
    // 인카운터 함수 노출
    out.encFn = typeof F.startWyvernEncounter === "function";
    // 영속: wyverngorgeSeen 저장/복원
    G.party = [S.makeMon("foxfire", 40)];
    const ser = F.serialize(); out.serSeen = ser.wyverngorgeSeen === true;
    G.wyverngorgeSeen = false; F.deserialize(ser); out.restoredSeen = S.G().wyverngorgeSeen === true;
    // 로어 타일 정의
    out.hasLore = I.str.some(row => row.includes("N"));
    return out;
  });

  ok(r.rTile && r.rBlocks && r.rReachable, "진입 타일 'r'(16,14): 문형(걷기 불가)이고 이웃이 통행 가능");
  ok(r.interior, "INTERIORS.wyverngorge 정의(str 높이=H, 이름)");
  ok(r.poolExist, "인카운터 풀 전 종 실존");
  ok(r.poolNoWild, "인카운터 풀에 NO_WILD(진화 전용) 종 없음");
  ok(r.poolDraconic, "인카운터 풀이 용·비행 위주(6종 이상)");
  ok(r.entered && r.exitWalkable, "진입 시 indoor=wyverngorge · 출구 타일 통행 가능");
  ok(r.encFn && r.hasLore, "startWyvernEncounter 노출·로어 타일 존재");
  ok(r.serSeen && r.restoredSeen, "wyverngorgeSeen 저장/복원 영속");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 신규 지역(비룡 협곡) 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
