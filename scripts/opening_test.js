// 도입부(아침 시퀀스) 회귀 (유저: "입구 출구도 없이, 갑자기 들어가지니까 좀 아쉽네").
//
// 예전 도입부는 슬라이드 7장이 끝나면 **이미 집에 서 있었다**. 세계관은 설명됐는데
// '나'는 아직 시작하지 않은 상태라 게임 안으로 던져지는 느낌이었다.
// 지금은: 눈뜨기(암전→깜빡임) → 첫 동료가 깨움 → 머리맡의 읽을 것(= 왜 내가 가는가) → 배웅.
// ⚠️ 2026-08-07부터 **캐릭터마다 출신지·화자가 다르다.** 문구를 그대로 단정하면 캐릭터를 바꿀 때마다 빨개진다
//    → **역할**을 단정한다(장소 묘사인가 · 첫 동료가 나오는가 · 목적을 말하는가 · 배웅인가).
//    이 테스트는 첫 카드(리오) 기준이고, 넷 전수는 `origin_test`가 본다.
//
// ⚠️ 이 테스트는 **실입력으로 타이틀부터 판다** — 상태를 조립해서 확인하면
//    "새 게임 버튼에서 여기까지 실제로 이어지는가"를 못 본다(이 저장소가 반복해 밟은 함정:
//    정의는 있는데 플레이에서 닿지 않는다).
// ⚠️ 조작 튜토리얼(flashHint 4연발)은 **집 안에서 뜨면 안 된다** — 서사와 조작 설명이
//    같은 자리에서 싸운다. 집을 나선 뒤로 미뤘고, 그 순서를 여기서 고정한다.
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  // ⚠️ 타이핑이 끝나기 전에 읽으면 "머리맡에…"처럼 **잘린 문자열**이 나온다(실제로 겪음).
  //    ▼커서(#dlgNext)가 뜨는 시점이 타이핑 완료 신호다 — 고정 대기가 아니라 그 상태를 본다.
  const dlg=async()=>{ await p.waitForFunction(()=>!document.getElementById("dialogBox").classList.contains("show")
      || document.getElementById("dlgNext").style.display==="block", null, {timeout:6000});
    return p.evaluate(()=>{ const box=document.getElementById("dialogBox");
      return { shown:box.classList.contains("show"), name:document.getElementById("dlgName").textContent,
               text:document.getElementById("dlgText").textContent }; }); };
  // 타이핑이 끝날 때까지 기다렸다가 다음 쪽으로 — 고정 예산이 아니라 상태를 본다(ff8daf3의 교훈).
  const nextPage=async()=>{ await dlg(); await p.evaluate(()=>window.SG.flow.advanceDialog()); await p.waitForTimeout(120); };

  console.log("\n[1] 타이틀 → 새 게임 → 캐릭터 → 스타터 → 오프닝 슬라이드가 실제로 이어진다");
  await p.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
  await p.reload(); await p.waitForTimeout(800);
  await p.click("#newGameBtn"); await p.waitForTimeout(300);
  await p.click("#charRow .pick-card"); await p.click("#confirmChar"); await p.waitForTimeout(250);
  await p.click("#starterRow .pick-card"); await p.click("#confirmStarter"); await p.waitForTimeout(400);
  const story=await p.evaluate(()=>({ open:document.getElementById("storyOverlay").classList.contains("active"),
                                      text:document.getElementById("storyText").textContent }));
  ok(story.open && story.text.length>10, `오프닝 슬라이드가 떴다 — "${story.text.slice(0,24)}…"`);

  console.log("\n[2] 슬라이드를 건너뛰면 출신지에서 눈을 뜬다 (침대 옆, 문 앞이 아니라)");
  /* ⚠️ 2026-08-07부터 **캐릭터마다 출신지가 다르다**(연구소/야영지/농가/빈터).
     예전엔 넷 다 `house`였다 — 여기를 "house"로 못 박아 두면 캐릭터를 바꿀 때마다 빨개진다.
     이 테스트는 첫 카드(리오)를 고르므로 `home_rio`가 맞고, 넷 전수는 `origin_test`가 따로 본다. */
  await p.click("#storySkip");
  await p.waitForFunction(()=>{ const i=window.SG.G().indoor;
    return i && (i==="house" || i.indexOf("home_")===0); },null,{timeout:8000});
  await p.waitForTimeout(900);
  const wake=await p.evaluate(()=>{ const S=window.SG,G=S.G(); const it=S.flow.INTERIORS[G.indoor]||{};
    const str=it.str||[]; const tile=(str[G.pos.y]&&str[G.pos.y][G.pos.x])||"?";
    // 침대(B) 위치와 인접 여부
    let bx=-1,by=-1; for(let y=0;y<str.length;y++){ const c=str[y].indexOf("B"); if(c>=0){ bx=c; by=y; break; } }
    return { pos:G.pos, indoor:G.indoor, tile, adjBed:(Math.abs(G.pos.x-bx)+Math.abs(G.pos.y-by)===1),
      fade:Number(getComputedStyle(document.getElementById("warpFade")).opacity) }; });
  ok(wake.indoor==="home_rio", `출신지에서 시작한다 (indoor=${wake.indoor})`);
  // ⚠️ 눈뜨는 칸은 침대 옆 **바닥**이어야 한다(집마다 위치 다름). 예전엔 (2,2) 하드코딩이라 리오는 벽 기둥 위에서 눈떴다 → 이제 바닥 칸.
  ok(wake.tile==="." && wake.adjBed, `침대 옆 바닥에서 눈을 뜬다 (${wake.pos.x},${wake.pos.y})='${wake.tile}'`);
  ok(wake.fade>0.05, `눈뜨기 연출이 진행 중이다(화면이 아직 덮여 있다) — 불투명도 ${wake.fade.toFixed(2)}`);

  console.log("\n[3] 눈뜨기가 끝나면 대사가 순서대로 온다: 깨어남 → 편지 → 엄마");
  await p.waitForFunction(()=>document.getElementById("dialogBox").classList.contains("show"),null,{timeout:8000});
  const d1=await dlg(); ok(d1.name==="" && d1.text.length>12, `① 장소 묘사로 깨어난다 — "${d1.text.slice(0,20)}…"`);
  await nextPage();
  const d2=await dlg(); ok(/첫 동료/.test(d2.text), `② 첫 동료가 깨운다 — "${d2.text.slice(0,20)}…"`);
  await nextPage();
  /* ⚠️ 리오는 편지를 **받는 쪽이 아니라 쓴 쪽**이라 "연구소의 편지"가 아니라 "관측 기록"이다. */
  const d3=await dlg(); ok(d3.name==="관측 기록", `③ 관측 기록이 펼쳐진다 — 화자 "${d3.name}"`);
  ok(/인장/.test(d3.text), `   편지가 목적을 말한다(인장) — "${d3.text.slice(0,26)}…"`);
  /* ④ 읽을 것이 **무엇을 하면 되는가**까지 간다.
     ⚠️ 어느 쪽에 나오는지는 캐릭터마다 다르다 → 읽을 것 전체를 넘기며 **모아서** 본다.
        한 쪽만 집어 단정하면 문구를 손댈 때마다 빨개진다. */
  let noteAll=d3.text, sender=null;
  for(let i=0;i<6;i++){ await nextPage(); const d=await dlg();
    if(d.name===d3.name){ noteAll+=d.text; continue; }
    sender=d; break; }
  ok(/조각 4개|인장 조각|조각은 넷|체육관/.test(noteAll), `④ 목적(조각 4개/체육관)까지 말한다`);
  /* ⑤ 배웅 — 화자는 캐릭터마다 다르다(소장/동행 상인/할아버지/숲의 목소리).
     읽을 것과 **다른 화자**가 나와 보내주면 된다. */
  ok(!!(sender&&sender.name)&&sender.name!==d3.name, `⑤ 배웅으로 닫는다 — 화자 "${sender?sender.name:"(없음)"}"`);

  console.log("\n[4] 조작 튜토리얼은 집 안에서 뜨지 않는다 (서사와 안 싸운다)");
  const hintInHouse=await p.evaluate(()=>document.getElementById("mapHint").textContent);
  ok(!/맵을 탭하면/.test(hintInHouse), `집 안 힌트가 조작 설명이 아니다 — "${hintInHouse.slice(0,22)}…"`);

  console.log("\n[5] 편지는 머리맡에 남아 다시 읽을 수 있다");
  while((await dlg()).shown)await nextPage();
  const letter=await p.evaluate(async()=>{ const F=window.SG.flow, G=window.SG.G();
    const tile=F.tileAt(2,1);
    G.pos={x:2,y:2}; F.interact&&F.interact();                       /* 위쪽 편지를 향해 조사 */
    await new Promise(r=>setTimeout(r,200));
    return {tile, name:document.getElementById("dlgName").textContent, noteRead:!!G.noteRead}; });
  ok(letter.tile==="P", `머리맡에 편지 타일이 있다 — "${letter.tile}"`);
  ok(letter.noteRead, "편지를 읽은 사실이 상태에 남는다(G.noteRead)");

  console.log("\n[6] 집을 나서면 그때 조작 튜토리얼이 뜬다");
  await p.evaluate(async()=>{ const F=window.SG.flow; while(window.SG.flow.dialogActive())F.advanceDialog();
    F.exitInterior(); });
  await p.waitForFunction(()=>!window.SG.G().indoor,null,{timeout:5000});
  await p.waitForTimeout(900);
  const hintOut=await p.evaluate(()=>document.getElementById("mapHint").textContent);
  ok(/맵을 탭하면|풀숲/.test(hintOut), `오버월드에 서자 튜토리얼이 시작된다 — "${hintOut.slice(0,24)}…"`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length})${errs.length?": "+errs.slice(0,3).join(" | "):""}`);
  await b.close();
  console.log(fail?"\n❌ opening_test 실패":"\n✅ opening_test 통과");
  process.exit(fail);
})();
