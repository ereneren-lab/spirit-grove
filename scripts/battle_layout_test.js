// 전투 화면 레이아웃 회귀 — HUD를 덮는 요소가 없는지 **실제 좌표로** 본다.
//
// 왜 있나: 스크린샷 검수에서 두 건이 나왔다.
//   · "가랏! X!" 등장 라벨이 좌상단(top:10px)에 떠서 **적 HUD의 이름/HP를 덮었다**
//   · 날씨 칩(#weatherBadge)도 좌상단이라 같은 자리에서 적 이름을 덮었다
//   · 타입칩 행이 justify-content:space-between이라 2타입이면 양끝으로 벌어져 빈 상자처럼 보였다
// 눈으로만 잡히는 종류라 좌표 단정으로 고정한다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  process.on("uncaughtException", async e=>{ console.log("❌ 예외:",e.message); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 2타입 상대로 **실제 전투 화면**을 띄운다.
  // ⚠️ setupBattleUI만 부르면 #battle 뷰가 활성화되지 않아 모든 rect가 0이 되고,
  //    겹침 단정이 전부 거짓 통과한다(실제로 겪었다). 조우를 걸어 화면 전환까지 시킨 뒤 상대만 바꾼다.
  await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("foxfire",12)]; G.pos={x:8,y:45}; F.enterMap(true); G.busy=false; F.startEncounter(0.3); });
  await p.waitForTimeout(2600);   // 와이프 + 순차 인트로가 끝나 메뉴가 뜰 때까지
  await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.G().foe=S.makeMon("hedgemoss",14); F.setupBattleUI(); });
  await p.waitForTimeout(500);

  const r=await p.evaluate(()=>{
    const field=document.getElementById("battleField");
    const fr=field.getBoundingClientRect(), fArea=fr.width*fr.height;
    const overlapsOf=(sel)=>{ const row=document.querySelector(sel); if(!row)return null;
      const hb=row.getBoundingClientRect(); const bad=[];
      document.querySelectorAll("#battle *").forEach(el=>{
        const b=el.getBoundingClientRect(); if(!b.width||!b.height)return;
        if(el.closest(sel))return;                       // HUD 자신과 그 자식
        if(el.contains(row))return;                      // 조상(필드·화면 컨테이너)
        if(b.width*b.height > fArea*0.5)return;          // 배경 레이어(필드 전체를 덮는 것)
        // HUD보다 **뒤에 있는** 것은 덮을 수 없다(발판 .platform 등 장식) — z-index로 거른다
        const z=parseInt(getComputedStyle(el).zIndex,10), rz=parseInt(getComputedStyle(row).zIndex,10)||0;
        if(!isNaN(z) && z<rz)return;
        if(b.x<hb.x+hb.width && b.x+b.width>hb.x && b.y<hb.y+hb.height && b.y+b.height>hb.y)
          bad.push((el.id?"#"+el.id:el.tagName.toLowerCase()+"."+el.className)+` "${(el.textContent||"").trim().slice(0,10)}"`);
      });
      return {rect:{x:Math.round(hb.x),y:Math.round(hb.y),w:Math.round(hb.width),h:Math.round(hb.height)}, bad};
    };
    const t1=document.getElementById("foeType"), t2=document.getElementById("foeType2");
    const gap=(t1&&t2)?Math.round(t2.getBoundingClientRect().x-(t1.getBoundingClientRect().x+t1.getBoundingClientRect().width)):null;
    return { foe:overlapsOf(".foe-row"), me:overlapsOf(".me-row"), gap, hasT2:!!t2 };
  });

  // ⚠️ 헛도는 단정 방지 — 뷰가 숨겨져 있으면 모든 rect가 0이라 "겹침 없음"이 거짓으로 통과한다.
  ok(r.foe && r.foe.rect.w>50 && r.foe.rect.h>30, `적 HUD가 실제로 그려져 있다 (${r.foe?`${r.foe.rect.w}x${r.foe.rect.h} @${r.foe.rect.x},${r.foe.rect.y}`:"없음"})`);
  ok(r.me && r.me.rect.w>50 && r.me.rect.h>30, `내 HUD가 실제로 그려져 있다 (${r.me?`${r.me.rect.w}x${r.me.rect.h}`:"없음"})`);
  ok(r.foe && r.foe.bad.length===0, `적 HUD를 덮는 요소 없음 (${r.foe?r.foe.bad.join(", ")||"없음":"HUD 못 찾음"})`);
  ok(r.me && r.me.bad.length===0, `내 HUD를 덮는 요소 없음 (${r.me?r.me.bad.join(", ")||"없음":"HUD 못 찾음"})`);
  ok(r.hasT2, "2타입 상대는 타입칩이 2개");
  ok(r.gap!==null && r.gap>=0 && r.gap<=12, `타입칩 2개가 나란히 붙어 있다 (간격 ${r.gap}px — space-between이면 100px 넘게 벌어진다)`);

  // 등장 라벨: 인트로 동안 적 HUD를 덮지 않아야 한다
  const lab=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; const G=S.G();
    G.busy=false; G.inBattle=true;
    F.renderCombatants();
    const field=document.getElementById("battleField");
    // 라벨을 실제 등장 애니로 띄운다
    const pr=F.sendOutAnim?F.sendOutAnim("me"):null;
    await new Promise(r=>setTimeout(r,260));
    const el=document.querySelector(".sendlabel");
    if(!el)return {found:false};
    const b=el.getBoundingClientRect(), hb=document.querySelector(".foe-row").getBoundingClientRect();
    const hit=b.x<hb.x+hb.width&&b.x+b.width>hb.x&&b.y<hb.y+hb.height&&b.y+b.height>hb.y;
    return {found:true, hit, y:Math.round(b.y), hudY:Math.round(hb.y+hb.height)};
  });
  if(lab.found && lab.hudY>0) ok(!lab.hit, `등장 라벨이 적 HUD를 안 덮는다 (라벨 y=${lab.y} · HUD 하단 y=${lab.hudY})`);
  else console.log("  ℹ️  등장 라벨을 관측하지 못했다(타이밍/뷰 숨김) — 좌표 단정 생략");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 전투 레이아웃 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
