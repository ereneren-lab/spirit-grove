// 지역 관문 · 장소 표찰 회귀 (유저: "입구 출구도 없이, 갑자기 들어가지니까 좀 아쉽네").
//
// 오버월드는 y 밴드로 지역이 갈리는데(region()), 경계를 넘어도 작은 토스트 한 줄뿐이라
// "다른 곳에 들어섰다"는 감각이 없었다. 게다가 그 토스트(#mapHint)는 **가로에서 display:none**이라
// 가로 플레이에선 지역 안내가 아예 없었다. 특수 지역 11곳·지선 루트 7개도 타일을 밟는 순간 툭 스왑됐다.
//
// 두 장치를 넣고 그 계약을 여기서 고정한다:
//   1) **관문(_gateFx)** — 경계 행에 나무 기둥+들보를 렌더로만 세운다.
//      ⚠️ 맵 문자열을 절대 건드리지 않는다. 경계에 실제 타일을 놓으면 도달 그래프가 바뀌어
//         게이팅·난이도 곡선이 흔들린다(reachability_test가 보는 바로 그 그래프다).
//   2) **장소 표찰(showPlace)** — 지역 경계·특수 지역·루트가 **한 함수**를 지난다.
//      ⚠️ "각자 그린다"가 이 저장소에서 반복해 사고를 냈다(NPC 스프라이트 29명 중 24명이 이모지였던 건).
//         그래서 개별 문구가 아니라 **공용 경로를 지나는가**를 단정한다.
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  const boot=async(x,y)=>{
    await p.evaluate(([px,py])=>{ const S=window.SG,G=S.freshState();
      G.party=[S.makeMon("foxfire",50), S.makeMon("shellow",1)];
      G.pos={x:px,y:py}; G.repel=999; S.setG(G); S.flow.enterMap(true); },[x,y]);
    await p.waitForTimeout(420); };

  console.log("\n[1] GATE_ROWS가 region()의 실제 경계와 일치한다");
  // ⚠️ 두 상수가 갈라지면 관문이 엉뚱한 줄에 서고, 표찰은 다른 줄에서 뜬다.
  //    관문을 '보기 좋은 위치'로 손보고 싶어질 때 region()도 같이 봐야 한다는 걸 여기서 강제한다.
  const g1=await p.evaluate(()=>{ const F=window.SG.flow;
    const real=[]; for(let y=1;y<50;y++){ if(F.region(y)!==F.region(y-1))real.push(y); }
    return {real, declared:F.GATE_ROWS.slice()}; });
  ok(JSON.stringify(g1.declared.slice().sort((a,b)=>a-b))===JSON.stringify(g1.real.slice().sort((a,b)=>a-b)),
     `경계행 일치 — 선언 [${g1.declared}] · 실제 [${g1.real}]`);
  ok(g1.declared.length===6, `경계가 6곳이다(지역 7곳) — ${g1.declared.length}`);

  console.log("\n[2] 관문은 순수 렌더 장식이다 — 통행성·맵 문자열 불변");
  // ⚠️ 이 게임에서 콘텐츠를 추가하다 도달 그래프를 건드린 사고가 반복됐다.
  //    관문은 "보이기만 하고 아무것도 막지 않는다"가 설계의 전부이므로 그것만 본다.
  await boot(8,44);
  const g2=await p.evaluate(async()=>{ const F=window.SG.flow;
    const snap=()=>{ const w=[]; for(let y=0;y<50;y++){ let row=""; for(let x=0;x<25;x++)row+=F.walkable(x,y)?"1":"0"; w.push(row); } return w.join("\n"); };
    const before=snap();
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));   // 관문을 그리는 프레임을 실제로 지나게 한다
    return {same:before===snap(), sample:before.split("\n")[47]}; });
  ok(g2.same, "관문을 그린 뒤에도 walkable 집합이 한 칸도 안 바뀐다");

  console.log("\n[3] 경계를 넘으면 장소 표찰이 뜬다 (가로에서 사라지는 #mapHint가 아니라)");
  const g3=await p.evaluate(async()=>{ const F=window.SG.flow, G=window.SG.G();
    const el=document.getElementById("placeBanner"); const out=[];
    for(const [y,want] of [[48,"마을"],[44,"초원"],[38,"숲"],[30,"깊은 숲"],[24,"수정 호수"],[16,"고원"],[6,"군주의 제단"]]){
      G.pos={x:8,y}; F.announceRegion(y);
      out.push({want, got:document.getElementById("placeName").textContent, on:el.classList.contains("go")}); }
    return out; });
  g3.forEach(r=>ok(r.got===r.want && r.on, `〔${r.want}〕 표찰 — 표시 "${r.got}" · 애니메이션 ${r.on}`));

  console.log("\n[4] 같은 지역 안에서 걸으면 표찰이 다시 뜨지 않는다 (도배 방지)");
  const g4=await p.evaluate(()=>{ const F=window.SG.flow, G=window.SG.G();
    G.pos={x:8,y:44}; F.announceRegion(44);
    const first=document.getElementById("placeName").textContent;
    document.getElementById("placeName").textContent="__untouched__";
    F.announceRegion(43); F.announceRegion(42);                    // 같은 초원 안에서 두 칸 더
    return {first, after:document.getElementById("placeName").textContent}; });
  ok(g4.first==="초원" && g4.after==="__untouched__", `경계에서만 뜬다 — 진입 "${g4.first}", 같은 지역 재호출 후 "${g4.after}"`);

  console.log("\n[5] 특수 지역·지선 루트는 전부 같은 표찰 경로를 지난다");
  // ⚠️ 개별 문구를 나열해 눈으로 확인하지 않는다 — 새 지역이 추가되면 그 목록만 낡는다.
  //    INTERIORS 전체를 돌며 "생활 건물이 아니면 표찰이 뜬다"는 구조 단정을 건다.
  const g5=await p.evaluate(async()=>{ const F=window.SG.flow;
    const skip=F.PLACARD_SKIP, res={missing:[],leaked:[],checked:0};
    for(const id of Object.keys(F.INTERIORS)){ const m=F.INTERIORS[id]; if(!m||!m.name)continue;
      document.getElementById("placeName").textContent="__none__";
      F.enterInterior(m);
      await new Promise(r=>setTimeout(r,420));                     // warpFade 지연 스왑을 넘긴다
      const shown=document.getElementById("placeName").textContent;
      res.checked++;
      if(skip.indexOf(id)>=0){ if(shown!=="__none__")res.leaked.push(id+"→"+shown); }
      else if(shown!==m.name)res.missing.push(id+"(기대 "+m.name+", 실제 "+shown+")");
      F.exitInterior(); await new Promise(r=>setTimeout(r,300)); }
    return res; });
  ok(g5.checked>=20, `INTERIORS ${g5.checked}곳을 전수로 봤다`);
  ok(g5.missing.length===0, `장소형 인테리어는 전부 표찰이 뜬다 — 누락 ${g5.missing.length}${g5.missing.length?": "+g5.missing.join(", "):""}`);
  ok(g5.leaked.length===0, `생활 건물(상점·집·회관·센터)엔 안 뜬다 — 누출 ${g5.leaked.length}${g5.leaked.length?": "+g5.leaked.join(", "):""}`);

  console.log("\n[6] 표찰 부제가 실제 인테리어와 짝이 맞다 (죽은 문구 없음)");
  const g6=await p.evaluate(()=>{ const F=window.SG.flow;
    const orphan=Object.keys(F.PLACE_SUB).filter(k=>!F.INTERIORS[k]);
    return {orphan, total:Object.keys(F.PLACE_SUB).length}; });
  ok(g6.orphan.length===0, `PLACE_SUB ${g6.total}개가 모두 실재 인테리어를 가리킨다${g6.orphan.length?" — 고아: "+g6.orphan.join(", "):""}`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length})${errs.length?": "+errs.slice(0,3).join(" | "):""}`);
  await b.close();
  console.log(fail?"\n❌ gate_test 실패":"\n✅ gate_test 통과");
  process.exit(fail);
})();
