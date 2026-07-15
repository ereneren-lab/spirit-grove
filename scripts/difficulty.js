// 난이도 곡선 측정 도구. 마을→제단 플레이스루를 시뮬레이션해 각 게이트 도착 시점의
// 플레이어 레벨 vs 리더 고정 레벨을 비교한다. 지역별 야생 하한(WILD_FLOOR)을 반영.
//   node scripts/difficulty.js dist/spirit_grove_3d.html
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const errs = [];
const dom = new JSDOM(fs.readFileSync(process.argv[2], "utf8"), {
  runScripts: "dangerously", pretendToBeVisual: true,
  virtualConsole: new VirtualConsole().on("jsdomError", e => errs.push(e.message)),
});
const w = dom.window;

setTimeout(() => {
  if (errs.length) { console.log("로드 에러:", errs[0]); process.exit(1); }
  const SG = w.SG, DIFF = SG.DIFF, FLOOR = SG.flow.WILD_FLOOR, region = SG.flow.region;
  const H = 50;
  const depthAt = y => (H - 1 - y) / (H - 1);
  const wildLevel = (avg, y, diff) => {
    const al = Math.max(avg, FLOOR[region(y)] || 0);
    let lvl = Math.round(al + depthAt(y) * 4) + DIFF[diff].lvl;
    return Math.max(2, Math.min(58, lvl));
  };
  const need = L => L * 30;
  // 게임의 xpMult(끌개) 재현: 오버월드에서 레벨이 지역 앵커를 넘을수록 XP 급감
  const xpMult = (level, y) => { const over = level - (FLOOR[region(y)] || 0); return over < 0 ? 1.4 : over <= 2 ? 1.0 : over <= 5 ? 0.45 : 0.15; };
  const gain = (fL, level, y) => Math.floor((fL * 19 + 14) * xpMult(level, y));

  // 게이트: 위치(y)와 리더 팀의 min~max (dist에서 실측)
  function team(key){ const t=SG.TRAINERS[key]; return t?t.team.map(x=>x[1]):null; }
  const gates = [
    { name: "체육관1 초원", y: 43, lv: team("1") },
    { name: "체육관2 숲",   y: 35, lv: team("2") },
    { name: "체육관3 호수", y: 26, lv: team("3") },
    { name: "체육관4 고원", y: 17, lv: team("4") },
    { name: "숲의 군주",    y: 8,  lv: team("X") },
    { name: "리그 엘리트1", y: 8,  lv: team("i") },
    { name: "챔피언",      y: 8,  lv: team("q") },
  ];

  function sim(diff, encPerTile) {
    let level = 5, xp = 0, gi = 0; const arrive = {};
    for (let y = 48; y >= 8; y--) {
      while (gi < gates.length && y === gates[gi].y) { arrive[gates[gi].name] = level + xp / need(level); gi++; }
      const n = Math.floor(encPerTile) + ((y * 997 % 100) / 100 < encPerTile - Math.floor(encPerTile) ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const fL = wildLevel(level, y, diff);
        xp += gain(fL, level, y);
        while (xp >= need(level) && level < 60) { xp -= need(level); level++; }
      }
    }
    while (gi < gates.length) { arrive[gates[gi].name] = level + xp / need(level); gi++; }
    return arrive;
  }

  for (const enc of [0.6, 1.2, 2.5]) {
    console.log(`\n=== normal · 칸당 ${enc}회 (총 ≈${Math.round(enc * 40)}전투) ===`);
    console.log("  게이트          리더Lv     도착Lv   격차");
    const a = sim("normal", enc);
    for (const g of gates) {
      const lo = Math.min(...g.lv), hi = Math.max(...g.lv), mid = (lo + hi) / 2;
      const pl = a[g.name], d = pl - mid;
      const tag = d < -3 ? " ⚠️벽" : d > 7 ? " 💤시시" : "";
      console.log(`  ${g.name.padEnd(13)} ${(lo + "~" + hi).padEnd(7)} ${pl.toFixed(1).padStart(8)} ${(d >= 0 ? "+" : "") + d.toFixed(1)}${tag}`);
    }
  }
  console.log("\n=== 게이트 간 리더 레벨 점프 ===");
  for (let i = 1; i < gates.length; i++) {
    const a = (Math.min(...gates[i - 1].lv) + Math.max(...gates[i - 1].lv)) / 2;
    const b = (Math.min(...gates[i].lv) + Math.max(...gates[i].lv)) / 2;
    console.log(`  ${gates[i - 1].name} → ${gates[i].name}: +${(b - a).toFixed(0)}`);
  }
  process.exit(0);
}, 2500);
