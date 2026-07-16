// 전설 강화 회귀 테스트: 5전설이 legend 플래그 + 대폭 상향된 스탯 + tier4. 포획 페널티는 legend 플래그로 게이트.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG; const ids=["dawnwyrm","aqualord","glaciarch","shadowlord","dawnguard"];
    const allLegend=ids.every(id=>S.byId(id).legend===true);
    const allTier4=ids.every(id=>S.byId(id).tier===4);
    const bst=id=>{ const b=S.byId(id).base; return b.hp+b.atk+b.def+b.spd+b.spa+b.spDef; };
    // 일반 최강 티어4(비전설) 대비 종족값이 확실히 높은지
    const regularT4=S.DEX.filter(d=>d.tier===4&&!d.legend).map(d=>{const b=d.base;return b.hp+b.atk+b.def+b.spd+b.spa+b.spDef;});
    const maxRegular=regularT4.length?Math.max(...regularT4):0;
    const minLegendBst=Math.min(...ids.map(bst));
    const dawnHp=S.makeMon("dawnwyrm",56).maxHp;
    return { allLegend, allTier4, dawnBst:bst("dawnwyrm"), minLegendBst, maxRegular, dawnHp, count:S.DEX.length }; });

  ok(r.allLegend, "5전설 모두 legend 플래그");
  ok(r.allTier4, "5전설 모두 tier4");
  ok(r.minLegendBst > r.maxRegular, `전설 종족값 > 일반 최강(전설 최소 ${r.minLegendBst} > 일반 ${r.maxRegular})`);
  ok(r.dawnBst>=260, `여명룡(최종 전설) 종족값 대폭 상향 (${r.dawnBst})`);
  ok(r.dawnHp>=210, `여명룡 Lv56 HP 압도적 (${r.dawnHp})`);
  ok(r.count===86, `DEX 86종 유지 (${r.count})`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 전설 강화 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
