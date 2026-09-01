// 듀오 배틀(2v2) UI 회귀 테스트: 포켓몬식 4스프라이트 필드 — 상대 2·아군 2가 각 슬롯에
//  크리처 아트로 렌더 + HUD(이름/HP) + 상태칩(색 클래스) + 대기 벤치 표기.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG; const G=S.freshState();
    const a=S.makeMon("skydrake",32); a.status="slp";
    G.party=[a, S.makeMon("crystalgon",34), S.makeMon("emberwolf",28)]; G.active=0; S.setG(G);
    S.flow.enterMap(true);
    S.flow.startDouble([["voltsnake",26],["seedbean",26],["emberfly",27],["frostpup",27]],"쌍둥이 나나·리리","DUO");
    const foeArt=document.querySelector('#dbField .dbslot.foe .dbsp img'), allyArt=document.querySelector('#dbField .dbslot.ally .dbsp img');
    const chip=document.querySelector('#dbAllyHuds .dbst');   // HUD는 모서리 묶음(#dbFoeHuds/#dbAllyHuds)으로 이동
    const vis=side=>[...document.querySelectorAll(`#dbField .dbslot.${side}`)].filter(s=>!s.hidden&&s.querySelector(".dbsp")).length;
    return { open:document.getElementById("dbOverlay").classList.contains("active"),
      foeArt:!!foeArt, allyArt:!!allyArt,
      foeCount:vis("foe"), allyCount:vis("ally"),
      regionBg:(document.getElementById("dbField").style.background||"").includes("url("),
      foeHuds:document.querySelectorAll('#dbFoeHuds .dbhud .dbhpbar').length,
      allyHuds:document.querySelectorAll('#dbAllyHuds .dbhud .dbhpbar').length,
      chipText:chip?chip.textContent:"", chipSlp:chip?chip.classList.contains("b-slp"):false,
      benchTag:((document.getElementById("dbFoeBench")||{}).textContent||"").includes("+") }; });

  ok(r.open, "듀오 배틀 오버레이 열림");
  ok(r.foeArt, "상대 정령이 크리처 아트로 렌더(이모지 아님)");
  ok(r.allyArt, "아군 정령이 크리처 아트로 렌더");
  ok(r.foeCount===2 && r.allyCount===2, `4스프라이트 필드 (상대 ${r.foeCount}, 아군 ${r.allyCount})`);
  ok(r.foeHuds===2 && r.allyHuds===2, `HP박스 모서리 묶음 (상대 ${r.foeHuds}, 아군 ${r.allyHuds})`);
  ok(r.regionBg, "지역별 전투 배경 적용(REGION_BATTLE_BG)");
  ok(r.chipText==="잠듦", `아군 상태칩 표시 (${r.chipText})`);
  ok(r.chipSlp, "상태칩이 색 클래스(b-slp) 적용");
  ok(r.benchTag, "대기(+N) 벤치 표기");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 듀오 배틀 UI 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
