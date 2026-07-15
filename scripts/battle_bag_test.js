// 전투 가방 기본 주머니 회귀 테스트: 전투에선 볼 주머니가 비어(포획은 별도 버튼)
// 기본 탭 '볼'이 "비어있다"로 떠 헷갈리던 문제. 쓸 물건 있는 주머니(회복)로 열리는가.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  await p.evaluate(()=>{ const SG=window.SG,G=SG.freshState(); const m=SG.makeMon("emberwolf",20); m.hp=Math.floor(m.maxHp*0.4);
    G.party=[m]; G.items={ball:6,greatball:2,potion:5,revive:1}; delete G._bagTab; SG.setG(G); SG.flow.enterMap(true); });
  await p.waitForTimeout(400);
  await p.evaluate(()=>{ const SG=window.SG; SG.G().foe=null; SG.flow.startEncounter(0.05); });
  await p.waitForTimeout(2200);
  await p.click('#mainMenu [data-act="item"]'); await p.waitForTimeout(400);

  const tab = await p.evaluate(()=>window.SG.G()._bagTab);
  const usable = await p.evaluate(()=>document.querySelectorAll("#bagBody .bag-item .pick").length);
  const emptyInBag = await p.evaluate(()=>{ const b=document.getElementById("bagBody"); return b.textContent.includes("이 주머니는 비어있다"); });
  ok(tab==="heal", `전투 가방이 회복 주머니로 열림 (tab=${tab})`);
  ok(usable>=2, `쓸 수 있는 회복 아이템이 보인다 (${usable}개)`);
  ok(!emptyInBag, "가방 본문에 '비어있다'가 안 뜬다");
  ok(errs.length===0, "런타임 에러 0");

  console.log(process.exitCode?"\n❌ 실패":"\n🎉 전투 가방 기본 주머니 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
