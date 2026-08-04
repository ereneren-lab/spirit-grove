// 도입부(아침 시퀀스) 회귀 (유저: "입구 출구도 없이, 갑자기 들어가지니까 좀 아쉽네").
//
// 예전 도입부는 슬라이드 7장이 끝나면 **이미 집에 서 있었다**. 세계관은 설명됐는데
// '나'는 아직 시작하지 않은 상태라 게임 안으로 던져지는 느낌이었다.
// 지금은: 눈뜨기(암전→깜빡임) → 첫 동료가 깨움 → 머리맡 편지(= 왜 내가 가는가) → 엄마의 배웅.
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

  console.log("\n[2] 슬라이드를 건너뛰면 집에서 눈을 뜬다 (침대 옆, 문 앞이 아니라)");
  await p.click("#storySkip");
  await p.waitForFunction(()=>window.SG.G().indoor==="house",null,{timeout:6000});
  await p.waitForTimeout(900);
  const wake=await p.evaluate(()=>({ pos:window.SG.G().pos, indoor:window.SG.G().indoor,
    fade:Number(getComputedStyle(document.getElementById("warpFade")).opacity) }));
  ok(wake.indoor==="house", "집 안에서 시작한다");
  ok(wake.pos.x===2 && wake.pos.y===2, `침대 옆(2,2)에서 눈을 뜬다 — 실제 (${wake.pos.x},${wake.pos.y})`);
  ok(wake.fade>0.05, `눈뜨기 연출이 진행 중이다(화면이 아직 덮여 있다) — 불투명도 ${wake.fade.toFixed(2)}`);

  console.log("\n[3] 눈뜨기가 끝나면 대사가 순서대로 온다: 깨어남 → 편지 → 엄마");
  await p.waitForFunction(()=>document.getElementById("dialogBox").classList.contains("show"),null,{timeout:8000});
  const d1=await dlg(); ok(/아침 햇살/.test(d1.text), `① 깨어남 — "${d1.text.slice(0,20)}…"`);
  await nextPage();
  const d2=await dlg(); ok(/첫 동료/.test(d2.text), `② 첫 동료가 깨운다 — "${d2.text.slice(0,20)}…"`);
  await nextPage();
  const d3=await dlg(); ok(d3.name==="연구소의 편지", `③ 편지가 펼쳐진다 — 화자 "${d3.name}"`);
  ok(/인장/.test(d3.text), `   편지가 목적을 말한다(인장) — "${d3.text.slice(0,26)}…"`);
  await nextPage(); await nextPage();
  const d5=await dlg(); ok(/조각 4개|인장 조각/.test(d5.text)||d5.name==="연구소의 편지", `④ 편지가 '무엇을 하면 되는가'까지 간다 — "${d5.text.slice(0,26)}…"`);
  for(let i=0;i<3&&!(await dlg()).name.includes("엄마");i++)await nextPage();
  const dm=await dlg(); ok(dm.name==="엄마", `⑤ 엄마의 배웅으로 닫는다 — 화자 "${dm.name}"`);

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
