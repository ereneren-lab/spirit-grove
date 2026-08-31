// 회귀 — 신규 지역 '요정의 뜰(fairyglade)' 배선 전반 + 분위기(날씨·BGM·전투배경).
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
    // 진입 타일: (16,37) = 't', 걷기 불가(문형), 이웃 통행 가능
    out.tTile = F.tileAt(16, 37) === "t";
    out.tBlocks = !F.terrainWalkable(16, 37);
    out.tReachable = [[15, 37], [17, 37], [16, 36], [16, 38]].some(([x, y]) => F.walkable(x, y));
    const I = F.INTERIORS.fairyglade;
    out.interior = !!I && I.str.length === I.H && I.name === "요정의 뜰";
    const NO_WILD = ["skydrake", "tidalore", "megalith", "taekwarrior", "mystfox", "blossfae", "lanternox", "voidpanther", "gearclad"];
    const pool = F.ENC_POOLS.fairyglade;
    out.poolExist = pool.every(id => !!S.byId(id));
    out.poolNoWild = pool.filter(id => NO_WILD.includes(id)).length === 0;
    out.poolFairy = pool.filter(id => { const d = S.byId(id); return d && (["fairy", "grass", "psychic"].includes(d.type) || ["fairy", "grass", "psychic"].includes(d.type2)); }).length >= 6;
    out.encFn = typeof F.startFairyEncounter === "function";
    // 진입 → indoor · exit walkable · Seen
    F.enterInterior(I); await new Promise(rs => setTimeout(rs, 300));
    out.entered = G.indoor === "fairyglade";
    out.exitWalkable = F.walkable(I.exitX, I.exitY);
    out.hasLore = I.str.some(row => row.includes("N"));
    // 분위기: 날씨=sun · BGM=lake · 전투배경 정의
    out.weather = F.INDOOR_WEATHER.fairyglade === "sun";
    G.indoor = "fairyglade"; out.owWeather = F.owWeather() === "sun";
    out.music = F.fieldMusic() === "lake";
    out.battleBg = !!(F.INDOOR_BATTLE_BG && F.INDOOR_BATTLE_BG.fairyglade && F.INDOOR_BATTLE_BG.fairyglade.indexOf("url(") === 0);
    out.habitat = F.HABITAT_KO.fairyglade === "요정의 뜰";
    // 서식지 힌트가 요정의 뜰을 표기
    out.hint = F.findHint(S.byId(pool[0])).indexOf("요정의 뜰") >= 0;
    // 영속
    G.party = [S.makeMon("foxfire", 30)]; G.fairygladeSeen = true;
    const ser = F.serialize(); out.serSeen = ser.fairygladeSeen === true;
    G.fairygladeSeen = false; F.deserialize(ser); out.restoredSeen = S.G().fairygladeSeen === true;
    return out;
  });

  ok(r.tTile && r.tBlocks && r.tReachable, "진입 타일 't'(16,37): 문형(걷기 불가)이고 이웃이 통행 가능");
  ok(r.interior, "INTERIORS.fairyglade 정의(str 높이=H, 이름)");
  ok(r.poolExist, "인카운터 풀 전 종 실존");
  ok(r.poolNoWild, "인카운터 풀에 NO_WILD 종 없음");
  ok(r.poolFairy, "인카운터 풀이 페어리·풀·에스퍼 위주(6종 이상)");
  ok(r.entered && r.exitWalkable, "진입 시 indoor=fairyglade · 출구 통행 가능");
  ok(r.encFn && r.hasLore, "startFairyEncounter 노출·로어 타일 존재");
  ok(r.weather && r.owWeather, "특징 날씨=쨍쨍(sun)");
  ok(r.music, "필드 BGM=lake");
  ok(r.battleBg, "전용 전투 배경 정의(INDOOR_BATTLE_BG)");
  ok(r.habitat && r.hint, "서식지 라벨·도감 힌트에 '요정의 뜰' 표기");
  ok(r.serSeen && r.restoredSeen, "fairygladeSeen 저장/복원 영속");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 신규 지역(요정의 뜰) 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
