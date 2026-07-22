// 죽은 콘텐츠 감사 — "정의는 있는데 플레이에서 닿지 않는" 것들을 구조적으로 잡는다.
//
// 왜 있나: 이 프로젝트에서 반복해 나온 버그 종류가 정확히 이것이다.
//   · 특수 지역 11곳의 야생 조우가 실내 early-return 때문에 한 번도 안 걸렸다
//   · learn 배열이 중첩으로 깨져 8종이 기술을 안 배웠다
//   · tm_confuse가 어떤 상점·바닥·보상에도 없어 영영 못 얻는 아이템이었다
//   · ITEM_KO에 없는 아이템(기력·엘릭서·TM)은 획득 메시지에 **키가 그대로** 노출됐다
// 개별 수정만으로는 재발하므로, "닿는가"를 데이터에서 직접 단정한다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  process.on("uncaughtException", async e=>{ console.log("❌ 예외:",e.message); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG,F=S.flow;
    // 어디선가 실제로 지급되는 아이템 키를 모은다
    const refs=new Set();
    (F.SHOP||[]).forEach(x=>refs.add(x.key));
    (F.PREMIUM||[]).forEach(x=>refs.add(x.key));
    (F.GROUND_ITEMS||[]).forEach(x=>refs.add(x.item));
    (F.HIDDEN||[]).forEach(x=>refs.add(x.item));
    Object.values(S.TRAINERS||{}).forEach(t=>Object.keys(t.reward||{}).forEach(k=>refs.add(k)));
    Object.values(F.QUESTS||{}).forEach(q=>Object.keys((q.reward&&q.reward.items)||{}).forEach(k=>refs.add(k)));
    const refList=[...refs].filter(k=>k!=="money"&&k!=="coin");
    // (1) 지급되는 키는 전부 한글 이름이 나와야 한다(키 노출 금지)
    const nameless=refList.filter(k=>F.itemName(k)===k);
    // (2) 가방에 있는 아이템은 전부 획득 경로가 있어야 한다
    const bag=(F.BAG_ITEMS||[]).map(x=>x.key);
    // ⚠️ 이벤트로 직접 지급되는 것은 데이터 테이블에 없다 — 코드 경로라 스캔이 안 되므로 명시 허용.
    //    (vsseeker: 첫 트레이너 격파 + 뱃지 1개 이상일 때 trainerDefeated에서 지급)
    const EVENT_GRANTED=new Set(["vsseeker"]);
    const unobtainable=bag.filter(k=>!refs.has(k)&&!EVENT_GRANTED.has(k));
    // (3) 이름표만 있고 아무도 안 주는 아이템
    const orphanNames=Object.keys(F.ITEM_KO||{}).filter(k=>!refs.has(k));
    // (4) 트레이너는 전부 배치돼 있어야 한다(타일·NPC battleKey)
    const tiles=new Set();
    for(const id in F.INTERIORS){ (F.INTERIORS[id].str||[]).forEach(row=>[...row].forEach(c=>tiles.add(c))); }
    for(let y=0;y<50;y++)for(let x=0;x<25;x++){ const t=F.tileAt(x,y); if(t)tiles.add(t); }
    const npcKeys=new Set((F.NPCS||[]).map(n=>n.battleKey).filter(Boolean));
    const special=new Set(["X","SNOW","L","V","T9","T10","T11","T12","T14","T15","T19","T20"]);
    const orphanTrainers=Object.keys(S.TRAINERS||{}).filter(k=>!tiles.has(k)&&!npcKeys.has(k)&&!special.has(k));
    return {refN:refList.length, nameless, bagN:bag.length, unobtainable, orphanNames, orphanTrainers};
  });

  ok(r.nameless.length===0, `지급되는 아이템 ${r.refN}종이 전부 한글 이름을 낸다 (키 노출: ${r.nameless.join(",")||"없음"})`);
  ok(r.unobtainable.length===0, `가방 아이템 ${r.bagN}종이 전부 획득 가능 (경로 없음: ${r.unobtainable.join(",")||"없음"})`);
  ok(r.orphanNames.length===0, `이름표만 있고 안 주는 아이템 없음 (${r.orphanNames.join(",")||"없음"})`);
  ok(r.orphanTrainers.length===0, `배치 안 된 트레이너 없음 (${r.orphanTrainers.join(",")||"없음"})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 죽은 콘텐츠 감사 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
