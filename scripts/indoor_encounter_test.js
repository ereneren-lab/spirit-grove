// 특수 지역 야생 조우 회귀 — **실제로 걸어서** 조우가 걸리는지 본다.
//
// 왜 이 테스트가 필요한가:
//   조우 함수(startMarshEncounter 등)와 조우 풀은 멀쩡했는데, onArrived의 실내 블록이
//   조우 굴림보다 앞에서 return해 **특수 지역 11곳의 야생 조우가 한 번도 걸리지 않았다.**
//   기존 회귀들은 그 함수를 직접 호출해 통과시켰기 때문에 오래 안 들켰다.
//   → 여기서는 함수를 부르지 않고 **키 입력으로 걸어서** 조우가 실제로 발생하는지만 본다.
//
// ⚠️ 확률적이라 지역별 하드 임계값을 좁게 걸지 않는다. 전 지역 합계로 "굴림이 살아 있다"만 강제하고,
//    지역별 수치는 참고 출력한다(CLAUDE.md의 몬테카를로 원칙).
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  process.on("uncaughtException", async e=>{ console.log("❌ 예외:",e.message); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 인테리어에 들어가 조우 타일 위를 좌우로 왕복하며 전투 발생을 센다.
  const walk=async(which,steps)=>{
    await p.evaluate(async(w)=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
      G.party=[S.makeMon("foxfire",30)];
      "1234567890abcdefijklqruvyh*?XANS".split("").forEach(c=>G.defeated.add(c));   // 가드 개방
      F.enterMap(true); F.enterInterior(F.INTERIORS[w]); }, which);
    await p.waitForTimeout(700);   // ⚠️ enterInterior는 warpFade 지연 스왑(150ms)
    const spot=await p.evaluate((w)=>{ const S=window.SG,F=S.flow,I=F.INTERIORS[w];
      const encTile=c=>c==="g"||c==="T"||c===".";
      for(let y=1;y<I.H-1;y++)for(let x=1;x<I.W-1;x++){
        if(encTile(F.tileAt(x,y))&&encTile(F.tileAt(x+1,y))&&F.walkable(x,y)&&F.walkable(x+1,y)){
          const G=S.G(); G.pos={x,y}; S.Field.player={x,y}; S.Field.target={x,y}; S.Field.arrived=true; return {x,y}; } }
      return null; }, which);
    let n=0, sample=[];
    for(let i=0;i<steps && spot;i++){
      await p.keyboard.press(i%2?"ArrowLeft":"ArrowRight"); await p.waitForTimeout(80);
      const st=await p.evaluate(()=>({b:window.SG.G().inBattle, id:window.SG.G().foe&&window.SG.G().foe.id, lv:window.SG.G().foe&&window.SG.G().foe.level, indoor:window.SG.G().indoor}));
      if(st.b){ n++; if(sample.length<3)sample.push(`${st.id} Lv${st.lv}`);
        await p.evaluate(()=>{ const G=window.SG.G(); G.inBattle=false; G.foe=null; G.busy=false; }); } }
    return {spot,n,sample};
  };

  // ⚠️ **지선 루트가 이 목록에서 통째로 빠져 있었다** — 특수 지역만 보고 루트는 안 봤다.
  //    루트도 같은 `onArrived` 실내 블록을 지나므로 같은 방식으로 죽을 수 있다. 6개 전부 넣는다.
  const REGIONS=["cave","lavacave","marsh","snowfield","skyridge","ruins","crater","garden",
                 "mine","hillpath","pier","frostpass","mosshollow","fallspath"];
  let total=0, dead=[];
  for(const r of REGIONS){
    const res=await walk(r,30);
    total+=res.n;
    if(!res.n)dead.push(r);
    console.log(`     ${r.padEnd(10)} 30걸음 → 조우 ${res.n}회 ${res.sample.length?"("+res.sample.join(", ")+")":""}`);
  }
  // ⚠️ 몬테카를로다 — **지역별 하드 임계값은 걸지 않는다**(부하가 걸리면 입력이 스로틀돼 걸음 수가 줄어든다).
  //    게이트는 전 지역 합계 하나뿐이고, 지역별 0회는 참고 출력으로만 남긴다(CLAUDE.md 원칙).
  ok(total>=4, `특수 지역 조우 굴림이 살아 있다 (${REGIONS.length}지역 합계 ${total}회 · 수정 전에는 0회였다)`);
  if(dead.length)console.log(`     ℹ️  이번 실행에서 0회였던 지역: ${dead.join(", ")} (확률 문제일 수 있음 — 합계로 판단)`);

  // 체육관2에는 T, 정령 리그에는 g 타일이 있다. 여기서 오버월드 조우가 걸리면 안 된다
  // (걸리면 wildFloor()가 인테리어 좌표를 지역으로 읽어 엉뚱한 고레벨 야생이 나온다).
  for(const gym of ["gym2","league"]){
    const res=await walk(gym,26);
    ok(res.n===0, `${gym} 안에서는 야생이 안 나온다 (${res.n}회)`);
  }

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 특수 지역 조우 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
