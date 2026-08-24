// H5-B-6 회귀 — 박스 일괄 조작(다중선택 이동·방생 + 자동정렬).
// ⚠️ 핵심 위험: 선택은 정렬/필터로 순서가 바뀌어도 "그 정령"을 정확히 집어야 한다(객체 참조 추적).
//   인덱스로 추적하면 정렬 뒤 엉뚱한 정령이 옮겨지거나 방생된다. 이 테스트가 그 정확성을 못박는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  await p.evaluate(()=>{ window.confirm=()=>true; });
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const clickByText=(sel,txt)=>p.evaluate(({sel,txt})=>{ const b=[...document.querySelectorAll(sel)].find(x=>x.textContent.includes(txt)); if(b){b.click();return true;} return false; },{sel,txt});

  // ── 셋업: 파티 1 + 박스 6 ──
  await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("foxfire",30)];
    G.box=[S.makeMon("blazelion",40),S.makeMon("dewdrop",12),S.makeMon("gearclad",50),S.makeMon("psykit",25),S.makeMon("wispkin",33),S.makeMon("nightkit",20)];
    F.openPC(); document.getElementById("pcTabBox").click(); });
  await p.waitForTimeout(60);

  // ── 자동정렬: 레벨↓ 정렬 후 박스에 영구 적용 ──
  await clickByText("#pcBody button","레벨↓");
  await p.waitForTimeout(30);
  await clickByText("#pcBody button","자동정렬");
  await p.waitForTimeout(50);
  const sorted=await p.evaluate(()=>{ const G=window.SG.G(); return { order:G.box.map(m=>m.level), ids:G.box.map(m=>m.id) }; });
  const desc=sorted.order.every((v,i,a)=>i===0||a[i-1]>=v);
  ok(desc && sorted.order.length===6, `자동정렬: 박스가 레벨 내림차순 영구 반영 (${sorted.order.join(",")})`);
  ok(sorted.ids[0]==="gearclad" && sorted.ids[1]==="blazelion", "자동정렬: 실제 객체 순서가 재배열된다");

  // ── 선택 모드 진입 + 전체 선택 + 일괄 꺼내기(파티 여유 5칸) ──
  await clickByText("#pcBody button","선택");
  await p.waitForTimeout(40);
  await clickByText("#pcBody button","전체");
  await p.waitForTimeout(40);
  const selCount=await p.evaluate(()=>{ const el=[...document.querySelectorAll("#pcBody")].map(x=>x.textContent).join(""); const m=el.match(/(\d+)마리 선택/); return m?+m[1]:-1; });
  ok(selCount===6, `전체 선택 시 6마리 선택됨 (${selCount})`);

  await clickByText("#pcBody button","꺼내기");
  await p.waitForTimeout(60);
  const wd=await p.evaluate(()=>{ const G=window.SG.G();
    return { party:G.party.length, box:G.box.length, partyIds:G.party.map(m=>m.id),
      dupe:(new Set([...G.party,...G.box])).size!==(G.party.length+G.box.length) }; });
  ok(wd.party===6 && wd.box===1, `일괄 꺼내기: 파티 6칸까지 채우고 나머지는 박스에 남음 (party ${wd.party}/box ${wd.box})`);
  ok(!wd.dupe, "⭐일괄 꺼내기 후 정령 중복·손실 없음(객체 참조 정확)");

  // ── 정확성: 정렬된 박스에서 특정 카드만 골라 방생 ──
  const rel=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("foxfire",30)];
    G.box=[S.makeMon("blazelion",40),S.makeMon("dewdrop",12),S.makeMon("gearclad",50),S.makeMon("psykit",25)];
    F.openPC(); document.getElementById("pcTabBox").click();
    // 이름 오름차순 정렬 → 화면 순서와 박스 실제 순서가 달라진다
    [...document.querySelectorAll("#pcBody button")].find(x=>x.textContent.includes("이름")).click();
    [...document.querySelectorAll("#pcBody button")].find(x=>x.textContent.includes("선택")).click();
    // 첫 두 카드(화면상)를 선택 → 클릭
    const cards=[...document.querySelectorAll("#pcBody .mon-card")]; cards[0].click(); cards[1].click();
    const pickedNames=[cards[0],cards[1]].map(c=>c.querySelector(".nm").textContent.replace(/\s+/g," ").trim());
    [...document.querySelectorAll("#pcBody button")].find(x=>x.textContent.includes("방생")).click();
    await new Promise(r=>setTimeout(r,50));
    return { box:G.box.map(m=>(m.nick||m.name)), left:G.box.length, picked:pickedNames }; });
  ok(rel.left===2, `일괄 방생: 선택한 2마리만 사라짐 (${rel.left}마리 남음)`);
  ok(rel.picked.every(nm=>!rel.box.some(bn=>nm.includes(bn))), `방생된 건 화면에서 고른 바로 그 정령 (남음: ${rel.box.join(",")})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 박스 일괄 조작 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
