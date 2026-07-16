// 배치 버그 수정 회귀 테스트:
//  1) 잠듦 상태가 "잠듦"으로 표시(STATUS_KO.slp 누락 → undefined 였음)
//  2) 정령관리 파티 순서 조절(재정렬)
//  3) makeMon 레벨 항상 정수(avgLevel float가 새어 소수점 레벨 방지)
//  4) 진화의 돌(배틀 밖) 진화 장면 — 실루엣 모프 + 성공 시에만 돌 소모
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch({args:["--autoplay-policy=no-user-gesture-required"]});
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 3) makeMon 레벨 floor
  const lv=await p.evaluate(()=>{ const S=window.SG; return { a:S.makeMon("emberwolf",12.7).level, b:S.makeMon("shellow",8.99).level, c:S.makeMon("foxfire",5).level }; });
  ok(lv.a===12 && lv.b===8 && lv.c===5, `makeMon 레벨 정수화 (12.7→${lv.a}, 8.99→${lv.b}, 5→${lv.c})`);

  // 1) 잠듦 상태 칩이 "잠듦"으로(undefined 아님)
  const slp=await p.evaluate(()=>{ const S=window.SG; const G=S.freshState(); G.party=[S.makeMon("emberwolf",20)]; G.active=0;
    G.party[0].status="slp"; G.inBattle=true; G.foe=S.makeMon("shellow",10); S.setG(G);
    try{ S.flow.renderCombatants(); }catch(e){ return {err:e.message}; }
    return { html:document.getElementById("meStages").innerHTML }; });
  ok(!slp.err && (slp.html||"").includes("잠듦"), `잠듦 상태 칩 표시 (${((slp.html||'').replace(/<[^>]+>/g,'').trim())||slp.err})`);
  ok(!(slp.html||"").includes("undefined"), "상태 칩에 undefined 안 뜸");

  // 2) 파티 순서 조절
  const re=await p.evaluate(()=>{ const S=window.SG; const G=S.freshState();
    G.party=[S.makeMon("foxfire",5), S.makeMon("shellow",5)]; G.active=0; S.setG(G);
    S.flow.pcAction("down",0);
    const g=S.G(); return { first:g.party[0].id, second:g.party[1].id, active:g.active }; });
  ok(re.first==="shellow" && re.second==="foxfire", `파티 순서 스왑 (${re.first},${re.second})`);
  ok(re.active===1, `선택 정령 인덱스 따라감 (active=${re.active})`);

  // 4) 진화의 돌 진화 장면
  await p.evaluate(()=>{ const S=window.SG; const G=S.freshState(); G.party=[S.makeMon("cindercat",20)]; G.active=0; G.items.firestone=1; S.setG(G); S.flow.enterMap(true);
    S.flow.evolveScene(G.party[0], S.byId("tigerflame"), "firestone"); });
  let evo=null;
  for(let i=0;i<45;i++){ const r=await p.evaluate(()=>({id:window.SG.G().party[0].id, stone:window.SG.G().items.firestone||0, open:document.getElementById("evoOverlay").classList.contains("active")}));
    if(r.id==="tigerflame"){ evo=r; break; } await p.waitForTimeout(150); }
  ok(evo && evo.id==="tigerflame", `돌 진화 완료 (id=${evo&&evo.id})`);
  ok(evo && evo.stone===0, `성공 시에만 돌 소모 (firestone=${evo&&evo.stone})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 배치 버그 수정 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
