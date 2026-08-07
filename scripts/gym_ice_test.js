// 체육관 얼음 미끄럼 퍼즐 회귀 테스트(gym3): 얼음('I') 위에서 진행방향으로 계속 미끄러져
// 다음 정지점(벽/트레이너/일반 바닥)까지 이동. 중앙 통로가 소프트락 없이 통행 가능한지 확인.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // gym3 입장(가드 전부 격파 처리해 통로 개방), 위치를 얼음 바로 아래에 세팅
  await p.evaluate(()=>{ const S=window.SG; const G=S.freshState(); G.party=[S.makeMon("emberwolf",30)];
    G.defeated=new Set(["d","c","9","3"]); G.pos={x:4,y:44}; S.setG(G); S.flow.enterMap(true);
    S.CONFIG.reduceMotion=true; S.flow.enterInterior(S.flow.INTERIORS.gym3); });
  await p.waitForTimeout(500);
  const pos=()=>p.evaluate(()=>({x:window.SG.G().pos.x,y:window.SG.G().pos.y,indoor:window.SG.G().indoor}));
  const s0=await pos();
  ok(s0.indoor==="gym3", `gym3 입장 (indoor=${s0.indoor})`);

  // (4,12) 가드9(격파됨=바닥) 바로 위가 얼음(4,11)→바닥(4,10). (4,13)에서 위로 두 번 눌러 (4,12)로 이동 후 얼음 슬라이드 관찰.
  await p.evaluate(()=>{ window.SG.G().pos={x:4,y:12}; window.SG.Field.placeImmediate&&window.SG.Field.placeImmediate(); window.SG.Field.face&&window.SG.Field.face("up"); });
  await p.waitForTimeout(200);
  await p.keyboard.press("ArrowUp");   // (4,12)→(4,11)얼음→슬라이드→(4,10)바닥에서 정지
  await p.waitForTimeout(900);
  const s1=await pos();
  ok(s1.y===10, `얼음 슬라이드: 한 번 입력에 (4,12)→(4,10) 미끄러져 정지 (y=${s1.y})`);

  // 소프트락 없이 계속 위로 진행해 리더 접근까지 도달(y<=2)
  for(let i=0;i<12;i++){ await p.keyboard.press("ArrowUp"); await p.waitForTimeout(450); }
  const s2=await pos();
  ok(s2.y<=2 && s2.indoor==="gym3", `소프트락 없이 리더 앞까지 도달 (y=${s2.y})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 체육관 얼음 퍼즐 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
