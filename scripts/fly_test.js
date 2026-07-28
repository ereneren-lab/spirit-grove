// 공중날기 회귀 (유저: "포켓몬처럼 다양하게, 공중날기도 해서 갈 수 있는 그런 구조면 더 재밌을 것 같은데").
//
// 예전: '모닥불 귀환'만 있었다 — 모닥불(R)에서 쉰 좌표만 목록에 뜨고, 이름표가 "좌표 (x, y)"라
//       어디로 가는지 감이 없었다. 정령센터 7곳은 아무리 들러도 목록에 안 올랐다.
// 지금: 쉬어본 곳(정령센터·모닥불·침대·여관)이 **markHeal 한 곳에서** 착륙 지점으로 자동 등록되고,
//       비전 기술 공중날기(뱃지 3)를 배우면 그 전부로 날아갈 수 있다.
//
// ⚠️ 설계 원칙 2가지를 회귀로 고정한다:
//   · 이름표는 좌표 하드코딩이 아니라 **그 자리 타일에서 파생**(+=정령센터 · R=모닥불) → 맵을 고쳐도 따라온다.
//   · 등록은 markHeal **단일 관문**을 지난다 → 회복 지점을 추가해도 목록에 자동으로 오른다.
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  const boot=async(fly)=>{ await p.evaluate(f=>{ const S=window.SG,G=S.freshState();
      G.party=[S.makeMon("foxfire",20)]; G.pos={x:8,y:44}; G.repel=999; G.hasFly=f;
      S.setG(G); S.flow.enterMap(true); },fly); await p.waitForTimeout(450); };

  console.log("\n[1] 쉬면 착륙 지점으로 등록된다(markHeal 단일 관문)");
  await boot(true);
  const reg=await p.evaluate(()=>{ const S=window.SG,G=S.G();
    const before=(G.flySpots||new Set()).size;
    G.pos={x:12,y:48}; S.flow.markHeal();      // 시작 마을 정령센터 자리
    G.pos={x:20,y:45}; S.flow.markHeal();      // 초원 정령센터 자리
    return { before, after:(S.G().flySpots||new Set()).size }; });
  ok(reg.before===0 && reg.after===2, `쉰 곳이 등록된다 (${reg.before} → ${reg.after})`);

  console.log("\n[2] 이름표는 타일에서 파생 (좌표 하드코딩 아님)");
  const lb=await p.evaluate(()=>{ const F=window.SG.flow;
    // 실제 맵에서 정령센터(+)와 모닥불(R) 좌표를 찾아 라벨을 확인
    const found={};
    for(let y=0;y<50&&(!found["+"]||!found.R);y++)for(let x=0;x<25;x++){
      const t=F.tileAt(x,y); if((t==="+"||t==="R")&&!found[t])found[t]={x,y}; }
    return { center:found["+"]?F.flySpotLabel(found["+"].x,found["+"].y):null,
             fire:found.R?F.flySpotLabel(found.R.x,found.R.y):null,
             plain:F.flySpotLabel(1,1) }; });
  ok(lb.center&&/정령센터/.test(lb.center.nm), `+ 타일 → "${lb.center&&lb.center.nm}"`);
  ok(lb.fire&&/모닥불/.test(lb.fire.nm), `R 타일 → "${lb.fire&&lb.fire.nm}"`);

  console.log("\n[3] 공중날기 전/후 — 목록이 다르다");
  await boot(false);
  await p.evaluate(()=>{ const S=window.SG,G=S.G(),F=S.flow;
    G.pos={x:12,y:48}; F.markHeal();                 // 센터(모닥불 아님)
    // ⚠️ 모닥불 좌표는 **실제 R 타일**에서 찾는다 — 아무 좌표나 쓰면 라벨이 폴백("쉬어간 곳")으로 떨어져
    //    테스트가 헛돈다(실제로 겪음: 게임이 아니라 픽스처가 틀렸다).
    let fire=null;
    for(let y=0;y<50&&!fire;y++)for(let x=0;x<25;x++) if(F.tileAt(x,y)==="R"){ fire={x,y}; break; }
    G.campfires=new Set([fire.x+","+fire.y]); S.setG(G); });
  const noFly=await p.evaluate(()=>{ window.SG.flow.renderWarp();
    return { title:document.getElementById("warpTitle").textContent,
      rows:[...document.querySelectorAll("#warpBody .mon-card")].length,
      body:(document.getElementById("warpBody").textContent||"").slice(0,60) }; });
  ok(/모닥불/.test(noFly.title), `배우기 전 제목은 모닥불 ("${noFly.title.trim()}")`);
  ok(noFly.rows===1, `배우기 전엔 모닥불만 (${noFly.rows}곳 — 센터는 제외)`);

  await p.evaluate(()=>{ const S=window.SG,G=S.G(); G.hasFly=true; S.setG(G); window.SG.flow.renderWarp(); });
  const withFly=await p.evaluate(()=>({ title:document.getElementById("warpTitle").textContent,
    rows:[...document.querySelectorAll("#warpBody .mon-card")].length,
    names:[...document.querySelectorAll("#warpBody .nm")].map(n=>n.textContent) }));
  ok(/공중날기/.test(withFly.title), `배운 뒤 제목은 공중날기 ("${withFly.title.trim()}")`);
  ok(withFly.rows===2, `센터 + 모닥불 둘 다 뜬다 (${withFly.rows}곳)`);
  ok(withFly.names.some(n=>/정령센터/.test(n)) && withFly.names.some(n=>/모닥불/.test(n)),
     `지점 이름이 지역+종류로 뜬다 (${withFly.names.join(" / ")})`);

  console.log("\n[4] 실제로 날아간다");
  const flew=await p.evaluate(async()=>{ const S=window.SG,G=S.G();
    const from={...G.pos}; S.flow.warpTo(12,48);
    await new Promise(r=>setTimeout(r,800));
    return { from, to:{...S.G().pos}, indoor:S.G().indoor }; });
  ok(flew.to.x===12&&flew.to.y===48, `목적지로 이동 (${flew.from.x},${flew.from.y} → ${flew.to.x},${flew.to.y})`);
  ok(!flew.indoor, "오버월드로 나온 상태다");

  console.log("\n[5] 비전 기술 습득 — 뱃지 3에서 배운다");
  const grant=await p.evaluate(()=>{ const src=window.SG.flow.trainerDefeated.toString();
    return /hasFly[\s\S]{0,80}forestBadges\(\)>=3/.test(src); });
  ok(grant, "뱃지 3개 이상에서 공중날기를 배우는 분기가 있다");

  console.log("\n[6] 세이브 왕복");
  const rt=await p.evaluate(()=>{ const S=window.SG,G=S.G();
    G.party=[S.makeMon("foxfire",20)]; G.hasFly=true; G.flySpots=new Set(["12,48","20,45"]); S.setG(G);
    const raw=JSON.parse(JSON.stringify(S.flow.serialize()));
    const okk=S.flow.deserialize(raw);
    return { okk, fly:!!S.G().hasFly, n:(S.G().flySpots||new Set()).size }; });
  ok(rt.okk===true, "deserialize 성공");
  ok(rt.fly && rt.n===2, `공중날기·착륙 지점이 보존된다 (fly=${rt.fly} · ${rt.n}곳)`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs.length?": "+errs[0]:""})`);
  console.log(fail?"\n❌ 실패":"\n🎉 공중날기 통과");
  await b.close(); process.exit(fail);
})();
