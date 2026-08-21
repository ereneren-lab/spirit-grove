// 진화 취소 + type2 회귀 테스트: 진화 중 B/X로 취소하면 안 하고, 취소 안 하면 진화 +
// 이중타입 진화 시 type2가 반영되는가(예전 인라인 진화는 type2를 안 챙기던 버그).
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  await p.evaluate(()=>{ const SG=window.SG,G=SG.freshState(); G.party=[SG.makeMon("emberwolf",20)]; G.foe=SG.makeMon("leafdrake",18); G.inBattle=true; SG.setG(G); });

  const cancel = await p.evaluate(async()=>{ const SG=window.SG; const m=SG.makeMon("foxfire",16); SG.G().party[0]=m;
    const pr=SG.flow.evolveCheck(m,true); await new Promise(r=>setTimeout(r,400));
    const btn=!!document.querySelector(".evo-cancel");
    document.dispatchEvent(new KeyboardEvent("keydown",{key:"x"}));
    const result=await pr; return { btn, result, id:m.id }; });
  ok(cancel.btn, "진화 중 취소 버튼이 뜬다(모바일)");
  ok(cancel.result===false && cancel.id==="foxfire", `취소 시 진화 안 함 (id=${cancel.id})`);

  const evo = await p.evaluate(async()=>{ const SG=window.SG; const m=SG.makeMon("wyverna",42); SG.G().party[0]=m;
    const r=await SG.flow.evolveCheck(m,false); return { r, id:m.id, type:m.type, type2:m.type2 }; });
  ok(evo.r===true && evo.id==="skydrake", `취소 안 하면 진화 (id=${evo.id})`);
  ok(evo.type==="dragon" && evo.type2==="flying", `이중타입 진화 시 type2 반영 (${evo.type}/${evo.type2})`);
  ok(errs.length===0, "런타임 에러 0");

  console.log(process.exitCode?"\n❌ 실패":"\n🎉 진화 취소·type2 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
