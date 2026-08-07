// 포켓몬식 출입구 회귀 (유저 제보 3건).
//
// 무엇이 문제였나:
//   ① 건물이 **4방 어디서 부딪혀도** 들어가졌다 → "벽으로 걸어들어가면 실내"가 됐다.
//   ② 상점 `S`·제단 `X`는 아예 **보행 타일**이라 밟고 지나가다 들어가졌다("입구가 없이 그냥 풀숲 지나가다").
//   ③ NPC가 건물 타일 위에 서 있었다(회관 `E` 위 t11 · 정령센터 `+` 위 t20 · 수정 `C` 위 순례자).
//
// 지금 규칙: 건물(`DOOR_TILES` = + E H G U S X)은 **정면(아래)에서 위로** 들어간다.
// ⚠️ [4]는 **과잉 적용 방지 대조군** — 동굴·설원 같은 자연 입구는 절벽에 난 구멍이라 방향을 안 가린다.
//    (지도상 정면 칸이 없는 곳이 4곳이라 정면 규칙을 걸면 도달 불가가 된다.)
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  const place=async(x,y)=>{ await p.evaluate(([px,py])=>{ const S=window.SG,G=S.freshState();
      G.party=[S.makeMon("emberwolf",30)]; G.pos={x:px,y:py}; G.repel=999;
      G.badge=true; G.defeated=new Set(["1","2","3","4"]);   // 제단 게이트 통과용
      S.setG(G); S.flow.enterMap(true); },[x,y]);
    await p.waitForTimeout(320); };
  const bump=async(key)=>{ await p.keyboard.press(key); await p.waitForTimeout(700);
    return p.evaluate(()=>window.SG.G().indoor); };

  /* [1] 상점 — 옆에서 부딪히면 안 들어간다 / 정면에서만 들어간다 */
  console.log("\n[1] 상점 S(4,26) — 정면 출입구");
  await place(3,26); ok(await bump("ArrowRight")===null, "왼쪽에서 부딪혀도 안 들어간다");
  await place(5,26); ok(await bump("ArrowLeft")===null,  "오른쪽에서 부딪혀도 안 들어간다");
  await place(4,25); ok(await bump("ArrowDown")===null,  "위에서 밟아도 안 들어간다(예전엔 여기서 들어갔다)");
  await place(4,27); ok(await bump("ArrowUp")==="shop",  "정면(아래)에서 위로 → 입장");

  /* [2] 제단 X — 통로처럼 밟고 지나가지지 않는다 */
  console.log("\n[2] 군주의 제단 X(8,8) — 통과 불가 + 정면 진입");
  ok(!(await p.evaluate(()=>window.SG.flow.walkable(8,8))), "제단 타일은 비보행(밟고 지나갈 수 없다)");
  await place(8,9); ok(await bump("ArrowUp")==="altar", "정면(아래)에서 위로 → 입장");

  /* [3] 정령센터·회관도 같은 규칙 */
  console.log("\n[3] 정령센터·정령 회관");
  await place(20,31); ok(await bump("ArrowRight")===null, "센터(21,31) 옆에서 부딪혀도 안 들어간다");
  await place(21,32); ok(await bump("ArrowUp")==="center", "센터 정면에서 입장");
  await place(6,31);  ok(await bump("ArrowUp")==="hall",   "회관(6,30) 정면에서 입장");

  /* [4] 대조군 — 자연 입구(동굴)는 방향을 안 가린다 */
  console.log("\n[4] 대조군: 자연 입구는 방향 무관");
  await place(14,16); ok(await bump("ArrowRight")==="cave", "동굴 D(15,16)는 옆에서 들어가도 된다");

  /* [5] 모든 건물 문 앞에 설 수 있다(정면 칸이 보행 가능) */
  console.log("\n[5] 모든 건물 문의 정면 칸이 열려 있다");
  await place(8,44);
  /* ⚠️ 이 단정이 보려는 건 **지도의 구조**다 — "지금 누가 서 있나"가 아니라 "여기가 뚫려 있나".
     예전엔 `walkable()`을 썼는데 그건 **로밍 NPC 점유까지** 본다 → 문 앞을 지나는 NPC 때문에
     간헐적으로 빨개졌다(재스캔 4회로도 못 막았다. NPC가 45% 확률로 제자리에 머물러 3초를 버틴다).
     2026-08-07에 게임의 `walkable`을 지형(`terrainWalkable`)과 점유로 쪼갰다 → **지형만 묻는다.**
     이제 재스캔이 필요 없고 결과가 결정적이다. */
  const scan=()=>p.evaluate(()=>{ const F=window.SG.flow; const bad=[];
    for(let y=0;y<50;y++)for(let x=0;x<25;x++){ const t=F.tileAt(x,y)||"";
      if("+EHGUSX".indexOf(t)<0||!t)continue;
      if(!F.terrainWalkable(x,y+1))bad.push(t+" ("+x+","+y+")"); }
    return bad; });
  const doors=await scan();
  ok(doors.length===0, `정면이 막힌 건물 0곳 ${doors.length?JSON.stringify(doors):""}`);

  /* [6] NPC가 지형/건물 위에 서 있지 않다 */
  console.log("\n[6] NPC 배치");
  const onSolid=await p.evaluate(()=>{ const F=window.SG.flow; const bad=[];
    (F.NPCS||[]).forEach(n=>{ if(n.x==null)return; const t=F.tileAt(n.x,n.y)||"";
      if("#~HFPNCoDGWYZ@KLUx%VM&QJOz^!+ES".indexOf(t)>=0)bad.push(n.id+" ("+n.x+","+n.y+") 타일 '"+t+"'"); });
    return bad; });
  ok(onSolid.length===0, `건물·지형 위에 선 NPC 0명 ${onSolid.length?JSON.stringify(onSolid):""}`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs.length?": "+errs[0]:""})`);
  console.log(fail?"\n❌ 실패":"\n🎉 포켓몬식 출입구 통과");
  await b.close(); process.exit(fail);
})();
