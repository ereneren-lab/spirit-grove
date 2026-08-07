// 진화 연출 통일 회귀 테스트:
//  1) 비선두(파티 뒤쪽) 정령이 진화하면 evolveScene(진화 장면)으로 뜬다(예전엔 toast만).
//  2) 전투 중 진화 장면은 배틀 음악을 유지한다(필드 음악으로 안 바뀜).
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch({args:["--autoplay-policy=no-user-gesture-required"]});
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 1) 비선두 진화 → 진화 장면
  await p.evaluate(()=>{ const S=window.SG; const G=S.freshState();
    G.party=[S.makeMon("shellow",5), S.makeMon("foxfire",16)]; G.active=0; S.setG(G); S.flow.enterMap(true);
    S.flow.evolveCheck(G.party[1], false); });
  let sceneSeen=false, evolved=false;
  for(let i=0;i<45;i++){ const r=await p.evaluate(()=>({open:document.getElementById("evoOverlay").classList.contains("active"), id:window.SG.G().party[1].id}));
    if(r.open)sceneSeen=true; if(r.id==="emberwolf"){evolved=true;break;} await p.waitForTimeout(150); }
  ok(sceneSeen, "비선두 진화가 진화 장면(오버레이)으로 뜸");
  ok(evolved, "비선두 정령 진화 완료 (foxfire→emberwolf)");

  // 2) 전투 중 진화 → 배틀 음악 유지
  // part 1의 필드 렌더 루프/음악 잔재 제거 위해 새 페이지 로드로 격리
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(700);
  // Audio.startMusic/stopMusic 스파이 — 전투 중 진화가 음악을 아예 안 건드리는지 직접 확인
  await p.evaluate(()=>{ const S=window.SG; const G=S.freshState();
    G.party=[S.makeMon("cindercat",20)]; G.active=0; G.inBattle=true; G.foe=S.makeMon("shellow",10); S.setG(G);
    window.__mCalls=[]; window.__stopCalled=false;
    const os=S.Audio.startMusic.bind(S.Audio); S.Audio.startMusic=function(n,im){ window.__mCalls.push(n); return os(n,im); };
    const om=S.Audio.stopMusic.bind(S.Audio); S.Audio.stopMusic=function(){ window.__stopCalled=true; return om(); };
    S.flow.evolveScene(G.party[0], S.byId("tigerflame")); });
  let evolved2=false;
  for(let i=0;i<45;i++){ const r=await p.evaluate(()=>window.SG.G().party[0].id); if(r==="tigerflame"){evolved2=true;break;} await p.waitForTimeout(150); }
  const audit=await p.evaluate(()=>({calls:window.__mCalls, stop:window.__stopCalled}));
  ok(audit.calls.length===0 && !audit.stop, `전투 중 진화가 음악을 안 건드림 (startMusic ${JSON.stringify(audit.calls)}, stop=${audit.stop})`);
  ok(evolved2, "전투 중 진화 완료 (cindercat→tigerflame)");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 진화 연출 통일 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
