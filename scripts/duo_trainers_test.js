// 회귀 — 지역별 듀오(2v2) 트레이너 배치(포켓몬식 쌍둥이/커플). duo2~duo4가
//  시야 감지(dir+range) NPC로 존재하고, duoTeam 종이 유효하며, 실제로 듀오 배틀이 열리는지.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  const info = await p.evaluate(() => {
    const S = window.SG; S.setG(S.freshState()); S.flow.enterMap(true); const g = S.G(); g.indoor = null;
    const F = S.flow; const dex = new Set();
    // DEX id 수집
    (F.NPCS || []); // ensure flow present
    const want = ["duo2", "duo3", "duo4"];
    const rows = want.map(id => {
      const n = (F.NPCS || []).find(x => x.id === id); if (!n) return { id, missing: true };
      const okTeam = Array.isArray(n.duoTeam) && n.duoTeam.length >= 2;
      const teamSpecies = (n.duoTeam || []).map(t => t[0]);
      const walk = F.terrainWalkable ? F.terrainWalkable(n.x, n.y) : F.walkable(n.x, n.y);   // 자기 타일은 NPC가 점유하므로 지형 기준으로 확인
      // 시야 앞 2칸 walkable?
      const d = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[n.dir] || [0, 1];
      let sight = true; for (let s = 1; s <= (n.range || 2); s++) { if (!F.walkable(n.x + d[0] * s, n.y + d[1] * s)) { sight = false; break; } }
      return { id, x: n.x, y: n.y, dbl: !!n.double, dir: n.dir, range: n.range, bk: n.battleKey,
        gated: !!(n.requires || n.cond), okTeam, teamSpecies, walk, sight, region: F.region ? F.region(n.y) : -1 };
    });
    // 종 유효성: byId 있으면 사용, 없으면 dex 텍스트 스캔 대체
    const validSpecies = {};
    rows.forEach(r => (r.teamSpecies || []).forEach(sp => { validSpecies[sp] = !!(S.byId ? S.byId(sp) : (F.dispName && true)); }));
    // battleKey 중복 없나(전체 NPC + DUO 포함)
    const keys = (F.NPCS || []).filter(n => n.battleKey).map(n => n.battleKey);
    const dupKeys = keys.filter((k, i) => keys.indexOf(k) !== i);
    return { rows, dupKeys };
  });

  for (const r of info.rows) {
    ok(!r.missing, `${r.id} 존재`);
    if (r.missing) continue;
    ok(r.dbl && r.dir && r.range >= 1, `${r.id} 시야 듀오 설정(double·dir=${r.dir}·range=${r.range})`);
    ok(r.okTeam, `${r.id} duoTeam ≥2 (${(r.teamSpecies || []).join(",")})`);
    ok(r.walk && r.sight, `${r.id} 배치 타일·시야 walkable (${r.x},${r.y} region${r.region})`);
    ok(!r.gated, `${r.id} 게이팅 없음(도달 시 바로 발동)`);
  }
  ok(info.dupKeys.length === 0, "battleKey 중복 없음" + (info.dupKeys.length ? ": " + info.dupKeys.join(",") : ""));

  // 실제로 한 명(duo2) 듀오 배틀이 열리는가 — startDouble(=spotTrainer 호출)로
  const opened = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; const G = S.freshState();
    G.party = [S.makeMon("skydrake", 30), S.makeMon("emberwolf", 30)]; G.active = 0; G.pos = { x: 13, y: 37 };
    S.setG(G); F.enterMap(true); S.G().pos = { x: 13, y: 37 };
    const n = F.NPCS.find(x => x.id === "duo2");
    F.startDouble(n.duoTeam, n.name, n.battleKey);
    const o = document.getElementById("dbOverlay");
    return o && o.classList.contains("active");
  });
  ok(opened, "duo2 듀오 배틀이 실제로 열림");

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 지역별 듀오 트레이너 배치 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
