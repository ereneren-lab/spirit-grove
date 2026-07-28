// 전투 화면 본가 배치 회귀 (유저: "배틀화면 더 파고 들자").
//
// 예전: 상단바(브랜드·돈·도감·뱃지)가 전투 중에도 화면의 15%를 먹었고, 하단은 어두운 패널에
//       메시지 → 코치 → 메뉴가 **세로로 쌓여** 본가와 인상이 달랐다.
// 지금: 전투는 전체 화면(body.battling), 하단은 **메시지(크림 박스) 좌 · 행동 메뉴 우 2×2**.
//
// ⚠️ 함정(문서화된 것): 뷰를 실제로 열지 않으면 **모든 rect가 0**이라 겹침/배치 단정이 거짓 통과한다.
//    그래서 조우를 실제로 걸어 메뉴가 뜰 때까지 기다리고, "크기 > 0" 단정을 같이 둔다.
// ⚠️ 기술 메뉴는 본가처럼 하단 전체를 쓴다 → 2열 배치는 **메인 메뉴일 때만**(대조군으로 고정).
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  await p.evaluate(()=>{ const S=window.SG,G=S.freshState();
    G.party=[S.makeMon("foxfire",9),S.makeMon("shellow",8)]; G.pos={x:9,y:44}; G.items.potion=3;
    S.setG(G); S.flow.enterMap(true); });
  await p.waitForTimeout(500);

  console.log("\n[1] 맵에선 상단바가 보인다(대조군)");
  ok(await p.evaluate(()=>document.querySelector(".topbar").getBoundingClientRect().height>0), "맵 화면엔 상단바가 있다");

  await p.evaluate(()=>window.SG.flow.startEncounter(0.2));
  for(let i=0;i<60;i++){ const r=await p.evaluate(()=>!window.SG.G().busy &&
      document.getElementById("mainMenu").offsetParent!==null); if(r)break; await p.waitForTimeout(250); }

  console.log("\n[2] 전투는 전체 화면");
  const st=await p.evaluate(()=>{ const R=s=>{ const e=document.querySelector(s); if(!e)return null;
      const r=e.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}; };
    return { battling:document.body.classList.contains("battling"), top:R(".topbar"),
      field:R("#battleField"), msg:R("#battleMsg"), menu:R("#mainMenu"), log:R("#logBtn"),
      btns:[...document.querySelectorAll("#mainMenu .mbtn")].map(x=>{ const r=x.getBoundingClientRect();
        return {t:(x.textContent||"").trim(),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}; }) }; });
  ok(st.battling, "body.battling이 걸린다");
  ok(st.top.h===0, `전투 중 상단바가 사라진다 (높이 ${st.top.h})`);
  ok(st.field.h>380, `아레나가 넉넉하다 (높이 ${st.field.h})`);

  console.log("\n[3] 하단: 메시지 좌 · 메뉴 우 2×2 (본가 배치)");
  ok(st.msg.w>0&&st.menu.w>0, `메시지·메뉴가 실제로 그려졌다 (msg ${st.msg.w}px · menu ${st.menu.w}px)`);
  ok(st.msg.x+st.msg.w<=st.menu.x+2, `메시지가 메뉴 왼쪽에 있다 (msg 오른끝 ${st.msg.x+st.msg.w} ≤ menu 왼끝 ${st.menu.x})`);
  const rows=[...new Set(st.btns.map(b=>b.y))].sort((a,b)=>a-b);
  ok(rows.length>=2, `메뉴가 여러 줄로 놓인다 (${rows.length}줄)`);
  const firstRow=st.btns.filter(b=>b.y===rows[0]);
  ok(firstRow.length===2, `첫 줄에 버튼 2개(2열 격자) — ${firstRow.map(b=>b.t).join(" / ")}`);
  // 로그 버튼이 메뉴 버튼을 덮지 않는다(2열로 바꾸면서 실제로 겹쳤던 자리)
  const hit=st.btns.filter(x=>!(st.log.x+st.log.w<=x.x||x.x+x.w<=st.log.x||st.log.y+st.log.h<=x.y||x.y+x.h<=st.log.y));
  ok(hit.length===0, `로그 버튼이 메뉴를 덮지 않는다 ${hit.length?JSON.stringify(hit.map(h=>h.t)):""}`);

  console.log("\n[4] 메시지는 포켓몬풍 크림 박스");
  const msgSty=await p.evaluate(()=>{ const cs=getComputedStyle(document.getElementById("battleMsg"));
    return { bg:cs.backgroundImage+cs.backgroundColor, border:cs.borderTopWidth, color:cs.color }; });
  ok(/gradient|rgb\(2[45]\d|rgb\(2[3-5]\d/.test(msgSty.bg)||parseFloat(msgSty.border)>=2,
     `크림 박스 스타일 (테두리 ${msgSty.border})`);

  console.log("\n[5] 대조군: 기술 메뉴는 하단 전체를 쓴다");
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")].find(x=>/공격/.test(x.textContent||"")); if(b)b.click(); });
  await p.waitForTimeout(600);
  const mv=await p.evaluate(()=>{ const ui=document.querySelector("#battle .battle-ui");
    const mm=document.getElementById("moveMenu").getBoundingClientRect();
    return { row:ui.classList.contains("mainrow"), w:Math.round(mm.width), uiw:Math.round(ui.getBoundingClientRect().width) }; });
  ok(!mv.row, "기술 메뉴에선 2열 배치를 끈다");
  ok(mv.w>mv.uiw*0.7, `기술 메뉴가 하단 폭을 넓게 쓴다 (${mv.w}/${mv.uiw}px)`);

  console.log("\n[6] 전투가 끝나면 상단바가 돌아온다");
  await p.evaluate(()=>{ window.SG.flow.endBattle&&window.SG.flow.endBattle(); if(!document.getElementById("map").classList.contains("active"))window.SG.flow.enterMap(true); });
  await p.waitForTimeout(500);
  ok(await p.evaluate(()=>document.querySelector(".topbar").getBoundingClientRect().height>0), "맵 복귀 시 상단바 복원");

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs.length?": "+errs[0]:""})`);
  console.log(fail?"\n❌ 실패":"\n🎉 전투 화면 배치 통과");
  await b.close(); process.exit(fail);
})();
