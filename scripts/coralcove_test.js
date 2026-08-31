// 회귀 — 신규 지역 '산호 해식동(coralcove)' 배선 전반 + 분위기(날씨·BGM·전투배경).
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
    // 진입 타일: (6,24) = 'y', 걷기 불가(문형), 이웃 통행 가능
    out.yTile = F.tileAt(6, 24) === "y";
    out.yBlocks = !F.terrainWalkable(6, 24);
    out.yReachable = [[5, 24], [7, 24], [6, 25]].some(([x, y]) => F.walkable(x, y));
    const I = F.INTERIORS.coralcove;
    out.interior = !!I && I.str.length === I.H && I.name === "산호 해식동";
    // 인테리어 연결성: 시작→출구 도달 (플러드필)
    (function () {
      const str = I.str, H = I.H, W = I.W, seen = new Set(), q = [[I.startX, I.startY]]; seen.add(I.startX + "," + I.startY);
      const wk = (x, y) => { const c = (str[y] || "")[x]; return c && c !== "#" && c !== "~"; };
      while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + "," + ny; if (!seen.has(k) && wk(nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
      out.exitReach = seen.has(I.exitX + "," + I.exitY);
    })();
    const NO_WILD = ["skydrake", "tidalore", "megalith", "taekwarrior", "mystfox", "blossfae", "lanternox", "voidpanther", "gearclad"];
    const pool = F.ENC_POOLS.coralcove;
    out.poolExist = pool.every(id => !!S.byId(id));
    out.poolNoWild = pool.filter(id => NO_WILD.includes(id)).length === 0;
    out.poolWater = pool.filter(id => { const d = S.byId(id); return d && (["water", "ice", "fairy"].includes(d.type) || ["water", "ice", "fairy"].includes(d.type2)); }).length >= 7;
    out.encFn = typeof F.startCoralEncounter === "function";
    // 진입 → indoor · exit walkable · Seen
    F.enterInterior(I); await new Promise(rs => setTimeout(rs, 300));
    out.entered = G.indoor === "coralcove";
    out.exitWalkable = F.walkable(I.exitX, I.exitY);
    out.hasLore = I.str.some(row => row.includes("N"));
    // 분위기: 날씨=rain(폭풍우, 전투 rain) · BGM=lake · 전투배경 정의
    out.weather = F.INDOOR_WEATHER.coralcove === "rain";
    G.indoor = "coralcove"; out.owWeather = F.owWeather() === "rain";
    F.setWeather(); out.battleRain = S.G().weather === "rain";
    out.music = F.fieldMusic() === "lake";
    out.battleBg = !!(F.INDOOR_BATTLE_BG && F.INDOOR_BATTLE_BG.coralcove && F.INDOOR_BATTLE_BG.coralcove.indexOf("url(") === 0);
    out.habitat = F.HABITAT_KO.coralcove === "산호 해식동";
    out.hint = F.findHint(S.byId(pool[0])).indexOf("산호 해식동") >= 0;
    // 영속
    G.party = [S.makeMon("foxfire", 30)]; G.coralcoveSeen = true;
    const ser = F.serialize(); out.serSeen = ser.coralcoveSeen === true;
    G.coralcoveSeen = false; F.deserialize(ser); out.restoredSeen = S.G().coralcoveSeen === true;
    return out;
  });

  ok(r.yTile && r.yBlocks && r.yReachable, "진입 타일 'y'(6,24): 문형(걷기 불가)이고 이웃이 통행 가능");
  ok(r.interior && r.exitReach, "INTERIORS.coralcove 정의(str 높이=H, 이름) · 시작→출구 연결");
  ok(r.poolExist, "인카운터 풀 전 종 실존");
  ok(r.poolNoWild, "인카운터 풀에 NO_WILD 종 없음");
  ok(r.poolWater, "인카운터 풀이 물·얼음·물요정 위주(7종 이상)");
  ok(r.entered && r.exitWalkable, "진입 시 indoor=coralcove · 출구 통행 가능");
  ok(r.encFn && r.hasLore, "startCoralEncounter 노출·로어 타일 존재");
  ok(r.weather && r.owWeather && r.battleRain, "특징 날씨=폭풍우(rain) → 전투 rain");
  ok(r.music, "필드 BGM=lake");
  ok(r.battleBg, "전용 전투 배경 정의(INDOOR_BATTLE_BG)");
  ok(r.habitat && r.hint, "서식지 라벨·도감 힌트에 '산호 해식동' 표기");
  ok(r.serSeen && r.restoredSeen, "coralcoveSeen 저장/복원 영속");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 신규 지역(산호 해식동) 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
