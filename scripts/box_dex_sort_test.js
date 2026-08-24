// H5-B 회귀 — 박스/도감 정렬·검색. 98종 시대의 탐색 편의.
// ⚠️ 핵심 위험: 박스를 정렬해 보여줄 때 카드 액션이 '보이는 순서'가 아니라 '실제 인덱스'를 건드려야 한다.
//    (정렬 뷰에서 꺼내기/방생이 엉뚱한 정령을 건드리면 데이터 손실.) 이 테스트가 그 매핑을 못박는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
    const firstCardName=()=>((q("#pcBody .mon-card .nm")||{}).textContent||"").trim();
    G.party=[S.makeMon("foxfire",5)];
    G.box=[S.makeMon("blazelion",40),S.makeMon("wispkin",12),S.makeMon("gearclad",55),S.makeMon("psykit",20)];
    G.box[2].shiny=true;   // gearclad
    F.openPC(); document.getElementById("pcTabBox").click();

    const hasSearch=!!q("#boxSearchInput");
    const clickSort=lbl=>{ const b=qa("#pcBody button").find(x=>x.textContent===lbl); if(b)b.click(); };

    clickSort("레벨↓"); const lvTop=firstCardName();          // gearclad(55)
    clickSort("이름");  const nameTop=firstCardName();          // 가나다 첫
    clickSort("이로치"); const shTop=firstCardName();           // gearclad(이로치)

    // 검색
    const inp=q("#boxSearchInput"); inp.value="요술"; inp.dispatchEvent(new Event("input"));
    const searchN=qa("#pcBody .mon-card").length; const searchName=firstCardName();
    inp.value=""; inp.dispatchEvent(new Event("input"));

    // 인덱스 안전성: 레벨↓ 정렬 상태에서 첫 카드(gearclad, 실제 idx2) 꺼내기 → 파티에 gearclad
    clickSort("레벨↓");
    const withBtn=qa("#pcBody .mon-card .pick").find(x=>x.textContent==="꺼내기"); withBtn&&withBtn.click();
    const gotRight=G.party.map(m=>m.id).includes("gearclad") && !G.box.map(m=>m.id).includes("gearclad");

    // 도감 정렬·검색
    F.renderDex&&F.renderDex();
    const dexSearch=!!q("#dexSearchInput");
    const di=q("#dexSearchInput"); di.value="강철"; di.dispatchEvent(new Event("input"));
    const dexCards=qa("#dexBody .mon-card").length;   // 강철 타입/이름 매치 종만

    return { hasSearch, lvTop, nameTop, shTop, searchN, searchName, gotRight, dexSearch, dexCards };
  });

  ok(r.hasSearch, "박스 탭에 검색창이 있다");
  ok(/강철갑충/.test(r.lvTop), `레벨↓ 정렬: 최고레벨이 맨 위 (${r.lvTop})`);
  ok(/강철갑충/.test(r.shTop), "이로치 정렬: 이로치가 맨 위");
  ok(r.searchN===1 && /요술여우/.test(r.searchName), `검색이 이름으로 좁힌다 (${r.searchN}장, ${r.searchName})`);
  ok(r.gotRight, "⭐정렬 뷰에서 액션이 '실제 인덱스'의 정령을 건드린다(엉뚱한 정령 X)");
  ok(r.dexSearch, "도감에 검색창이 있다");
  ok(r.dexCards>0 && r.dexCards<98, `도감 검색이 목록을 좁힌다 (강철 → ${r.dexCards}종)`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 박스·도감 정렬/검색 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
