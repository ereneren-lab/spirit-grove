// 회귀 — 신규 지역 4곳(달그림자·사막·수정 동굴·비룡 협곡)의 바닥/숨은 도구 배치.
// ⚠️ 실내 좌표계 스코프(in) + 통행 가능 칸 + 획득 시 G.found 기록을 단정한다.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(async () => {
    const S = window.SG, F = S.flow; const out = {};
    const REGIONS = ["mooncanyon", "desert", "crystalcave", "wyverngorge"];
    const ground = (F.GROUND_ITEMS || []).filter(g => REGIONS.includes(g.in));
    const hidden = (F.HIDDEN || []).filter(h => REGIONS.includes(h.in));
    out.groundCount = ground.length;   // 지역당 2개 → 8
    out.hiddenCount = hidden.length;   // 지역당 1개 → 4
    // 각 지역에 바닥 최소 2 + 숨은 1
    out.perRegion = REGIONS.every(id =>
      ground.filter(g => g.in === id).length >= 2 && hidden.filter(h => h.in === id).length >= 1);
    // 모든 아이템 키가 이름을 낸다(키 노출 금지)
    const all = [...ground, ...hidden];
    out.allNamed = all.every(g => F.itemName(g.item) !== g.item);
    // 좌표가 그 인테리어의 통행 가능 칸이고, 시작/출구/N팻말과 겹치지 않는다
    out.coordsWalkable = all.every(g => {
      const I = F.INTERIORS[g.in]; if (!I) return false;
      const ch = I.str[g.y] && I.str[g.y][g.x];
      const reserved = (g.x === I.startX && g.y === I.startY) || (g.x === I.exitX && g.y === I.exitY) || ch === "N" || ch === "#";
      return (ch === "." || ch === "g" || ch === "T") && !reserved;
    });
    // 키 유일성
    out.uniqueKeys = new Set(all.map(g => g.k)).size === all.length;

    // 런타임 획득: 대표로 wyverngorge 바닥 아이템 하나를 실제로 줍는다
    S.setG(S.freshState()); let G = S.G(); G.party = [S.makeMon("foxfire", 40)];
    const gi = ground.find(g => g.in === "wyverngorge" && g.item === "candy");
    F.enterInterior(F.INTERIORS.wyverngorge);
    for (let w = 0; w < 40 && S.G().indoor !== "wyverngorge"; w++) await new Promise(rs => setTimeout(rs, 50));
    G = S.G();
    const beforeCandy = (G.items.candy || 0);
    const at = F.groundItemAt(gi.x, gi.y);          // 실내 스코프로 정확히 잡히는가
    out.groundAtScoped = !!(at && at.k === gi.k);
    F.pickupGroundItem(at);
    out.pickedUp = (G.items.candy || 0) === beforeCandy + gi.qty && (G.found || []).includes(gi.k);
    out.notRepick = F.groundItemAt(gi.x, gi.y) === null;   // 주운 뒤엔 사라진다
    // 숨은 도구도 실내 스코프로 잡힌다
    const hd = hidden.find(h => h.in === "wyverngorge");
    out.hiddenScoped = !!(F.hiddenAt(hd.x, hd.y));
    // 오버월드에선 실내 아이템이 안 잡힌다(스코프 분리)
    F.exitInterior();
    for (let w = 0; w < 40 && S.G().indoor; w++) await new Promise(rs => setTimeout(rs, 50));
    out.scopeIsolated = F.groundItemAt(gi.x, gi.y) === null;
    return out;
  });

  ok(r.groundCount >= 8, `신규 지역 바닥 도구 ${r.groundCount}개(지역당 2+)`);
  ok(r.hiddenCount >= 4, `신규 지역 숨은 도구 ${r.hiddenCount}개(지역당 1+)`);
  ok(r.perRegion, "네 지역 각각 바닥 2·숨은 1 이상");
  ok(r.allNamed, "모든 도구가 한글 이름을 낸다(키 노출 없음)");
  ok(r.coordsWalkable, "모든 좌표가 통행 가능 칸(시작·출구·N팻말·벽 제외)");
  ok(r.uniqueKeys, "도구 키가 전부 유일");
  ok(r.groundAtScoped, "실내 스코프로 바닥 도구가 정확히 잡힌다");
  ok(r.pickedUp, "바닥 도구 획득 시 가방 반영 + G.found 기록");
  ok(r.notRepick, "주운 도구는 다시 잡히지 않는다");
  ok(r.hiddenScoped, "숨은 도구도 실내 스코프로 잡힌다");
  ok(r.scopeIsolated, "오버월드에선 실내 도구가 안 잡힌다(스코프 분리)");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 신규 지역 도구 배치 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
