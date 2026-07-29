// 가로 모드 패널 회귀 (유저 제보: "가로 모드에서 지도 들어갔을 때, 닫을 수가 없어 ㅠㅠ").
//
// 무엇이 문제였나: `#minimap`은 **`.overlay`가 아니라 별도 패널**이라 CLAUDE.md의 「가로 오버레이 최적화」에서
// 통째로 빠져 있었다. 세로용으로 캔버스가 280×430인데 가로 높이는 ~390이라 **닫기 버튼이 화면 밖으로 밀리고**,
// `CANCELABLE_OVERLAYS`에도 없어 **Escape·B도 안 먹었다** → 리로드 말곤 못 벗어난다.
//
// ⚠️ 이 테스트가 잡으려는 건 "지도 하나"가 아니라 **"열 수 있는데 못 닫는 패널"이라는 종(種)**이다.
//    그래서 개별 패널을 손으로 나열해 눈으로 확인하는 대신, 열리는 패널마다 **같은 두 단정**을 건다:
//      (1) 보이는 닫기 컨트롤이 **스테이지 안**에 있다(실좌표로 판정 — 밖으로 밀리면 못 누른다)
//      (2) **Escape로도 닫힌다**(버튼이 가려지거나 못 눌러도 탈출로가 하나 더 있다)
//    세로에서도 같이 재서 "가로만 고치고 세로를 깨뜨리는" 회귀를 막는다.
// ⚠️ 오버레이를 **실제로 열지 않으면 rect가 전부 0**이라 "밖으로 안 나감"이 거짓 통과한다
//    (battle_layout·pc_card에서 이미 두 번 밟은 함정) → 열렸는지를 먼저 단정한다.
const { chromium } = require("playwright"); const path=require("path");

const PANELS=[
  {id:"minimap",    btn:"openMinimap", ko:"지도"},
  {id:"dexOverlay", btn:"openDex",     ko:"도감"},
  {id:"bagOverlay", btn:"openBag",     ko:"가방"},
  {id:"pcOverlay",  btn:"openPC",      ko:"정령"},
  {id:"cardOverlay",btn:"openCard",    ko:"카드"},
  {id:"warpOverlay",btn:"openWarp",    ko:"귀환"},
  {id:"setOverlay", btn:"settingsBtn", ko:"설정"},
];

(async()=>{
  const b=await chromium.launch();
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });

  const run=async(label,w,h)=>{
    console.log(`\n[${label}] ${w}×${h}`);
    const p=await b.newPage({viewport:{width:w,height:h}});
    const errs=[]; p.on("pageerror",e=>errs.push(e.message));
    await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
    // 중반 상태 — 칩·목록이 다 차 있어야 실제 크기가 나온다(시작 상태는 비어 있어 안 넘친다)
    await p.evaluate(()=>{ const S=window.SG,G=S.freshState();
      G.party=[S.makeMon("foxfire",30),S.makeMon("shellow",28),S.makeMon("pebblet",26)];
      G.badges=["1","2"]; G.money=9999; G.items.potion=5; G.items.ball=9;
      G.caught.add("foxfire"); G.seen.add("foxfire");
      S.setG(G); S.flow.enterMap(true); });
    await p.waitForTimeout(500);

    for(const pn of PANELS){
      const r=await p.evaluate(async(pn)=>{
        const b=document.getElementById(pn.btn); if(!b)return {err:"버튼 없음: "+pn.btn};
        b.click(); await new Promise(r=>setTimeout(r,320));
        const el=document.getElementById(pn.id); if(!el)return {err:"패널 없음: "+pn.id};
        const open=el.classList.contains("active");
        const st=document.getElementById("stage")||document.body;
        const sr=st.getBoundingClientRect();
        const vis=x=>x.offsetParent!==null && !x.disabled;
        const closer=[...el.querySelectorAll("button")].filter(vis)
          .find(x=>/✕|×|닫기/.test(x.textContent||""))||null;
        const cr=closer?closer.getBoundingClientRect():null;
        return { open,
          stage:{top:Math.round(sr.top),bottom:Math.round(sr.bottom),left:Math.round(sr.left),right:Math.round(sr.right)},
          closer: closer?{ top:Math.round(cr.top),bottom:Math.round(cr.bottom),left:Math.round(cr.left),right:Math.round(cr.right),
            size:Math.round(cr.width)+"×"+Math.round(cr.height),
            inside: cr.top>=sr.top-1 && cr.bottom<=sr.bottom+1 && cr.left>=sr.left-1 && cr.right<=sr.right+1 }:null };
      }, pn);

      if(r.err){ ok(false, `${pn.ko}(${pn.id}): ${r.err}`); continue; }
      ok(r.open, `${pn.ko}: 열린다`);
      // ⚠️ 크기 0이면 "밖으로 안 나갔다"가 거짓 통과한다 → 실제로 그려졌는지 같이 본다
      ok(!!r.closer && r.closer.size!=="0×0", `${pn.ko}: 보이는 닫기 컨트롤이 있다 ${r.closer?r.closer.size:""}`);
      if(r.closer)ok(r.closer.inside,
        `${pn.ko}: 닫기 컨트롤이 화면 안에 있다 (${r.closer.top}~${r.closer.bottom} / 스테이지 ${r.stage.top}~${r.stage.bottom})`);

      await p.keyboard.press("Escape"); await p.waitForTimeout(260);
      const esc=await p.evaluate(id=>{ const el=document.getElementById(id); return !!el && !el.classList.contains("active"); }, pn.id);
      ok(esc, `${pn.ko}: Escape로 닫힌다`);
      await p.evaluate(id=>{ const el=document.getElementById(id); if(el)el.classList.remove("active"); }, pn.id);
      await p.waitForTimeout(120);
    }
    ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs.length?": "+errs[0]:""})`);
    await p.close();
  };

  await run("가로", 844, 390);   // iPhone 가로 — @media (orientation:landscape) and (max-height:600px)
  await run("세로", 430, 760);   // 대조군: 가로를 고치다 세로를 깨뜨리지 않았는지

  console.log(fail?"\n❌ 실패":"\n🎉 가로 패널 통과");
  await b.close(); process.exit(fail);
})();
