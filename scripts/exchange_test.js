// 교환소(후반 돈 소비처) 회귀 테스트.
//  - 교환상인 NPC(exchange 플래그)가 리그 앞에 있고 talkNPC가 openExchange로 분기
//  - PREMIUM 재고: 타입 부적 10종(#1과 연결) + 진화의 돌 3 + 반짝임의 부적
//  - exchangeBuy: 코인 차감 + 지닌물건/아이템 지급, 코인 부족 시 거절
//  - 반짝임의 부적: 1회 구매(unique) + 샤이니 출현 확률 ×2 (Math.random 고정으로 결정적 검증)
//  - shinyCharm 세이브 왕복
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ── 1. NPC + 재고 ── */
  const s=await p.evaluate(()=>{ const S=window.SG,F=S.flow;
    const npc=F.NPCS.find(n=>n.exchange);
    const P=F.PREMIUM; const charms=P.filter(x=>x.key.indexOf("charm_")===0);
    return { has:!!npc, x:npc&&npc.x, y:npc&&npc.y,
             charmCount:charms.length, allCharmsHeld:charms.every(x=>x.held),
             stones:["thunderstone","waterstone","firestone"].every(k=>P.some(x=>x.key===k)),
             shiny:P.some(x=>x.key==="shinycharm"&&x.unique) }; });
  ok(s.has && s.y<12, `교환상인 NPC가 리그 앞(region 6)에 있다 (${s.x},${s.y})`);
  ok(s.charmCount===Object.keys(await p.evaluate(()=>window.SG.TYPES)).length && s.allCharmsHeld, `타입 부적 ${s.charmCount}종이 재고(지닌물건)`);
  ok(s.stones && s.shiny, "진화의 돌 3종 + 반짝임의 부적(unique) 재고");

  /* ── 2. 구매: 코인 차감 + 지급, 코인 부족 거절 ── */
  const buy=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.money=10000; G.heldStock={};
    const charm=F.PREMIUM.find(x=>x.key==="charm_fire");
    F.exchangeBuy(charm); const afterBuy={ money:G.money, stock:(G.heldStock.charm_fire||0) };
    G.money=100; const before=(G.heldStock.charm_fire||0);
    F.exchangeBuy(charm); const afterPoor={ money:G.money, stock:(G.heldStock.charm_fire||0) };
    return { afterBuy, afterPoor, priced:charm.price, poorSame:afterPoor.stock===before }; });
  ok(buy.afterBuy.money===10000-buy.priced && buy.afterBuy.stock===1, `교환 시 코인 차감 + 지닌물건 지급 (잔액 ${buy.afterBuy.money}, 부적 ×${buy.afterBuy.stock})`);
  ok(buy.poorSame, "코인이 부족하면 지급 안 됨");

  /* ── 3. 반짝임의 부적: unique + 샤이니 확률 ×2 (Math.random 고정) ── */
  const shiny=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    // SHINY_RATE=1/64(0.0156), 부적 ×2=1/32(0.03125). 그 사이값 0.02로 고정하면 부적 유무로 샤이니가 뒤집힌다.
    const _rand=Math.random; Math.random=()=>0.02;
    G.dexMaster=false; G.shinyCharm=false;
    const noCharm=S.makeMon("racoonmon",10).shiny;   // 0.02 > 0.0156 → false
    // 구매
    G.money=99999; const it=F.PREMIUM.find(x=>x.key==="shinycharm"); F.exchangeBuy(it);
    const bought=!!G.shinyCharm, money1=G.money;
    F.exchangeBuy(it); const money2=G.money;   // 재구매 시도 → 차감 없어야
    const withCharm=S.makeMon("racoonmon",10).shiny;   // 0.02 < 0.03125 → true
    Math.random=_rand;
    return { noCharm, bought, withCharm, reboughtSame:money1===money2, price:it.price }; });
  ok(shiny.bought, "반짝임의 부적 구매 시 G.shinyCharm 설정");
  ok(shiny.reboughtSame, "반짝임의 부적은 1회만(재구매 차감 없음)");
  ok(shiny.noCharm===false && shiny.withCharm===true, `부적이 샤이니 확률을 올린다(고정 난수로 뒤집힘: ${shiny.noCharm}→${shiny.withCharm})`);

  /* ── 4. shinyCharm 세이브 왕복 ── */
  const save=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("racoonmon",10)]; G.shinyCharm=true;   // ⚠️ 파티를 채워야 deserialize가 조기 반환 안 함
    const ser=F.serialize(); const okd=F.deserialize(JSON.parse(JSON.stringify(ser)));
    return { okd, round:!!S.G().shinyCharm }; });
  ok(save.okd && save.round, "shinyCharm 세이브/로드 보존(거짓 양성 방지)");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 교환소 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
