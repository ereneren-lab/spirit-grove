// H5-B(잔여) 회귀 — 이로치 도감 + 수집 통계.
// 이로치 도감: 이로치로 잡은 종만 기록(markShinyDex). 통계: 기존 상태에서 파생.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    // ── markShinyDex: 이로치만 기록 ──
    F.markShinyDex({id:"blazelion",shiny:true}); F.markShinyDex({id:"foxfire",shiny:false}); F.markShinyDex({id:"x"});
    const onlyShiny=G.shinyDex.has("blazelion") && !G.shinyDex.has("foxfire");
    // 저장 왕복 영속
    G.party=[S.makeMon("foxfire",5)]; const ser=F.serialize(); F.deserialize(ser);
    const persisted=S.G().shinyDex.has("blazelion");

    // ── 통계 파생 ──
    S.setG(S.freshState()); const G2=S.G();
    G2.caught=new Set(["foxfire","blazelion","gearclad","psykit"]);
    G2.seen=new Set(["foxfire","blazelion","gearclad","psykit","wispkin","nightkit"]);
    G2.shinyDex=new Set(["blazelion","psykit"]);
    G2.party=[Object.assign(S.makeMon("gearclad",50),{ivs:{hp:31,atk:31,def:31,spa:31,spDef:31,spd:31}})]; G2.box=[];
    G2.graveyard=["떠난이"]; G2.ngPlus=2;
    const st=F.collectStats();
    const typeSums=Object.values(st.byType).reduce((a,t)=>a+t.n,0);
    // 통계 화면
    F.openDexStats(); const statsOpen=(document.getElementById("statsOverlay")||{}).classList.contains("active"); const statsLen=(document.getElementById("statsBody")||{}).innerHTML.length;

    // ── 도감 이로치 필터 ──
    F.renderDex();
    const btns=[...document.querySelectorAll("#dexBody button")];
    const shinyBtn=btns.find(x=>x.textContent.includes("이로치")); if(shinyBtn)shinyBtn.click();
    const shinyCards=document.querySelectorAll("#dexBody .mon-card").length;   // 이로치로 잡은 종만
    const statBtn=!![...document.querySelectorAll("#dexBody button")].find(x=>x.textContent.includes("통계"));
    return { onlyShiny, persisted, caught:st.caught, seen:st.seen, shiny:st.shiny, bestIv:st.bestIv&&st.bestIv.v,
      grave:st.grave, ng:st.ng, typeSums, statsOpen, statsLen, shinyCards, statBtn };
  });

  ok(r.onlyShiny, "markShinyDex는 이로치로 잡은 종만 기록한다");
  ok(r.persisted, "이로치 도감이 저장/복원에 영속된다");
  ok(r.caught===4 && r.seen===6, `통계: 포획/목격 카운트 (${r.caught}/${r.seen})`);
  ok(r.shiny===2, `통계: 이로치 종 수 (${r.shiny})`);
  ok(r.bestIv===186, `통계: 최고 개체값 (${r.bestIv})`);
  ok(r.grave===1 && r.ng===2, "통계: 묘지·뉴게임+ 회차 반영");
  ok(r.typeSums===100, `통계: 타입별 합이 전 종(${r.typeSums})`);
  ok(r.statsOpen && r.statsLen>500, "수집 통계 화면이 열리고 렌더된다");
  ok(r.statBtn, "도감에 📊 통계 버튼이 있다");
  ok(r.shinyCards===2, `도감 이로치 필터가 이로치 종만 보인다 (${r.shinyCards})`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 이로치 도감·수집 통계 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
