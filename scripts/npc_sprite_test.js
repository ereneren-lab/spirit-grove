// NPC 스프라이트 재질 회귀 (유저: "npc재질을 업그레이드 시키고 싶어. 그리고 포켓몬처럼 서있으면 좋겠어").
//
// 예전 문제: 팔이 없어 몸통 블록으로 읽혔고, 눈이 **검정 사각형**이라 로봇 같았으며,
// 뒤에서 봐도 **뒤통수가 피부색**이라 얼굴이 뒤에 붙은 것처럼 보였다.
//
// 지금: 어깨에 붙은 팔 · 둥근 눈 + 하이라이트 · 뒷모습은 머리색 뒤통수 · 신발 구분 · 2단 접지 그림자.
//
// ⚠️ 검증 방식: 픽셀 비교 대신 **드로우 콜을 가로채 방향별 지문을 센다**(grassfx/map_autotile과 같은 기법).
//    눈 하이라이트(arc)는 정면 2개 · 측면 1개 · 뒷모습 0개여야 한다 — "뒤통수에 얼굴이 없다"를 이걸로 잡는다.
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  const r=await p.evaluate(()=>{
    const F=window.SG.Field;
    // fillStyle을 태그 삼아 드로우 콜을 분류한다(컨텍스트에서 읽을 수 있다)
    const run=(dir,moving,spec)=>{
      const rec={arc:0, eyeHi:0, rr:0, ellipse:0, fills:[]};
      let cur="";
      const ctx=new Proxy({},{
        get:(t,k)=>{
          if(k==="fillStyle"||k==="strokeStyle")return cur;
          if(k==="beginPath")return ()=>{};
          if(k==="arc")return ()=>{ rec.arc++; if(/255,\s*255,\s*255,\s*\.?9/.test(String(cur)))rec.eyeHi++; };
          if(k==="ellipse")return ()=>{ rec.ellipse++; };
          if(k==="fill")return ()=>{ rec.fills.push(String(cur)); };
          if(k==="createRadialGradient"||k==="createLinearGradient")
            return ()=>({addColorStop(){}});
          if(k==="canvas")return {width:600,height:600};
          if(k==="measureText")return ()=>({width:10});
          if(k==="save"||k==="restore"||k==="clip"||k==="translate"||k==="scale")return ()=>{};
          return ()=>{}; },
        set:(t,k,v)=>{ if(k==="fillStyle"||k==="strokeStyle")cur=v; return true; } });
      F._char(ctx, 100, 100, 96, JSON.parse(JSON.stringify(spec)), dir, 1.0, moving);
      return rec;
    };
    const plain={outfit:"#5a6f8a",accent:"#8aa0c0",skin:"#e8c39a",hair:"#3a2f24"};
    const capd ={outfit:"#d8503e",accent:"#2a2230",skin:"#e8b88a",hair:"#2a2a33",hat:"cap",hatc:"#33526a",boots:"#2c3a4a"};
    return { down:run("down",false,plain), up:run("up",false,plain),
             left:run("left",false,plain), right:run("right",false,plain),
             walk:run("down",true,plain), cap:run("down",false,capd) };
  });

  console.log("\n[1] 눈 — 둥글게 + 하이라이트 (사각형 블록 아님)");
  ok(r.down.eyeHi===2, `정면은 눈 2개에 하이라이트 (${r.down.eyeHi})`);
  ok(r.left.eyeHi===1 && r.right.eyeHi===1, `측면은 눈 1개 (좌 ${r.left.eyeHi} · 우 ${r.right.eyeHi})`);

  console.log("\n[2] 뒷모습엔 얼굴이 없다 (뒤통수)");
  ok(r.up.eyeHi===0, `위를 보면 눈을 안 그린다 (${r.up.eyeHi})`);
  ok(r.up.fills.some(c=>c==="#3a2f24"||/3a2f24/i.test(String(c))),
     "뒤통수를 머리색으로 덮는다(예전엔 피부색이 드러났다)");

  console.log("\n[3] 팔·신발 — 사람으로 읽히는 요소");
  // 팔 2개 + 신발 2개가 늘어난 만큼 rounded-rect 계열 채우기가 정면에서 더 많다
  ok(r.down.fills.length>=10, `정면 채우기 콜이 충분하다 (${r.down.fills.length}개 — 몸통·팔·다리·신발·머리)`);
  ok(r.left.fills.length < r.down.fills.length,
     `측면은 안쪽 팔이 가려져 콜이 더 적다 (측면 ${r.left.fills.length} < 정면 ${r.down.fills.length})`);

  console.log("\n[4] 접지 그림자 2단 · 걸음 애니");
  ok(r.down.ellipse>=2, `그림자가 2단이다 (ellipse ${r.down.ellipse})`);
  ok(r.walk.fills.length>=r.down.fills.length, "걷는 중에도 구성 요소가 유지된다");

  console.log("\n[5] 모자 등 장식은 그대로 동작");
  ok(r.cap.fills.length>r.down.fills.length-2, `모자 스프라이트도 정상 (${r.cap.fills.length}개)`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs.length?": "+errs[0]:""})`);
  console.log(fail?"\n❌ 실패":"\n🎉 NPC 스프라이트 통과");
  await b.close(); process.exit(fail);
})();
