// 낚싯대 등급 회귀: 좋은/초 낚싯대로 rodTier 상승 → 대물(fishRare) 확률 상승. 세이브·구세이브 마이그레이션.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ── 1. rodup 아이템: 등급 상승 + 하위 거절 ── */
  const up=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.hasRod=true; G.rodTier=1; G.items={goodrod:1,superrod:1};
    F.applyItemEffect({key:"goodrod",use:"rodup",tier:2,nm:"좋은 낚싯대"}); const t2=G.rodTier;
    F.applyItemEffect({key:"superrod",use:"rodup",tier:3,nm:"초 낚싯대"}); const t3=G.rodTier;
    G.items.goodrod=1; const rej=F.applyItemEffect({key:"goodrod",use:"rodup",tier:2,nm:"좋은 낚싯대"}); // 이미 3등급 → 거절
    return { t2, t3, rejected:(rej===false && G.rodTier===3 && G.items.goodrod===1) }; });
  ok(up.t2===2 && up.t3===3, `좋은→2등급, 초→3등급 (${up.t2},${up.t3})`);
  ok(up.rejected, "하위 낚싯대는 거절(소모 안 됨)");

  /* ── 2. 대물 확률: 등급 높을수록 fishRare (Math.random 고정으로 결정적) ── */
  const rare=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("shellow",20)]; G.hasRod=true;
    const rareSet=new Set(F.ENC_POOLS.fishRare);
    const _rand=Math.random; Math.random=()=>0.20;   // 대물 임계: tier1=0.10(안 걸림) · tier3=0.55(걸림)
    const foeAt=t=>{ G.rodTier=t; G.inBattle=false; G.busy=false; F.startFishEncounter(); return S.G().foe.id; };
    const t1=foeAt(1), t3=foeAt(3);
    Math.random=_rand;
    return { t1Rare:rareSet.has(t1), t3Rare:rareSet.has(t3), t1, t3 }; });
  ok(rare.t1Rare===false, `구 낚싯대(1등급)는 대물 안 걸림 (${rare.t1})`);
  ok(rare.t3Rare===true, `초 낚싯대(3등급)는 대물 걸림 (${rare.t3})`);

  /* ── 3. rodTier 세이브 + 구세이브 마이그레이션(hasRod만 있으면 1) ── */
  const save=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("shellow",20)]; G.hasRod=true; G.rodTier=3;
    const ser=F.serialize(); const okd=F.deserialize(JSON.parse(JSON.stringify(ser))); const round=S.G().rodTier;
    // 구세이브: rodTier 필드 없이 hasRod=true
    const old=JSON.parse(JSON.stringify(ser)); delete old.rodTier; old.hasRod=true;
    F.deserialize(old); const migrated=S.G().rodTier;
    return { okd, round, migrated }; });
  ok(save.okd && save.round===3, `rodTier 세이브/로드 보존 (${save.round})`);
  ok(save.migrated===1, `구세이브(rodTier 없음)는 1등급으로 마이그레이션 (${save.migrated})`);

  /* ── 4. 상점/표기 ── */
  const reg=await p.evaluate(()=>{ const F=window.SG.flow;
    return { shop:["goodrod","superrod"].every(k=>F.SHOP.some(x=>x.key===k)), ko:["goodrod","superrod"].every(k=>F.ITEM_KO[k]) }; });
  ok(reg.shop && reg.ko, "좋은/초 낚싯대 상점·표기 등록");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 낚싯대 등급 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
