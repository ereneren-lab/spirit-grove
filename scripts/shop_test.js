// 상점 수량 구매 회귀 테스트: −/+ 카운터로 여러 개를 총액 계산해 한 번에 사고, 코인·아이템이 맞게 갱신되는가.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  await p.evaluate(()=>{ const SG=window.SG,G=SG.freshState(); G.party=[SG.makeMon("emberwolf",16)]; G.money=3000; G.pos={x:8,y:44}; SG.setG(G); SG.flow.enterMap(true); });
  await p.waitForTimeout(400);
  await p.evaluate(()=>window.SG.flow.openShop());
  await p.waitForTimeout(300);

  await p.click('#shopBody .bag-item .pick'); await p.waitForTimeout(300);   // 첫 아이템(정령구 120)
  ok(await p.evaluate(()=>document.getElementById("buyOverlay").classList.contains("active")), "구매 클릭 → 수량 모달 열림");

  for(let i=0;i<3;i++){ await p.click('#buyPlus'); await p.waitForTimeout(120); }   // 수량 4
  const st=await p.evaluate(()=>({q:document.querySelector(".buy-qty").textContent, t:document.querySelector(".buy-total b").textContent}));
  ok(st.q==="4", `수량 카운터 +3 → 4 (${st.q})`);
  ok(st.t.includes("480"), `총액이 개당×수량 (${st.t}, 기대 480)`);

  const before=await p.evaluate(()=>({m:window.SG.G().money, n:window.SG.G().items.ball||0}));
  await p.click('#buyOk'); await p.waitForTimeout(400);
  const after=await p.evaluate(()=>({m:window.SG.G().money, n:window.SG.G().items.ball||0}));
  ok(before.m-after.m===480, `코인 480 차감 (${before.m}→${after.m})`);
  ok(after.n-before.n===4, `아이템 4개 증가 (${before.n}→${after.n})`);
  ok(!(await p.evaluate(()=>document.getElementById("buyOverlay").classList.contains("active"))), "구매 후 모달 닫힘");

  // --- 판매 탭 ---
  await p.click('#shopSellTab'); await p.waitForTimeout(300);
  const rodListed = await p.evaluate(()=>[...document.querySelectorAll("#shopBody .bag-item .nm")].some(e=>e.textContent.includes("낚싯대")));
  // 낚싯대 소지시키고 판매목록에서 제외되는지
  await p.evaluate(()=>{ window.SG.G().items.rod=1; });
  await p.click('#shopBuyTab'); await p.waitForTimeout(150); await p.click('#shopSellTab'); await p.waitForTimeout(200);
  const rodAfter = await p.evaluate(()=>[...document.querySelectorAll("#shopBody .bag-item .nm")].some(e=>e.textContent.includes("낚싯대")));
  ok(!rodAfter, "판매 목록에 열쇠 아이템(낚싯대) 없음");

  await p.click('#shopBody .bag-item .pick'); await p.waitForTimeout(300);   // 첫 판매 아이템(정령구 판매가 60)
  await p.click('#buyPlus'); await p.click('#buyPlus'); await p.waitForTimeout(200);   // 수량 3
  const sm=await p.evaluate(()=>({m:window.SG.G().money}));
  await p.click('#buyOk'); await p.waitForTimeout(400);
  const sa=await p.evaluate(()=>({m:window.SG.G().money}));
  ok(sa.m-sm.m===180, `판매 시 코인 +180 (정령구 60×3) (${sm.m}→${sa.m})`);
  ok(errs.length===0, "런타임 에러 0");

  console.log(process.exitCode?"\n❌ 실패":"\n🎉 상점 구매·판매 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
