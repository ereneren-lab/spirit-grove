// H3-8 회귀 — 핫싯 대전(로컬 2인 · 렌탈 3마리)이 팀 선택→은닉 패스→해소→기절 교체→승패까지 흐르는가.
// 왜: 엔진 리프(dbExec/damage)를 재사용하되 라운드 제어는 PvP 전용이다. 한 곳이 끊기면 대전이 멈춘다.
//     실제 게임처럼 DOM 버튼을 눌러 한 판을 끝까지 진행시켜 '승자 선언'이 나오는지 단정한다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  await p.evaluate(()=>{ window.SG.CONFIG.reduceMotion=true; window.SG.setG(window.SG.freshState()); });

  const menuHTML=()=>p.evaluate(()=>(document.getElementById("dbMenu")||{}).innerHTML||"");
  const logHTML=()=>p.evaluate(()=>(document.getElementById("dbLog")||{}).innerHTML||"");
  const click=sel=>p.evaluate(s=>{ const el=document.querySelector(s); if(el){el.click();return true;} return false; },sel);
  const clickAll=async(sel,n)=>{ for(let i=0;i<n;i++){ await p.evaluate(o=>{ const els=[...document.querySelectorAll(o.s)]; if(els[o.i])els[o.i].click(); },{s:sel,i}); await p.waitForTimeout(30); } };
  const go=async()=>{ // pass 화면이면 준비완료 누르기
    for(let i=0;i<3;i++){ if(await click("#pvpGo")){ await p.waitForTimeout(60); return true; } await p.waitForTimeout(40); } return false; };

  // ── 시작 ──
  await p.evaluate(()=>window.SG.flow.startHotSeat());
  await p.waitForTimeout(120);
  ok(await p.evaluate(()=>(document.getElementById("dbOverlay")||{}).classList&&document.getElementById("dbOverlay").classList.contains("active")), "핫싯 오버레이가 열린다");
  ok(/정령 선택/.test(await menuHTML()), "P1 정령 선택 화면이 뜬다");

  // ── P1 3마리 선택 → 확정 → 패스 ──
  await clickAll(".pvppick",3); await p.waitForTimeout(50);
  ok(await click("#pvpConfirm"), "P1이 3마리 확정");
  await p.waitForTimeout(50); await go();
  ok(/정령 선택/.test(await menuHTML()), "P2 정령 선택으로 넘어간다");
  // ── P2 3마리(뒤에서부터) → 확정 → 패스 → 대전 시작 ──
  await p.evaluate(()=>{ const els=[...document.querySelectorAll(".pvppick")]; [11,10,9].forEach(i=>els[i]&&els[i].click()); });
  await p.waitForTimeout(50);
  ok(await click("#pvpConfirm"), "P2가 3마리 확정");
  await p.waitForTimeout(50); await go(); await p.waitForTimeout(80);
  ok(/대전 시작/.test(await logHTML()), "3:3 대전이 시작된다");
  ok(/의 행동/.test(await menuHTML()), "P1 행동 선택이 뜬다");

  // ── 한 판을 끝까지 자동 진행 ──
  let guard=0, winner=false;
  while(guard++<400){
    const html=await menuHTML();
    if(/승리!/.test(await logHTML())){ winner=true; break; }
    if(/준비 완료/.test(html)){ await go(); continue; }               // 은닉 패스
    // 행동/교체 선택: 첫 공격기(없으면 첫 버튼) 클릭
    const acted=await p.evaluate(()=>{
      const m=document.getElementById("dbMenu"); if(!m)return false;
      // 강제/일반 교체 리스트면 첫 교체 대상
      const si=m.querySelector(".dbmv[data-si]");
      const mv=[...m.querySelectorAll(".dbmv[data-k]")].find(b=>!b.disabled);
      const btn=mv||si; if(btn){ btn.click(); return true; } return false;
    });
    if(!acted){ await p.waitForTimeout(50); }
    await p.waitForTimeout(70);
  }
  ok(winner, `한 판이 승자 선언으로 끝난다 (턴 진행 ${guard})`);
  ok(/승리/.test(await menuHTML()), "종료 화면에 승자·다시/끝내기 버튼이 뜬다");

  // ── 끝내기 → 상태 복구 ──
  await click("#pvpDone"); await p.waitForTimeout(80);
  const st=await p.evaluate(()=>({ inb:window.SG.G().inBattle, pvp:!!window.SG.G()._pvp, open:(document.getElementById("dbOverlay")||{}).classList.contains("active") }));
  ok(!st.inb && !st.pvp && !st.open, "끝내기 후 전투 상태·오버레이가 정리된다");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 핫싯 대전 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
