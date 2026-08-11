// 비전기술 장면 회귀 (유저: "마을에서 괴력이나, 파도타기, 자르기 등 쓸때도 포켓몬처럼").
//
// 예전엔 지형만 즉시 바뀌고 토스트 한 줄이 전부였다 — "누가 무엇을 했는지"가 화면에 없었다.
// 지금은 맵 위에 **선두 정령이 나와 기술을 쓰는 장면**(`.fmove`)이 뜨고, 끝난 뒤 지형이 바뀐다.
//
// ⚠️ 검증 포인트 3가지:
//   · 장면이 실제로 그려진다(정령 아트 + "OO의 자르기!" 문구)
//   · 장면 **동안 입력이 잠기고**(G.busy) 끝나면 풀린다 — 안 잠그면 연출 중에 걸어가 버린다
//   · 장면이 끝난 **뒤에** 지형이 바뀐다(연출 전에 바뀌면 결과가 먼저 보여 어색하다)
// ⚠️ reduceMotion이면 연출을 건너뛰고 즉시 실행 — 대조군으로 같이 고정(과잉 적용 방지).
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  const boot=async(reduce)=>{ await p.evaluate(r=>{ const S=window.SG,G=S.freshState();
      G.party=[S.makeMon("emberwolf",25)]; G.pos={x:8,y:44}; G.repel=999;
      G.hasCut=true; G.hasStrength=true; G.hasSurf=true;
      S.CONFIG.reduceMotion=r; S.setG(G); S.flow.enterMap(true); },reduce);
    await p.waitForTimeout(400); };

  /* [1] 자르기 — 장면이 뜨고, 입력이 잠기고, 끝난 뒤 지형이 바뀐다 */
  console.log("\n[1] 자르기");
  await boot(false);
  // 자를 수 있는 덤불 x 하나를 찾아 그 자리를 기록
  const cut=await p.evaluate(()=>{ const F=window.SG.flow;
    for(let y=0;y<50;y++)for(let x=0;x<25;x++) if(F.tileAt(x,y)==="x")return {x,y};
    return null; });
  ok(!!cut, `자르기 대상(덤불) 존재 ${cut?`(${cut.x},${cut.y})`:""}`);
  await p.evaluate(c=>window.SG.flow.cutObstacle(c.x,c.y), cut);
  await p.waitForTimeout(260);
  const mid=await p.evaluate(c=>{ const el=document.querySelector(".fmove");
    return { shown:!!el, txt:el?(el.querySelector(".fm-msg")||{}).textContent||"":"",
      art:!!(el&&el.querySelector(".fm-sp img,.fm-sp svg,.fm-sp div")),
      busy:!!window.SG.G().busy, tile:window.SG.flow.tileAt(c.x,c.y) }; }, cut);
  ok(mid.shown, "장면이 뜬다(.fmove)");
  ok(/자르기/.test(mid.txt), `정령 이름 + 기술명이 나온다 ("${mid.txt.trim()}")`);
  ok(mid.art, "장면에 정령 아트가 들어간다");
  ok(mid.busy, "장면 동안 입력이 잠긴다(G.busy)");
  ok(mid.tile==="x", "아직 지형은 그대로다(연출이 먼저)");
  await p.waitForTimeout(1200);
  const after=await p.evaluate(c=>({ shown:!!document.querySelector(".fmove"),
    busy:!!window.SG.G().busy, tile:window.SG.flow.tileAt(c.x,c.y) }), cut);
  ok(!after.shown, "장면이 끝나면 사라진다");
  ok(!after.busy, "입력 잠금이 풀린다");
  ok(after.tile==="g", `장면이 끝난 뒤 덤불이 베어진다 (타일 '${after.tile}')`);

  /* [2] 괴력 — 밀 수 없으면 정령을 꺼내지 않는다(헛 연출 방지) */
  console.log("\n[2] 괴력");
  await boot(false);
  const rock=await p.evaluate(()=>{ const F=window.SG.flow;
    for(let y=1;y<49;y++)for(let x=1;x<24;x++) if(F.tileAt(x,y)==="o"){
      for(const [dx,dy,d] of [[0,-1,"up"],[0,1,"down"],[-1,0,"left"],[1,0,"right"]])
        if(F.tileAt(x+dx,y+dy)==="g")return {x,y,dir:d,tx:x+dx,ty:y+dy};
    } return null; });
  ok(!!rock, `밀 수 있는 바위 존재 ${rock?`(${rock.x},${rock.y}) → ${rock.dir}`:""}`);
  await p.evaluate(r=>window.SG.flow.pushBoulder(r.x,r.y,r.dir), rock);
  await p.waitForTimeout(260);
  ok(await p.evaluate(()=>!!document.querySelector(".fmove")), "괴력 장면이 뜬다");
  await p.waitForTimeout(1200);
  const rockAfter=await p.evaluate(r=>({ from:window.SG.flow.tileAt(r.x,r.y), to:window.SG.flow.tileAt(r.tx,r.ty) }), rock);
  ok(rockAfter.from==="g"&&rockAfter.to==="o", `바위가 밀려났다 (${rockAfter.from}/${rockAfter.to})`);

  // 막힌 방향은 연출 없이 즉시 거절
  const blocked=await p.evaluate(()=>{ const F=window.SG.flow;
    for(let y=1;y<49;y++)for(let x=1;x<24;x++) if(F.tileAt(x,y)==="o"){
      for(const [dx,dy,d] of [[0,-1,"up"],[0,1,"down"],[-1,0,"left"],[1,0,"right"]])
        if(F.tileAt(x+dx,y+dy)==="#")return {x,y,dir:d};
    } return null; });
  if(blocked){ await p.evaluate(r=>window.SG.flow.pushBoulder(r.x,r.y,r.dir), blocked);
    await p.waitForTimeout(220);
    ok(!(await p.evaluate(()=>!!document.querySelector(".fmove"))), "밀 수 없는 바위엔 정령을 꺼내지 않는다"); }
  else console.log("  ℹ️ 막힌 바위 케이스 없음 — 건너뜀");

  /* [3] 대조군 — reduceMotion이면 연출 없이 즉시 */
  console.log("\n[3] 대조군: reduceMotion");
  await boot(true);
  const cut2=await p.evaluate(()=>{ const F=window.SG.flow;
    for(let y=0;y<50;y++)for(let x=0;x<25;x++) if(F.tileAt(x,y)==="x")return {x,y};
    return null; });
  await p.evaluate(c=>window.SG.flow.cutObstacle(c.x,c.y), cut2);
  await p.waitForTimeout(200);
  const rm=await p.evaluate(c=>({ shown:!!document.querySelector(".fmove"),
    tile:window.SG.flow.tileAt(c.x,c.y), busy:!!window.SG.G().busy }), cut2);
  ok(!rm.shown, "reduceMotion이면 장면을 건너뛴다");
  ok(rm.tile==="g", "그래도 지형은 즉시 바뀐다");
  ok(!rm.busy, "입력을 잠그지 않는다");

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs.length?": "+errs[0]:""})`);
  console.log(fail?"\n❌ 실패":"\n🎉 비전기술 장면 통과");
  await b.close(); process.exit(fail);
})();
