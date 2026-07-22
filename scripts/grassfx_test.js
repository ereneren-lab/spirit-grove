// 풀숲 게임필 회귀: (1) 밟은 칸 술렁임 (2) 풀숲에 서면 하체가 풀에 가림 (3) 달릴 때 발밑 먼지.
// 캔버스 그림은 픽셀로 재면 깨지기 쉬워, **각 효과가 쓰는 고유 색을 태그 삼아 드로우 콜을 센다**
// (fillStyle/strokeStyle은 컨텍스트에서 읽을 수 있다). 셋 다 reduceMotion이면 완전히 꺼져야 한다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  process.on("uncaughtException", async e=>{ console.log("❌ 예외:",e.message); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 실제 키 입력으로 풀숲(T)에 걸어 들어가면 onArrived가 술렁임을 기록한다
  const walked=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("sproutcat",20)];
    // 풀숲(T)과 그 아래 보행 가능한 칸을 찾아 아래에 선다
    F.enterMap(true);
    for(let y=41;y<48;y++)for(let x=1;x<24;x++){
      if(F.tileAt(x,y)==="T" && F.walkable(x,y) && F.walkable(x,y+1)){ G.pos={x,y:y+1}; S.Field.player={x,y:y+1}; S.Field.target={x,y:y+1}; S.Field.arrived=true; return {x,y}; } }
    return null; });
  ok(!!walked, `풀숲 진입 지점 확보 (${walked&&walked.x},${walked&&walked.y})`);
  await p.evaluate(()=>{ window.SG.Field._rustles=[]; });
  await p.keyboard.press("ArrowUp"); await p.waitForTimeout(400);
  const r1=await p.evaluate(()=>({n:(window.SG.Field._rustles||[]).length, tile:window.SG.flow.tileAt(window.SG.G().pos.x,window.SG.G().pos.y)}));
  ok(r1.tile==="T" && r1.n>=1, `풀숲을 밟으면 술렁임이 기록된다 (tile=${r1.tile} · ${r1.n}건)`);

  // reduceMotion이면 기록 자체를 안 한다(불필요한 상태 축적 방지)
  const r2=await p.evaluate(()=>{ const S=window.SG; S.CONFIG.reduceMotion=true; S.Field._rustles=[];
    S.Field.rustle(3,3); const n=(S.Field._rustles||[]).length; S.CONFIG.reduceMotion=false; return n; });
  ok(r2===0, `reduceMotion이면 술렁임을 기록하지 않는다 (${r2}건)`);

  // 드로우 콜 계측 — 효과별 고유 색을 태그로 센다
  const fx=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("sproutcat",20)]; F.enterMap(true);
    const M=S.Field, ctx=M.ctx, ts=60;
    const proto=CanvasRenderingContext2D.prototype, oa=proto.arc, oe=proto.ellipse, os=proto.stroke;
    const c={dust:0,leaf:0,blade:0}, zero=()=>{ c.dust=0; c.leaf=0; c.blade=0; };
    proto.arc=function(){ if(this.fillStyle==="#d8cbb0")c.dust++; return oa.apply(this,arguments); };
    proto.ellipse=function(){ if(this.fillStyle==="#7bd07b")c.leaf++; return oe.apply(this,arguments); };
    proto.stroke=function(){ if(this.strokeStyle==="#4e9c52")c.blade++; return os.apply(this,arguments); };
    // 풀숲 칸 하나를 찾아 그 위에 세운다(ox/oy=0이라 화면 안에 들어오는 좌표여야 한다)
    let gt=null; for(let y=41;y<48&&!gt;y++)for(let x=1;x<8;x++){ if(F.tileAt(x,y)==="T"){ gt={x,y}; break; } }
    const draw=(opt)=>{ zero(); G.running=!!opt.running; M.dir="up";
      M.player={x:opt.onGrass?gt.x:0, y:opt.onGrass?gt.y:0};
      // 술렁임은 플레이어와 같은 칸에 둔다 — ox/oy 보정이 그 칸 기준이라 다른 칸이면 화면 밖으로 잘린다
      if(opt.rustle){ M._rustles=[{x:gt.x,y:gt.y,born:performance.now()/1000}]; } else { M._rustles=[]; }
      // ox/oy를 타일 좌표만큼 되돌려 대상 칸이 화면 안에 오게 한다
      const ox=opt.onGrass?-gt.x*ts+ts:0, oy=opt.onGrass?-gt.y*ts+ts:0;
      M._grassFx(ctx,ox,oy,ts,performance.now()/1000,200,200,!!opt.moving);
      return {...c}; };
    const dash=draw({running:true,moving:true,onGrass:true,rustle:true});
    const walk=draw({running:false,moving:true,onGrass:true,rustle:false});
    const idleOff=draw({running:true,moving:false,onGrass:false,rustle:false});
    S.CONFIG.reduceMotion=true;
    const off=draw({running:true,moving:true,onGrass:true,rustle:true});
    S.CONFIG.reduceMotion=false;
    proto.arc=oa; proto.ellipse=oe; proto.stroke=os;
    return {gt,dash,walk,idleOff,off}; });

  ok(fx.dash.dust>0, `달릴 때 발밑 먼지 (${fx.dash.dust}회)`);
  ok(fx.walk.dust===0, `걸을 땐 먼지 없음 — 러닝이 실제로 빨라 보이는 이유 (${fx.walk.dust}회)`);
  ok(fx.dash.blade>0, `풀숲에 서면 하체가 풀에 가린다 (${fx.dash.blade}획)`);
  ok(fx.idleOff.blade===0, `풀숲이 아니면 가림막 없음 (${fx.idleOff.blade}획)`);
  ok(fx.dash.leaf>0, `술렁임 잎이 튄다 (${fx.dash.leaf}장)`);
  ok(fx.walk.leaf===0, "술렁임이 없으면 잎도 없다");
  ok(fx.idleOff.dust===0, "멈춰 있으면 먼지 없음");
  ok(fx.off.dust===0 && fx.off.blade===0 && fx.off.leaf===0,
     `reduceMotion이면 셋 다 꺼진다 (먼지 ${fx.off.dust}·잔디 ${fx.off.blade}·잎 ${fx.off.leaf})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 풀숲 게임필 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
