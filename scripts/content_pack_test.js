// 콘텐츠 팩 회귀 테스트: 열매나무(재생) · HM 힌트 NPC · 인테리어 바닥볼 가시성 · 코스트/신전 도구.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ── 1. 열매나무: 익음 → 수확 → 재생 대기 → 재생 ── */
  const berry=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("leafdrake",10)]; G.indoor=null; G.berries={}; G.playSec=0; G.heldStock={};
    const bt=F.BERRY_TREES[0];
    const ripe0=F.berryRipe(bt);          // 처음엔 익음
    const heldBefore=(G.heldStock[bt.item]||0);
    const harvested=F.harvestBerry(bt);   // 수확 → heldStock +1, G.berries 기록
    const heldAfter=(G.heldStock[bt.item]||0);
    const ripeJust=F.berryRipe(bt);       // 방금 땄으니 안 익음
    G.playSec = (G.berries[bt.k]||0) + bt.sec;   // sec초 경과
    const ripeAgain=F.berryRipe(bt);      // 다시 익음
    return { ripe0, harvested, heldBefore, heldAfter, item:bt.item, ripeJust, ripeAgain, sec:bt.sec }; });
  ok(berry.ripe0 && berry.harvested, "열매나무: 처음엔 익어 있고 수확된다");
  ok(berry.heldAfter===berry.heldBefore+1, `수확하면 지닌물건(${berry.item}) +1 (${berry.heldBefore}→${berry.heldAfter})`);
  ok(berry.ripeJust===false, "방금 딴 나무는 안 익은 상태");
  ok(berry.ripeAgain===true, `${berry.sec}초 뒤 다시 익는다(재생)`);

  /* ── 2. 열매나무: 실내에선 없음(오버월드 전용) + A로 수확(interact) ── */
  const berry2=await p.evaluate(()=>{ const S=window.SG, F=S.flow; const bt=F.BERRY_TREES[0];
    // (a) 실내에선 열매나무 없음
    S.setG(S.freshState()); let G=S.G(); G.party=[S.makeMon("leafdrake",10)]; G.indoor="cave";
    const inCave=F.berryAt(bt.x,bt.y);
    // (b) 깨끗한 오버월드에서 A로 수확
    for(let i=0;i<6 && F.dialogActive();i++)F.advanceDialog();   // ⚠️ 앞 블록 harvestBerry의 대사가 모듈 전역에 남아 interact를 막는다
    S.setG(S.freshState()); G=S.G(); G.party=[S.makeMon("leafdrake",10)]; G.berries={}; G.playSec=0; G.heldStock={};
    F.enterMap(true); G.pos={x:bt.x,y:bt.y};
    if(S.Field){ S.Field.dir="down"; S.Field.arrived=true; }
    F.interact();
    return { inCave, picked:(S.G().heldStock[bt.item]||0)>0 }; });
  ok(berry2.inCave===null, "열매나무는 오버월드 전용(실내에선 없음)");
  ok(berry2.picked, "A(interact)로 열매를 수확한다");

  /* ── 3. G.berries 세이브 왕복 ── */
  const save=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("leafdrake",10)]; G.berries={bt_grass:42};
    const okd=F.deserialize(JSON.parse(JSON.stringify(F.serialize())));
    return { okd, round:(S.G().berries&&S.G().berries.bt_grass) }; });
  ok(save.okd && save.round===42, "G.berries 세이브/로드 보존");

  /* ── 4. HM 힌트 NPC + 건틀릿 퀘스트 giver + 코스트/신전 도구 ── */
  const misc=await p.evaluate(()=>{ const S=window.SG, F=S.flow;
    const woods=F.NPCS.find(n=>n.id==="woodsman");
    const gq=F.QUESTS.find(q=>q.id==="q_gauntlet");
    const giverExists=gq&&F.NPCS.some(n=>n.id===gq.giver);
    const gi=S.flow.GROUND_ITEMS||[];
    const coast=gi.some(g=>g.in==="coast"), shrine=gi.some(g=>g.in==="shrine");
    return { woods:!!(woods&&woods.chat&&woods.chat.length),
             gq:!!gq, giverExists, hint:woods&&/자르기|괴력|파도타기/.test((woods.chat||[]).join("")),
             coast, shrine, berryTrees:F.BERRY_TREES.length }; });
  ok(misc.woods && misc.hint, "HM 힌트 NPC(나무꾼)가 자르기·괴력·파도타기를 설명");
  ok(misc.gq && misc.giverExists, "건틀릿 퀘스트 q_gauntlet + giver 존재");
  ok(misc.coast && misc.shrine, "코스트·신전에 바닥 도구 배치");
  ok(misc.berryTrees>=3, `열매나무 ${misc.berryTrees}그루 배치`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 콘텐츠 팩 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
