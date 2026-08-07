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

  /* [6] 구조 단정 — **모든 인물 타일이 공용 렌더러를 지난다**
     ⚠️ 예전엔 실내 인물(간호사·회관 3인·여명 관장·설산 주인)이 각자 따로 그려져서,
        오버월드 NPC만 개선했더니 실내는 그대로 남았다(유저 제보: "실내 npc들도 손을 봐야지").
        개별 외형을 세는 대신 "공용 렌더러를 지나는가"를 잡아야 이 부류가 재발하지 않는다. */
  console.log("\n[6] 실내 인물도 공용 렌더러(_char)를 지난다");
  const via=await p.evaluate(()=>{
    const F=window.SG.Field, S=window.SG;
    if(!S.G()){ const g=S.freshState(); g.party=[S.makeMon("foxfire",5)]; S.setG(g); }   // 렌더는 G를 읽는다
    const cases=[["N","center","간호사"],["N","shop","점원"],["N","shrine","신전 로어"],
                 ["p","hall","감정사"],["n","hall","이름 짓는 사람"],["s","hall","마사지사"],
                 ["L","isle","여명 관장"],["Q","snowfield","설산의 주인"]];
    const noop=()=>{};
    const out=[];
    for(const [t,indoor,label] of cases){
      const G=S.G(); const _old=G.indoor; G.indoor=indoor; G.defeated=new Set();
      let called=0; const orig=F._char; F._char=function(){ called++; };
      const ctx=new Proxy({},{ get:(o,k)=>{
          if(k==="canvas")return {width:600,height:600};
          if(k==="measureText")return ()=>({width:10});
          if(k==="createLinearGradient"||k==="createRadialGradient")return ()=>({addColorStop(){}});
          return typeof k==="string"?noop:undefined; }, set:()=>true });
      try{ F._tile(ctx,t,0,0,32,4,4,1); }catch(e){}
      F._char=orig; G.indoor=_old;
      out.push({label,t,indoor,called});
    }
    return out; });
  via.forEach(v=>ok(v.called>0, `${v.label} (${v.indoor}/${v.t}) — _char 사용 ${v.called}회`));

  /* [7] 타일 위 트레이너도 전부 스프라이트 — 이모지 폴백 0
     ⚠️ 예전엔 관장 4명(1~4)과 숲의 군주(X)만 spr이 있어 **견습생·가드·엘리트4·챔피언이 전부 이모지**였다.
        필드 NPC 42명은 다 스프라이트였는데 실내만 조악했던 원인. 손으로 채우면 병렬 테이블이 되니
        키 해시로 파생하고, 여기서 "이모지로 떨어지는 트레이너 0명"을 강제한다. */
  console.log("\n[7] 타일 트레이너 스프라이트 (이모지 폴백 0)");
  const tr=await p.evaluate(()=>{
    const S=window.SG, GT="789abcdef0ijklqruvyh*?".split("").concat(["1","2","3","4","5","6","X"]);
    const miss=[], have=[];
    GT.forEach(k=>{ if(!S.TRAINERS[k])return;
      const sp=S.flow.trainerSpr(k);
      (sp?have:miss).push(k+"("+(S.TRAINERS[k].name||"")+")"); });
    // 파생 결과가 서로 구분되는지(전부 같은 색이면 의미 없다)
    const outfits=new Set(GT.filter(k=>S.TRAINERS[k]).map(k=>(S.flow.trainerSpr(k)||{}).outfit));
    return {miss, n:have.length, variety:outfits.size}; });
  ok(tr.miss.length===0, `이모지로 떨어지는 타일 트레이너 0명 (스프라이트 ${tr.n}명)${tr.miss.length?" — "+tr.miss.join(", "):""}`);
  ok(tr.variety>=4, `트레이너끼리 외형이 구분된다 (옷 색 ${tr.variety}종)`);

  /* [8] 엘리트4·챔피언은 견습생과 실루엣이 다르다(밀짚모자 쓴 엘리트는 농부로 보인다) */
  console.log("\n[8] 리그는 격이 다른 차림새");
  const lg=await p.evaluate(()=>{ const S=window.SG;
    const league=["i","j","k","l","q"].filter(k=>S.TRAINERS[k]).map(k=>S.flow.trainerSpr(k));
    const rookie=["7","8","9","0"].filter(k=>S.TRAINERS[k]).map(k=>S.flow.trainerSpr(k));
    return { leagueHats:[...new Set(league.map(s=>s.hat))], allBoss:league.every(s=>!!s.boss),
      rookieStraw:rookie.some(s=>s.hat==="straw") }; });
  ok(lg.leagueHats.length===1&&lg.leagueHats[0]==="hood", `리그는 전원 후드 (${lg.leagueHats.join(",")})`);
  ok(lg.allBoss, "리그는 전원 보스 오라");
  ok(lg.rookieStraw, "견습생 쪽엔 밀짚모자가 남아 있다(테마 파생이 살아 있다는 대조군)");

  /* [9] 트레이너 전투 인트로 — 본인이 서 있다가 볼을 던진다
     ⚠️ 처음엔 setupBattleUI가 와이프에 덮인 동안 상대를 바로 내보내서 **한 프레임도 안 보였다**(실측).
        "요소를 만들었다"와 "화면에 보인다"는 다르다 → 와이프가 걷힌 뒤에도 남아 있는지 본다. */
  console.log("\n[9] 트레이너 전투 인트로");
  await p.evaluate(()=>{ const S=window.SG,G=S.freshState(); G.party=[S.makeMon("foxfire",22)];
    G.pos={x:8,y:44}; S.setG(G); S.flow.enterMap(true); S.flow.startTrainer("8"); });
  await p.waitForTimeout(1500);
  await p.evaluate(()=>{ if(document.querySelector("#dialogBox.show"))window.SG.flow.advanceDialog(); });
  await p.waitForTimeout(760);
  const it=await p.evaluate(()=>{ const c=document.getElementById("trainerIntro");
    const w=document.getElementById("battleWipe");
    return { has:!!c, w:c?Math.round(c.getBoundingClientRect().width):0,
      wipeGone:!w||!w.classList.contains("go") }; });
  ok(it.has && it.w>40, `와이프가 걷힌 뒤에도 트레이너가 서 있다 (폭 ${it.w}px)`);
  await p.waitForTimeout(5200);
  const done=await p.evaluate(()=>({ gone:!document.getElementById("trainerIntro"),
    menu:document.getElementById("mainMenu").style.display, inB:!!window.SG.G().inBattle }));
  ok(done.gone, "정령이 나온 뒤 트레이너는 물러난다");
  ok(done.inB && done.menu==="grid", "인트로 후 전투 메뉴가 정상 표시된다(흐름이 멈추지 않는다)");

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs.length?": "+errs[0]:""})`);
  console.log(fail?"\n❌ 실패":"\n🎉 NPC 스프라이트 통과");
  await b.close(); process.exit(fail);
})();
