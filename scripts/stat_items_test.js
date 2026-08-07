// 스탯 아이템 회귀 테스트: 영양제(EV) · 민트(성격) · 병뚜껑(IV). 백엔드(evs/nature/ivs)에 반영되는가.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    const m=S.makeMon("racoonmon",30); m.evs={hp:0,atk:0,def:0,spa:0,spDef:0,spd:0};
    m.ivs={hp:0,atk:0,def:0,spa:0,spDef:0,spd:0}; m.nature="hardy";
    G.party=[m]; G.active=0; G.items={protein:2,mint_adamant:1,bottlecap:1,carbos:30};
    const out={};
    // (a) 영양제: 공격 EV +10
    const atkStat0=(function(){ S.recalc(m); return m.atk; })();
    F.applyItemEffect({key:"protein",use:"ev",stat:"atk",amt:10}); out.evAtk=m.evs.atk; out.itemDec=G.items.protein;
    // (b) EV 상한: 한 스탯 252, 총합 510
    for(let i=0;i<30;i++)F.applyItemEffect({key:"carbos",use:"ev",stat:"spd",amt:10});
    out.evSpdCap=m.evs.spd;   // 252 상한
    // (c) 민트: 성격 변경
    F.applyItemEffect({key:"mint_adamant",use:"mint",nature:"adamant"}); out.nature=m.nature; out.mintDec=G.items.mint_adamant;
    // (d) 병뚜껑: IV 전부 31
    F.applyItemEffect({key:"bottlecap",use:"bottlecap"}); out.ivAllMax=["hp","atk","def","spa","spDef","spd"].every(k=>m.ivs[k]===31); out.capDec=G.items.bottlecap;
    // (e) 이미 최고면 거절(병뚜껑 재사용)
    G.items.bottlecap=1; const rej=F.applyItemEffect({key:"bottlecap",use:"bottlecap"}); out.reuseRejected=(rej===false && G.items.bottlecap===1);
    // (f) 레지스트리/상점/교환소
    out.shopVit=F.SHOP.some(x=>x.key==="protein");
    out.exMint=F.PREMIUM.some(x=>x.key==="mint_adamant") && F.PREMIUM.some(x=>x.key==="bottlecap");
    return out; });

  ok(r.evAtk===10 && r.itemDec===1, `단백질: 공격 EV +10 + 아이템 소모 (EV ${r.evAtk})`);
  ok(r.evSpdCap===252, `EV 한 스탯 상한 252 (${r.evSpdCap})`);
  ok(r.nature==="adamant" && r.mintDec===0, `민트: 성격이 adamant로 (${r.nature})`);
  ok(r.ivAllMax && r.capDec===0, "황금 병뚜껑: IV 전부 31");
  ok(r.reuseRejected, "이미 최고 IV면 병뚜껑 거절(소모 안 됨)");
  ok(r.shopVit && r.exMint, "영양제=상점 · 민트/병뚜껑=교환소 등록");

  /* 세이브 왕복: EV/성격/IV 보존 */
  const save=await p.evaluate(()=>{ const S=window.SG, F=S.flow; S.setG(S.freshState()); const G=S.G();
    const m=S.makeMon("racoonmon",30); m.evs={hp:0,atk:200,def:0,spa:0,spDef:0,spd:0}; m.nature="adamant"; m.ivs={hp:31,atk:31,def:31,spa:31,spDef:31,spd:31};
    G.party=[m];
    const okd=F.deserialize(JSON.parse(JSON.stringify(F.serialize()))); const n=S.G().party[0];
    return { okd, ev:n.evs&&n.evs.atk, nat:n.nature, iv:n.ivs&&n.ivs.atk }; });
  ok(save.okd && save.ev===200 && save.nat==="adamant" && save.iv===31, "EV·성격·IV 세이브/로드 보존");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 스탯 아이템 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
