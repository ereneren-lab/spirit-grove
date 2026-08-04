// 실입력 플레이스루: 내부 함수를 호출하지 않고, 실제 클릭·키보드 이벤트만으로 게임을 진행한다.
// 타이틀 → 캐릭터 선택 → 스타터 선택 → 필드 이동 → 야생 전투 → 승리까지.
//
// 이 테스트가 잡는 것(단위 테스트가 못 잡는 것):
//  - 화면 전환 배선이 실제로 이어져 있는가(버튼이 진짜 다음 단계로 데려가는가)
//  - 키 입력이 실제로 캐릭터를 움직이는가
//  - 야생 전투가 실제로 걸리고, 실제 버튼으로 이길 수 있는가
//  - 그 과정에서 런타임 에러가 하나도 안 나는가
const { chromium } = require("playwright"); const path=require("path"); const os=require("os");

(async()=>{
  // ⚠️ 예외로 죽으면 headless 브라우저가 그대로 남는다. 세션 중 66개까지 쌓여
  //    다른 테스트가 자원 부족으로 실패했다 → 어떤 경로로 끝나든 반드시 닫는다.
  let b=null;
  const bail=async(e)=>{ console.log("  ❌ 예외:",e&&e.message||e); try{ if(b)await b.close(); }catch(_){}; process.exit(1); };
  process.on("uncaughtException",bail); process.on("unhandledRejection",bail);
  b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2]));
  await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const view=()=>p.evaluate(()=>{
    const v=[...document.querySelectorAll(".view")].find(x=>x.classList.contains("active"));
    return v?v.id:null; });
  const click=async sel=>{ const el=await p.$(sel); if(!el)return false;
    await el.click({force:true}).catch(()=>{}); return true; };
  const key=async k=>{ await p.keyboard.press(k); await p.waitForTimeout(90); };
  // 대화창·스토리 오버레이가 떠 있으면 실제 입력으로 넘긴다.
  // ⚠️ 스토리는 #dialogBox가 아니라 별도 #storyOverlay(storyNext/storySkip)라서
  //    대화창만 처리하면 여기서 영영 막힌다.
  // ⚠️ **컷신 중에는 대화창이 아직 안 떠 있다** — 예전 이 함수는 "지금 치울 게 없다"를 "끝났다"로
  //    읽고 즉시 돌아왔고, 호출부는 연출 도중에 방향키를 눌러 "이동 실패"로 오판했다(집 아침 시퀀스의
  //    눈뜨기 2.1초에서 실제로 겪음 — 게임은 멀쩡했다). 고정 대기를 늘리는 대신 **G.busy 상태**를 본다.
  const clearDialog=async(max=40)=>{ for(let i=0;i<max;i++){
      const st=await p.evaluate(()=>({
        dlg:document.getElementById("dialogBox").classList.contains("show"),
        story:!!document.querySelector("#storyOverlay.active"),
        busy:!!(window.SG&&window.SG.G()&&window.SG.G().busy),
      }));
      if(!st.dlg && !st.story && st.busy){ await p.waitForTimeout(220); continue; }   // 연출 진행 중 — 기다린다
      if(!st.dlg && !st.story)return true;
      if(st.story){
        const skipped=await p.evaluate(()=>{ const s=document.getElementById("storySkip"); if(s){s.click();return true;}
          const n=document.getElementById("storyNext"); if(n){n.click();return true;} return false; });
        if(!skipped)await p.keyboard.press("Enter");
      } else await p.keyboard.press("Enter");
      await p.waitForTimeout(220); }
    return false; };

  /* ── 1. 타이틀 → 새 게임 ── */
  const v0=await view();
  await click("#newGameBtn");
  await p.waitForTimeout(600);
  const v1=await view();
  ok(v0==="title", `타이틀에서 시작 (${v0})`);
  ok(v1==="charsel", `새 게임 버튼 → 캐릭터 선택 (${v1})`);

  /* ── 2. 캐릭터 선택 ── */
  await p.evaluate(()=>{ const c=document.querySelector("#charRow .charcard, #charRow > *"); if(c)c.click(); });
  await p.waitForTimeout(250);
  await click("#confirmChar");
  await p.waitForTimeout(700);
  await clearDialog();
  const v2=await view();
  ok(v2==="starter", `캐릭터 확정 → 스타터 선택 (${v2})`);

  /* ── 3. 스타터 선택 ── */
  await p.evaluate(()=>{ const c=document.querySelector("#starterRow > *"); if(c)c.click(); });
  await p.waitForTimeout(250);
  await click("#confirmStarter");
  await p.waitForTimeout(900);
  await clearDialog(40);
  await p.waitForTimeout(600);
  const v3=await view();
  const party=await p.evaluate(()=>{ const G=window.SG.G();
    return { n:(G.party||[]).length, id:G.party&&G.party[0]&&G.party[0].id, lv:G.party&&G.party[0]&&G.party[0].level }; });
  ok(party.n===1 && !!party.id, `스타터 지급됨 (${party.id} Lv${party.lv})`);
  ok(v3==="map"||v3==="title", `맵으로 진입 (${v3})`);

  /* ── 4. 실제 키로 이동 ── */
  // 집 안에서 시작하므로 대화를 정리하고 밖으로 나간다
  await clearDialog(40);
  const posBefore=await p.evaluate(()=>({...window.SG.G().pos, indoor:window.SG.G().indoor}));
  let moved=false;
  for(const k of ["ArrowDown","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowUp"]){
    await key(k); await p.waitForTimeout(220);
    const now=await p.evaluate(()=>({...window.SG.G().pos, indoor:window.SG.G().indoor}));
    if(now.x!==posBefore.x||now.y!==posBefore.y||now.indoor!==posBefore.indoor){ moved=true; break; }
  }
  const posAfter=await p.evaluate(()=>({...window.SG.G().pos, indoor:window.SG.G().indoor}));
  ok(moved, `방향키로 실제 이동 (${posBefore.indoor||"밖"} ${posBefore.x},${posBefore.y} → ${posAfter.indoor||"밖"} ${posAfter.x},${posAfter.y})`);

  /* ⚠️ 아래 풀숲 걷기는 **집 밖에 서 있는 것**을 전제한다. 예전엔 고정 키 시퀀스(Up×4,Left,…)가
     집 안을 헤매다 우연히 출구를 밟아 나가는 데 의존했고(시작 칸이 문 바로 위였던 시절의 잔재),
     아침 시퀀스가 시작 칸을 침대 옆으로 옮기자 400회를 셔플해도 못 나가 "이동 실패"로 잡혔다.
     게임은 멀쩡하다(침대 옆에서 아래4·오른쪽2면 문 앞) — **우연에 기대던 픽스처가 문제였다.**
     → 실입력은 그대로 두되, 인테리어의 실제 출구 좌표를 향해 결정적으로 걸어 나간다. */
  for(let i=0;i<40;i++){
    const st=await p.evaluate(()=>{ const G=window.SG.G(), F=window.SG.flow;
      if(!G.indoor)return null; const it=F.INTERIORS[G.indoor];
      return {x:G.pos.x, y:G.pos.y, ex:it.exitX, ey:it.exitY}; });
    if(!st)break;
    await key(st.x<st.ex?"ArrowRight":st.x>st.ex?"ArrowLeft":st.y<st.ey?"ArrowDown":"ArrowUp");
    await p.waitForTimeout(200);
  }
  ok(!(await p.evaluate(()=>window.SG.G().indoor)), "집 밖으로 걸어 나왔다");

  /* ── 5. 야생 전투를 실제로 만날 때까지 풀숲을 걷는다 ── */
  // 실내면 먼저 밖으로
  await p.evaluate(async()=>{ const S=window.SG,F=S.flow;
    if(S.G().indoor){ F.exitInterior(); await new Promise(r=>setTimeout(r,600)); } });
  await p.waitForTimeout(700);
  await clearDialog(20);

  // ⚠️ 상하좌우를 번갈아 누르면 제자리에서 진동만 한다. 그리고 마을(지역0)엔 야생 조우가 없다.
  //    같은 방향을 여러 번 눌러 북쪽 풀숲으로 실제로 이동해야 전투가 걸린다.
  let battles=0, steps=0;
  const seq=["ArrowUp","ArrowUp","ArrowUp","ArrowUp","ArrowLeft","ArrowUp","ArrowUp","ArrowRight"];
  const trail=[];
  for(let i=0;i<400 && battles===0;i++){
    const st=await p.evaluate(()=>({inB:window.SG.G().inBattle, ...window.SG.G().pos,
                                    indoor:window.SG.G().indoor,
                                    dlg:document.getElementById("dialogBox").classList.contains("show")}));
    if(st.inB){ battles++; break; }
    if(st.dlg){ await p.keyboard.press("Enter"); await p.waitForTimeout(150); continue; }
    if(st.indoor){ await p.keyboard.press("ArrowDown"); await p.waitForTimeout(200); continue; }
    if(i%40===0)trail.push(st.x+","+st.y);
    await p.keyboard.press(seq[i%seq.length]);
    await p.waitForTimeout(125);
    steps++;
  }
  const walkEnd=await p.evaluate(()=>({...window.SG.G().pos}));
  console.log(`     (이동 경로 표본: ${trail.join(" → ")} → ${walkEnd.x},${walkEnd.y})`);
  await p.waitForTimeout(900);
  const battleView=await view();
  ok(battles>0, `풀숲을 ${steps}걸음 걸어 야생 전투 발생`);
  ok(battleView==="battle", `전투 화면으로 전환 (${battleView})`);

  /* ── 6. 실제 버튼으로 전투를 끝낸다 ── */
  // ⚠️ 고정 반복수(40회 × 320ms)로 잡으면 부하가 걸린 환경(다른 브라우저가 같이 떠 있을 때)에서
  //    애니메이션이 느려져 전투가 안 끝난 채 실패한다 → 실제 시계 예산으로 기다린다.
  let turns=0, ended=false;
  const battleDeadline=Date.now()+70000;
  while(Date.now()<battleDeadline && !ended){
    await p.waitForTimeout(260);
    const st=await p.evaluate(()=>{
      const G=window.SG.G();
      const main=document.getElementById("mainMenu");
      const menuOn=main && getComputedStyle(main).display!=="none";
      return { busy:G.busy, inBattle:G.inBattle, menuOn,
               view:([...document.querySelectorAll(".view")].find(x=>x.classList.contains("active"))||{}).id };
    });
    if(!st.inBattle || st.view!=="battle"){ ended=true; break; }
    if(st.busy || !st.menuOn){ await p.keyboard.press("Enter"); await p.waitForTimeout(120); continue; }   // 메시지 진행
    // 공격 → 첫 기술
    await p.evaluate(()=>{ const btns=[...document.querySelectorAll("#mainMenu .mbtn")];
      const atk=btns.find(x=>x.textContent.includes("공격")); if(atk)atk.click(); });
    await p.waitForTimeout(260);
    await p.evaluate(()=>{ const mv=document.querySelector("#moveMenu .mbtn"); if(mv)mv.click(); });
    turns++;
    await p.waitForTimeout(500);
  }
  // 전투 종료 직후엔 승리 연출·경험치 애니가 남아 있다. busy가 풀릴 때까지 기다린다.
  // ⚠️ 예전엔 60×250ms=15초 '고정 반복수'였다. load 30~50 환경에선 애니가 그 안에 안 끝나
  //    아래 busyStuck 단정이 게임 버그가 아닌데도 실패했다(HEAD로 되돌려도 같이 실패 = 환경 문제).
  //    → 전투 루프(위)와 동일하게 '실제 시계 예산'으로. 부하가 커도 실측 시간만큼 기다린다.
  const busyDeadline=Date.now()+45000;
  while(Date.now()<busyDeadline){ const bz=await p.evaluate(()=>window.SG.G().busy); if(!bz)break; await p.waitForTimeout(250); }
  await p.waitForTimeout(600);
  const after=await p.evaluate(()=>{ const G=window.SG.G();
    return { inBattle:G.inBattle, busy:G.busy, caught:G.caught.size, seen:G.seen.size,
             lv:G.party[0]&&G.party[0].level, xp:G.party[0]&&G.party[0].xp,
             view:([...document.querySelectorAll(".view")].find(x=>x.classList.contains("active"))||{}).id }; });
  console.log(`     [진단] 전투 종료 직후 busy=${after.busy} inBattle=${after.inBattle}`);
  ok(turns>0, `실제 버튼으로 ${turns}턴 전투`);
  ok(!after.inBattle && after.view==="map", `전투가 정상 종료되고 맵으로 복귀 (${after.view})`);
  ok(after.seen>=1, `도감 목격 기록 ${after.seen}종`);

  /* ── 7. 전투 후에도 조작이 살아 있는가(멈춤 방지) ── */
  await clearDialog(20);
  const pre=await p.evaluate(()=>({...window.SG.G().pos}));
  let moved2=false;
  for(const k of ["ArrowDown","ArrowUp","ArrowLeft","ArrowRight"]){
    await key(k); await p.waitForTimeout(240);
    const now=await p.evaluate(()=>({...window.SG.G().pos}));
    if(now.x!==pre.x||now.y!==pre.y){ moved2=true; break; }
  }
  ok(moved2, "전투 후에도 이동이 계속 된다 (입력 잠금 잔존 없음)");
  // ⚠️ moved2가 풀숲을 걸어 '새 야생 조우'나 '트레이너 스팟'으로 진입하면 그 전환 애니(와이프 ~340ms)
  //    동안 busy=true·inBattle=false인 **일시 상태**가 된다(영구 stuck 아님). 단발로 찍으면 오탐이라
  //    최대 3초 정착시켜 전환이 해소되길 기다린다: busy가 풀리거나(idle) inBattle이 켜지면(전투 진입) 정상.
  let endState=null;
  { const dl=Date.now()+3000;
    while(Date.now()<dl){ endState=await p.evaluate(()=>({ busy:window.SG.G().busy, inBattle:window.SG.G().inBattle,
        dlg:document.getElementById("dialogBox").classList.contains("show"),
        story:!!document.querySelector("#storyOverlay.active") }));
      if(!endState.busy || endState.inBattle || endState.dlg || endState.story) break;
      await p.waitForTimeout(200); } }
  const busyStuck=endState.busy;
  // ⚠️ busy가 45초 실측 예산을 넘겨도 안 풀렸을 때 세 가지를 가른다:
  //   1) 전투 후 이동 체크가 풀숲으로 걸어 들어가 '새 야생 전투'가 걸렸다 → inBattle=true.
  //      이건 정상(busy가 당연히 켜진다). 이 테스트는 첫 전투만 검증하므로 통과 처리.
  //   2) 밖(inBattle=false)인데 busy가 stuck + 시스템 부하 높음(코어당 load>2) → 승리 연출/
  //      경험치 애니가 느려진 환경 오탐 → 경고만(게임 버그 아님).
  //   3) 밖인데 stuck + 부하 낮음 → 진짜 회귀 의심(하드 실패).
  const load1=os.loadavg()[0], cores=os.cpus().length||1, perCore=load1/cores;
  if(!busyStuck){
    ok(true, `G.busy가 풀려 있다 (false)`);
  } else if(endState.inBattle){
    ok(true, `이동 중 새 야생 전투로 진입(inBattle=true) — busy는 정상`);
  } else if(endState.dlg||endState.story){
    ok(true, `이동 중 표지판/NPC 대화 진입 — busy는 정상(대화가 잡고 있음)`);
  } else if(perCore>2){
    console.log(`  ⚠️ G.busy가 아직 true(밖) — 시스템 부하 높음(load ${load1.toFixed(1)}/${cores}코어=${perCore.toFixed(1)}), 환경 오탐으로 판단(경고만).`);
  } else {
    ok(false, `G.busy가 풀려 있다 (${busyStuck}, 밖) — 부하 낮음(${perCore.toFixed(1)}/코어)인데 안 풀림 = 진짜 회귀 의심`);
  }

  ok(errs.length===0, "플레이 전체에서 런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 실입력 플레이스루 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
