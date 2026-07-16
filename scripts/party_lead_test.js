// 파티 순서 → 전투 선두 회귀 테스트: 전투 시작 시 파티 첫 생존 정령(슬롯0)이 나온다.
// 재정렬로 순서를 바꾸면 전투에 나오는 정령도 바뀐다. 슬롯0이 기절이면 다음 생존.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  const lead=()=>p.evaluate(()=>{ const g=window.SG.G(); return g.party[g.active] && g.party[g.active].id; });

  // 1) active가 1이어도 전투 시작하면 슬롯0(foxfire)이 선두
  await p.evaluate(()=>{ const S=window.SG; const G=S.freshState(); G.party=[S.makeMon("foxfire",10),S.makeMon("shellow",10)]; G.active=1; S.setG(G); S.flow.enterMap(true); });
  await p.evaluate(()=>window.SG.flow.startEncounter(0.99)); await p.waitForTimeout(1400);
  ok(await lead()==="foxfire", `전투 선두=슬롯0 (active=1→ ${await lead()})`);

  // 2) 재정렬로 shellow를 슬롯0에 → 전투 선두가 shellow
  await p.evaluate(()=>{ const S=window.SG; const G=S.freshState(); G.party=[S.makeMon("foxfire",10),S.makeMon("shellow",10)]; G.active=0; S.setG(G); S.flow.enterMap(true);
    S.flow.pcAction("down",0); });   // 슬롯0을 아래로 → [shellow, foxfire]
  const order=await p.evaluate(()=>window.SG.G().party.map(m=>m.id));
  ok(order[0]==="shellow", `재정렬로 슬롯0=shellow (${order.join(",")})`);
  await p.evaluate(()=>window.SG.flow.startEncounter(0.99)); await p.waitForTimeout(1400);
  ok(await lead()==="shellow", `재정렬 후 전투 선두=shellow (${await lead()})`);

  // 3) 슬롯0이 기절이면 다음 생존 정령이 선두
  await p.evaluate(()=>{ const S=window.SG; const G=S.freshState(); const a=S.makeMon("foxfire",10); a.hp=0; G.party=[a,S.makeMon("shellow",10)]; G.active=0; S.setG(G); S.flow.enterMap(true); });
  await p.evaluate(()=>window.SG.flow.startEncounter(0.99)); await p.waitForTimeout(1400);
  ok(await lead()==="shellow", `슬롯0 기절 시 다음 생존 정령 선두 (${await lead()})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 파티 순서 선두 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
