// H4 회귀 — 데일리 보너스: 하루 1회 청구·요일 테마·연속 스트릭·저장 영속.
// 왜: 재방문 동기(시즌/이벤트의 로컬 슬라이스). 하루 1회 가드나 스트릭이 깨지면 보상이 새거나 못 받는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("blazelion",30)]; G.money=0; G.items={};
    const themes=F.DAILY_THEMES.length;
    const themeValid=F.DAILY_THEMES.every(t=>t.ic&&t.name&&t.item&&t.qty>0&&t.coin>0);
    // 화면
    F.openDaily(); const open=(document.getElementById("dailyOverlay")||{}).classList.contains("active");
    const bodyLen=(document.getElementById("dailyBody")||{}).innerHTML.length;
    // 첫 청구
    const c1=F.claimDaily(); const gained=G.money>0 && Object.keys(G.items).length>0; const streak1=G.dailyStreak;
    // 같은 날 재청구 차단
    const m=G.money; const c2=F.claimDaily(); const noDouble=(G.money===m && c2===false);
    // 어제 청구 위장 → 연속 스트릭 +1
    G.dailyLast=F.dailyKey(new Date(Date.now()-864e5)); G.dailyStreak=3;
    const contPred=F.dailyStatus().streakIfClaim; F.claimDaily(); const contDone=(contPred===4 && G.dailyStreak===4);
    // 스트릭 보상이 1일보다 크다(누적 반영)
    const rw10=F.dailyReward(F.dailyTheme(),10), rw1=F.dailyReward(F.dailyTheme(),1);
    const scales=(rw10.coin>rw1.coin);
    // 이틀 전 → 리셋
    G.dailyLast=F.dailyKey(new Date(Date.now()-2*864e5)); G.dailyStreak=5;
    const resets=(F.dailyStatus().streakIfClaim===1);
    // 저장 왕복
    const ser=F.serialize(); F.deserialize(ser); const persisted=(S.G().dailyLast===G.dailyLast && S.G().dailyStreak===G.dailyStreak);
    return { themes, themeValid, open, bodyLen, c1, gained, streak1, noDouble, contDone, scales, resets, persisted };
  });

  ok(r.themes===7 && r.themeValid, "요일 테마 7종이 모두 유효하다");
  ok(r.open && r.bodyLen>150, "오늘의 보너스 화면이 열리고 렌더된다");
  ok(r.c1 && r.gained && r.streak1===1, "첫 청구로 보상 지급·스트릭 1");
  ok(r.noDouble, "같은 날 재청구는 차단(보상 중복 없음)");
  ok(r.contDone, "어제 받았으면 연속 스트릭이 +1 된다");
  ok(r.scales, "스트릭이 높을수록 보상 코인이 커진다");
  ok(r.resets, "하루 이상 건너뛰면 스트릭이 1로 리셋된다");
  ok(r.persisted, "출석 상태가 저장/복원에 영속된다");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 데일리 보너스 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
