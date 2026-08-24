// H4 회귀 — 도전과제/업적: 상태에서 파생하는 판정 + 보상 청구 + 저장 왕복 + UI.
// 왜: 기존 상태(caught/badges/champion/towerBest/legendDone…)를 달성감으로 모으는 창구.
//     판정/청구/영속 어느 하나가 어긋나면 보상이 새거나 못 받는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("blazelion",30)];
    const ACH=F.ACHIEVEMENTS;
    // 신품 상태: 대부분 미달성(첫 만남은 caught 비어 미달)
    const zeroDone=F.achStats().done;
    // 조건 충족: 도감 1종 → first 달성
    G.caught=new Set(["blazelion"]); G.money=1000; G.items={};
    const firstDone=F.achDone(ACH.find(a=>a.id==="first"));
    // 미달성 업적은 청구 불가
    const claimLocked=F.claimAch("champion");
    // 달성 업적 청구 → 보상 지급·목록 등록
    const m0=G.money; const claimed=F.claimAch("first"); const gotMoney=G.money>m0; const gotBall=(G.items.greatball||0)>0;
    const inList=(G.achClaimed||[]).includes("first");
    const reclaim=F.claimAch("first");   // 재청구 불가(보상 중복 방지)
    const m1=G.money; F.claimAch("first"); const noDouble=(G.money===m1);
    // UI 열림 + 렌더
    F.openAchievements();
    const open=(document.getElementById("achOverlay")||{}).classList.contains("active");
    const bodyLen=(document.getElementById("achBody")||{}).innerHTML.length;
    // 파생 판정: 챔피언/전설/타워/이로치
    G.champion=true; G.towerBest=8; G.legendDone=G.lakeDone=G.shadowDone=true;
    G.party[0].shiny=true;
    const champ=F.achDone(ACH.find(a=>a.id==="champion"));
    const tower=F.achDone(ACH.find(a=>a.id==="tower"));
    const legend=F.achDone(ACH.find(a=>a.id==="legend3"));
    const shiny=F.achDone(ACH.find(a=>a.id==="shiny"));
    // 저장 왕복 영속
    const ser=F.serialize(); F.deserialize(ser); const persisted=(S.G().achClaimed||[]).includes("first");
    return { n:ACH.length, zeroDone, firstDone, claimLocked, claimed, gotMoney, gotBall, inList, reclaim, noDouble, open, bodyLen, champ, tower, legend, shiny, persisted };
  });

  ok(r.n>=10, `업적이 여러 개 정의됨 (${r.n}개)`);
  ok(r.firstDone && r.zeroDone< r.n, "상태에서 달성이 파생된다(신품은 대부분 미달성)");
  ok(r.claimLocked===false, "미달성 업적은 청구할 수 없다");
  ok(r.claimed && r.gotMoney && r.gotBall && r.inList, "달성 업적 청구 시 보상 지급·목록 등록");
  ok(r.reclaim===false && r.noDouble, "재청구는 막히고 보상이 중복 지급되지 않는다");
  ok(r.open && r.bodyLen>200, "도전과제 화면이 열리고 렌더된다");
  ok(r.champ && r.tower && r.legend && r.shiny, "챔피언·타워7연승·전설3·이로치 판정이 상태를 따른다");
  ok(r.persisted, "청구 목록이 저장/복원에 영속된다");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 도전과제 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
