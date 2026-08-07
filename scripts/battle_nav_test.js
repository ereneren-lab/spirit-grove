// 전투 메뉴 방향키 조작 회귀 테스트: 방향키=커서 이동, Enter/Z=선택(A), Esc/X=뒤로(B). (모바일 탭도 유지)
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  await p.evaluate(()=>{ const S=window.SG; const G=S.freshState(); G.party=[S.makeMon("foxfire",10)]; G.active=0;
    G.inBattle=true; G.busy=false; G.trainer=null; G.foe=S.makeMon("bunnyhop",8); G.foe.hp=G.foe.maxHp; S.setG(G);
    S.CONFIG.reduceMotion=true;
    document.querySelectorAll(".view").forEach(v=>v.classList.remove("active")); document.getElementById("battle").classList.add("active");
    S.flow.setupBattleUI(false); window.SG.G().busy=false; S.flow.showMain(); });

  const focus=()=>p.evaluate(()=>{ const f=document.querySelector(".mbtn.kbfocus"); return f?(f.dataset.act||(f.querySelector(".top span")?f.querySelector(".top span").textContent:f.textContent.trim().slice(0,4))):null; });
  const vis=id=>p.evaluate(i=>getComputedStyle(document.getElementById(i)).display!=="none", id);

  ok(await focus()==="fight", `초기 커서 = 공격 (${await focus()})`);
  await p.keyboard.press("ArrowRight"); ok(await focus()==="catch", "→ 포획");
  await p.keyboard.press("ArrowDown");  ok(await focus()==="run", "↓ 도망");
  await p.keyboard.press("ArrowLeft");  ok(await focus()==="party", "← 교체");
  await p.keyboard.press("ArrowUp");    ok(await focus()==="fight", "↑ 공격");

  await p.keyboard.press("Enter");      // A: 공격 → 기술 메뉴
  await p.waitForTimeout(120);
  ok(await vis("moveMenu"), "Enter(A) → 기술 메뉴 표시");
  ok(!(await vis("mainMenu")), "메인 메뉴 숨김");
  const mv=await focus(); ok(mv && mv!=="fight", `기술 메뉴 커서 존재 (${mv})`);

  await p.keyboard.press("Escape");     // B: 뒤로 → 메인
  await p.waitForTimeout(120);
  ok(await vis("mainMenu"), "Esc(B) → 메인 메뉴 복귀");
  ok(!(await vis("moveMenu")), "기술 메뉴 숨김");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 전투 메뉴 방향키 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
