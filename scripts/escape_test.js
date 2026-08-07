// 탈출로프 회귀 테스트.
//  - 막다른 던전(동굴 등)에서 쓰면 입구 밖 오버월드로 즉시 나오고 아이템 1개 소모
//  - 오버월드(실내 아님)·비던전 인테리어(센터 등)·전투 중엔 쓸 수 없다(소모 안 됨)
//  - warpFade 지연 스왑이라 스왑 완료(indoor=null) 후 저장
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  const wait=ms=>p.waitForTimeout(ms);

  const rope={key:"escaperope",use:"escape",where:"map"};

  /* ── 1. 던전에서 탈출 + 소모 ── */
  const esc=await p.evaluate(async(rope)=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; const G=S.G();
    G.party=[S.makeMon("racoonmon",20)]; G.active=0; G.indoor=null; G.pos={x:8,y:22};
    F.enterInterior(F.INTERIORS.cave); await new Promise(r=>setTimeout(r,350));
    const inCave=G.indoor==="cave"; const owx=S.G().pos&&S.G().pos.x;
    G.items.escaperope=1;
    const ret=F.applyItemEffect(rope);   // exitInterior 트리거(비동기)
    await new Promise(r=>setTimeout(r,650));
    return { inCave, ret, afterIndoor:S.G().indoor, consumed:(S.G().items.escaperope||0)===0 };
  }, rope);
  ok(esc.inCave, "동굴에 진입했다");
  ok(esc.afterIndoor===null, `탈출로프로 오버월드로 나왔다 (indoor=${esc.afterIndoor})`);
  ok(esc.consumed, "탈출로프 1개 소모됨");

  /* ── 2. 오버월드에선 거절(소모 안 됨) ── */
  const ow=await p.evaluate((rope)=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("racoonmon",20)]; G.indoor=null; G.pos={x:8,y:44}; G.items.escaperope=2;
    const ret=F.applyItemEffect(rope);
    return { ret, left:G.items.escaperope, indoor:G.indoor };
  }, rope);
  ok(ow.ret===false && ow.left===2, `오버월드에선 못 쓴다(소모 안 됨, 남은 ${ow.left})`);

  /* ── 3. 비던전 인테리어(센터)에선 거절 ── */
  const ctr=await p.evaluate(async(rope)=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; const G=S.G();
    G.party=[S.makeMon("racoonmon",20)]; G.indoor=null; G.pos={x:12,y:48}; G.items.escaperope=2;
    F.enterInterior(F.INTERIORS.center); await new Promise(r=>setTimeout(r,350));
    const inCenter=G.indoor==="center";
    const ret=F.applyItemEffect(rope);
    await new Promise(r=>setTimeout(r,200));
    return { inCenter, ret, left:S.G().items.escaperope, stillIn:S.G().indoor==="center" };
  }, rope);
  ok(ctr.inCenter && ctr.ret===false && ctr.left===2 && ctr.stillIn, `센터 같은 비던전에선 못 쓴다(남은 ${ctr.left}, 여전히 실내)`);

  /* ── 4. 전투 중 거절 ── */
  const bt=await p.evaluate((rope)=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("racoonmon",20)]; G.indoor="cave"; G.inBattle=true; G.items.escaperope=1;
    const ret=F.applyItemEffect(rope);
    return { ret, left:G.items.escaperope };
  }, rope);
  ok(bt.ret===false && bt.left===1, "전투 중엔 못 쓴다");

  /* ── 5. 상점/도감 등록 ── */
  const reg=await p.evaluate(()=>{ const S=window.SG,F=S.flow;
    return { shop:F.SHOP.some(x=>x.key==="escaperope"), ko:S.ITEM_KO&&S.ITEM_KO.escaperope }; });
  ok(reg.shop, "상점에서 살 수 있다");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 탈출로프 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
