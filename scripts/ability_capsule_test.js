// H2-6 회귀 — 특성 캡슐: 정령의 특성(m.ability)을 바꾸는 재화 싱크가 실제로 작동하는가.
// 왜: 성격 민트와 짝을 이루는 육성 마감 아이템. BAG_ITEMS 정의·applyItemEffect·교환소 판매·
//     대상선택 어느 하나가 어긋나면 조용히 못 쓴다(닿지 않는 아이템). dead_content가 잡지 못하는 동작을 단정.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    const BAG=S.BAG_ITEMS||F.BAG_ITEMS;
    const caps=BAG.filter(x=>x.use==="abilitycap");
    // 모든 캡슐이 실재 특성을 가리키고 ITEM_KO·PREMIUM에 등록됐는가
    const ABIL=S.ABILITY_KO||{}; const KO=F.ITEM_KO||S.ITEM_KO||{}; const PREM=F.PREMIUM||[];
    const allValid=caps.every(c=>ABIL[c.ability]);
    const allNamed=caps.every(c=>KO[c.key]);
    const allSold=caps.every(c=>PREM.some(x=>x.key===c.key));

    // 적용: 특성이 바뀌고 아이템이 소모된다
    const m=S.makeMon("krakentide",40); const before=m.ability;
    G.party=[m]; G.items=G.items||{};
    const cap=caps.find(c=>c.ability!==before)||caps[0];
    G.items[cap.key]=2;
    const applied=F.applyItemEffect(cap,m);
    const afterOne=m.ability, leftAfter=G.items[cap.key];
    const dup=F.applyItemEffect(cap,m);   // 이미 같은 특성 → false, 소모 없음
    const needsTarget=F.itemNeedsTarget(cap);

    // 교환소 구매가 실제 소지품으로 들어온다
    G.money=99999; const prem=PREM.find(x=>x.key==="abcap_sturdy"); const bBefore=G.items.abcap_sturdy||0;
    F.exchangeBuy(prem); const bAfter=S.G().items.abcap_sturdy||0;

    return { n:caps.length, allValid, allNamed, allSold, before, afterOne, applied, leftAfter, dup, needsTarget, bought:bAfter-bBefore, capAbil:cap.ability };
  });

  ok(r.n>=4, `특성 캡슐이 여러 종 있다 (${r.n}종)`);
  ok(r.allValid, "모든 캡슐이 실재 특성을 가리킨다");
  ok(r.allNamed, "모든 캡슐이 ITEM_KO에 한글명이 있다");
  ok(r.allSold, "모든 캡슐이 교환소(PREMIUM)에서 팔린다");
  ok(r.applied && r.afterOne===r.capAbil && r.before!==r.afterOne, `사용 시 특성이 바뀐다 (${r.before}→${r.afterOne})`);
  ok(r.leftAfter===1, "사용하면 아이템이 1개 소모된다");
  ok(r.dup===false, "이미 같은 특성이면 적용되지 않는다(소모 안 함)");
  ok(r.needsTarget, "대상 정령 선택이 필요한 아이템으로 분류된다");
  ok(r.bought===1, "교환소에서 구매하면 소지품에 들어온다");
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 특성 캡슐 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
