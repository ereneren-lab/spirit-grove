// 목표 트래커 검증: 진행 사슬(체육관 4 → 리그 → 챔피언 → 도감)이 상태를 정확히 따라가는가
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const errors = [];
const dom = new JSDOM(fs.readFileSync(process.argv[2], "utf8"), {
  runScripts: "dangerously", pretendToBeVisual: true,
  virtualConsole: new VirtualConsole().on("jsdomError", e => errors.push(e.message)),
});
const w = dom.window, d = w.document;
const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

setTimeout(() => {
  if (errors.length) { console.log("❌ 로드 에러:", errors[0]); process.exit(1); }
  const SG = w.SG, F = SG.flow;

  const G = SG.freshState();
  G.party = [SG.makeMon("foxfire", 5)];
  SG.setG(G);

  const track = d.getElementById("goalTrack");
  const nm = () => d.getElementById("goalName").textContent;
  const sub = () => d.getElementById("goalSub").textContent;

  console.log("[1] 뱃지 0개 — 첫 체육관을 가리키는가");
  F.updateGoal();
  ok(track.classList.contains("on"), "트래커가 화면에 뜬다");
  ok(nm() === "초원 체육관", "목표: " + nm());
  ok(sub().includes("0/4"), "인장 진행도 표시: " + sub());
  ok(/\d+칸/.test(sub()), "목표까지 거리 표시됨");
  /* ⚠️ **좌표를 여기 적지 않는다 — GYM_AT에서 가져온다.**
     원래는 (8,43)/(8,35)/(8,26)/(8,17)을 그대로 박아뒀는데, 체육관을 가로로 흩자
     지도·트래커는 멀쩡한데 **이 테스트만** 옛 자리를 요구하며 빨갛게 떴다.
     테스트가 상수를 들고 있으면 그 자체가 병렬 테이블이다. */
  const GA = SG.GYM_AT || {};
  const gymXY = n => { const k = Object.keys(GA).find(k => GA[k] === "gym" + n);
                       const [x, y] = (k || "0,0").split(",").map(Number); return {x, y}; };
  const x1 = gymXY(1);
  ok(Object.keys(GA).length === 4, `GYM_AT에 체육관 4곳이 있다 (${Object.keys(GA).length})`);
  const g1 = F.currentGoal();
  ok(g1.x === x1.x && g1.y === x1.y, `좌표가 실제 체육관 타일(${x1.x},${x1.y})과 일치`);
  ok(F.tileAt(x1.x, x1.y) === "G", `그 좌표가 진짜 체육관 G 타일이다`);

  console.log("[2] 뱃지를 하나씩 획득 — 다음 체육관으로 넘어가는가");
  const expect = [["1", "숲 체육관", 2], ["2", "수정 호수 체육관", 3], ["3", "고원 체육관", 4]];
  for (const [badge, name, n] of expect) {
    G.badges.push(badge);
    const g = F.currentGoal(), want = gymXY(n);
    ok(g.name === name, `뱃지 ${G.badges.length}개 → ${g.name}`);
    ok(g.x === want.x && g.y === want.y, `  좌표가 GYM_AT의 gym${n}(${want.x},${want.y})과 일치 — 실제 (${g.x},${g.y})`);
    /* 📌 이름이 지역을 말하는데 실제로 다른 지역에 서 있으면 안 된다 — 옮길 때 조용히 어긋나는 자리 */
    ok(F.tileAt(want.x, want.y) === "G", `  그 좌표가 진짜 G 타일이다`);
  }

  console.log("[3] 인장 4조각 — 전설 준비 → 숲의 군주 → 리그");
  G.badges.push("4");
  /* ⚠️ 4뱃지 → **곧장 리그**가 아니다. 리그 완주율이 전설 보유로 크게 갈리는데(실측 Lv48 7.6%→18.4%)
     그 준비가 사슬 밖이라 아무도 안내받지 못했다 → 전설이 없으면 호수 제단을 한 단계 끼운다. */
  const gp = F.currentGoal();
  ok(gp.name === "호수 제단", "전설이 없으면 먼저 호수 제단으로 안내한다: " + gp.name);
  ok(F.tileAt(gp.x, gp.y) === "%", `좌표가 실제 호수 제단 % 타일과 일치 (${gp.x},${gp.y})`);
  ok(!F.hasLegendary(), "이 시점에 전설을 보유하지 않았다(전제 확인)");

  // 전설을 보유하면 단계가 사라지고 리그로 넘어간다
  G.party.push(SG.makeMon("aqualord", 52));
  ok(F.hasLegendary(), "전설을 파티에 넣으면 보유로 인식한다");
  const gl = F.currentGoal();
  /* ⚠️ **숲의 군주가 리그보다 먼저다**(유저 승인으로 2026-08-04 재배선). 이 게임엔 완성된 결말이
     둘 있는데(플롯: 군주→EPILOGUE→showEnding, 메타: 챔피언→LEAGUE_WIN), 예전 사슬은 4뱃지 →
     곧장 리그라 **플롯 결말이 사슬 밖**이었다 — HOME_LETTER도, 4뱃지 안내도, 라이벌 4차전 대사도
     전부 제단을 가리키는데 트래커만 리그로 보냈다. 이 순서가 뒤집히면 그 모순이 되살아난다. */
  ok(gl.name === "군주의 제단", "전설 보유 시 목표: " + gl.name);
  ok(F.tileAt(gl.x, gl.y) === "X", `좌표가 실제 제단 입구 X 타일과 일치 (${gl.x},${gl.y})`);

  /* ⚠️ **영구 정체 방지 반례**: 전설을 안 잡고 쓰러뜨리기만 해도 단계가 사라져야 한다.
     안 그러면 제단을 비운 플레이어가 트래커에 영영 붙잡힌다(`lakeDone`은 격파·포획 양쪽에 배선돼 있다). */
  G.party.pop();
  ok(!F.hasLegendary(), "전설을 빼면 다시 미보유");
  G.lakeDone = true;
  const gd = F.currentGoal();
  ok(gd.name === "군주의 제단", "격파만 해도(lakeDone) 전설 단계가 사라진다: " + gd.name);
  G.lakeDone = false; G.party.push(SG.makeMon("aqualord", 52));

  /* 군주를 꺾으면(G.badge) 비로소 리그가 목표가 된다 — 순서의 뒷단을 여기서 고정한다.
     ⚠️ 영구 정체 방지 반례도 함께: 격파 기록(G.defeated "X")만으로도 단계가 사라져야 한다. */
  const gx = (()=>{ G.defeated.add("X"); const r=F.currentGoal(); G.defeated.delete("X"); return r; })();
  ok(gx.name === "정령 리그", "격파 기록만 있어도 단계가 사라진다: " + gx.name);
  G.badge = true;
  const gl2 = F.currentGoal();
  ok(gl2.name === "정령 리그", "군주를 꺾으면 목표: " + gl2.name);
  ok(gl2.x === 18 && gl2.y === 9, "좌표가 실제 리그 입구 U 타일(18,9)과 일치");

  console.log("[4] 챔피언 달성 — 최종 목표로 전환");
  G.champion = true;
  const gc = F.currentGoal();
  ok(gc.name === "도감 완성", "목표: " + gc.name);
  ok(gc.done === true && gc.x === null, "방향이 아닌 수집 현황을 보여준다");
  F.updateGoal();
  ok(track.classList.contains("done"), "트로피 스타일로 바뀐다");
  ok(sub().includes("/" + SG.DEX.length), "도감 진행도: " + sub() + " (총 " + SG.DEX.length + "종)");

  /* [4b] ⚠️ **트래커가 가리키는 곳엔 실제로 갈 수 있어야 한다.** 사슬에 단계를 끼우는 건 값싼 변경처럼
     보이지만, 목표 타일이 비보행 문(제단 X·리그 U·체육관 G)이면 bfsPath가 항상 null이라 자동 이동이
     통째로 먹지 않는다(주석에 기록된 실제 사고). 봇도 트래커를 따라가므로 여기서 막히면 완주가 죽는다.
     → 좌표를 내는 모든 단계에 대해 "그 타일 자체가 보행이거나, 인접한 보행 칸이 마을에서 도달 가능"을 단정한다. */
  console.log("[4b] 트래커가 내는 좌표가 전부 도달 가능한가");
  const reach = (()=>{
    /* ⚠️ 도달성은 **그 단계에서 플레이어가 가진 능력**으로 따져야 한다 — 이 세 목표는 전부
       4뱃지 이후에만 뜨고, 그때 플레이어는 자르기(1뱃지)·괴력(2뱃지)·파도타기(3뱃지)를 갖고 있다.
       실제로 호수 제단(%)은 **사방이 물**이라 도보 BFS로는 인접 칸이 0개다(파도타기 전용).
       능력을 안 켜고 재면 멀쩡한 목표가 실패로 잡힌다 — 처음 이 단정을 그렇게 짰다가 겪었다. */
    const save={surf:G.hasSurf, surfing:G.surfing};
    G.hasSurf=true; G.surfing=true;                       /* 물 위를 건널 수 있는 상태로 모델링 */
    const seen=new Set(), q=[[5,48]]; seen.add("5,48");
    while(q.length){ const [x,y]=q.shift();
      for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){ const nx=x+dx,ny=y+dy,k=nx+","+ny;
        if(seen.has(k)||!F.walkable(nx,ny))continue; seen.add(k); q.push([nx,ny]); } }
    G.hasSurf=save.surf; G.surfing=save.surfing;
    const probe=(name,x,y)=>{ if(F.walkable(x,y))return {name,ok:seen.has(x+","+y),how:"보행 타일"};
      const adj=[[0,1],[0,-1],[1,0],[-1,0]].filter(([dx,dy])=>seen.has((x+dx)+","+(y+dy)));
      return {name,ok:adj.length>0,how:`비보행 문 · 인접 도달칸 ${adj.length}개`}; };
    const lake=F.findTile("%"), lord=F.findTile("X");
    return [probe("호수 제단",lake.x,lake.y), probe("군주의 제단",lord.x,lord.y), probe("정령 리그",18,9)]; })();
  reach.forEach(r=>ok(r.ok, `${r.name} 좌표에 걸어갈 수 있다 (${r.how})`));

  console.log("[5] 전투 중엔 숨는가");
  G.inBattle = true; F.updateGoal();
  ok(!track.classList.contains("on"), "전투 중 트래커 숨김");

  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 목표 트래커 전부 통과");
  process.exit(process.exitCode || 0);
}, 2500);
