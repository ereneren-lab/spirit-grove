// 이벤트 씬 회귀 — 그림자 사도(하람) 첫 격파 시 '카이 ↔ 스승' 대면 씬이 딱 한 번 재생되는가.
// 왜: 이 씬은 라이벌 카이의 '실종된 스승' 실을 매듭짓고 포스트게임 그림자 근원(흑요마)으로 다리를 놓는다.
//     트레이너 승리 처리(trainerDefeated)·questFlags·playStory 어느 하나가 바뀌면 조용히 안 뜰 수 있다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // SH3를 이긴 직후 상태를 만들고 trainerDefeated를 부른다(전투 전체를 돌리지 않고 승리 처리만 검증).
  const beatSH3=async()=>p.evaluate(async()=>{
    const S=window.SG,F=S.flow; const fn=F.trainerDefeated||window.trainerDefeated;
    const G=S.G(); G.inBattle=true;
    G.trainer={key:"SH3",name:"그림자 사도 하람",em:"🕯️",team:[["snowl",34]],idx:1,reward:{hyperpotion:1},money:100,boss:false,rematch:G.defeated.has("SH3"),mons:[],fainted:new Set([0]),switches:0};
    await fn(); await new Promise(r=>setTimeout(r,500));
    const ov=document.getElementById("storyOverlay");
    return { open:!!(ov&&getComputedStyle(ov).display!=="none"), flag:!!(G.questFlags&&G.questFlags.haramScene),
             defeated:G.defeated.has("SH3"), firstPage:ov?ov.textContent:"" };
  });

  // ── 1) 첫 격파: 씬이 뜨고 플래그가 선다 ──
  await p.evaluate(()=>{ window.SG.setG(window.SG.freshState()); });
  const r1=await beatSH3();
  ok(r1.defeated, "SH3가 격파 목록에 든다");
  ok(r1.flag===true, "haramScene 플래그가 선다");
  ok(r1.open===true, "이벤트 씬(스토리 오버레이)이 열린다");
  ok(/카이/.test(r1.firstPage), "첫 페이지에 라이벌 카이가 등장한다");

  // ── 2) 씬 전체가 핵심 비트를 담는다(스승 정체·그림자 근원·동행 선언) ──
  //    playStory 페이지를 끝까지 넘겨 텍스트를 모은다.
  const beats=await p.evaluate(async()=>{
    const ov=document.getElementById("storyOverlay"); let all="";
    for(let i=0;i<10;i++){ if(!ov||getComputedStyle(ov).display==="none")break; all+=" "+ov.textContent;
      const nx=ov.querySelector("[data-next],.storyNext,button"); if(nx)nx.click(); else ov.click();
      await new Promise(r=>setTimeout(r,120)); }
    return all;
  });
  ok(/스승/.test(beats), "스승 정체가 드러난다");
  ok(/근원/.test(beats), "그림자 근원(포스트게임 훅)이 언급된다");
  ok(!/은\(는\)|이\(가\)|을\(를\)|와\(과\)/.test(beats), "괄호형 조사가 화면에 노출되지 않는다");

  // ── 3) 재대결(2회차): 씬은 다시 뜨지 않는다 ──
  const r2=await beatSH3();
  ok(r2.open===false, "이미 본 뒤 재대결에선 씬이 다시 뜨지 않는다");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 카이·스승 대면 씬 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
