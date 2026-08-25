// 새 기능 회귀 — 파티 프리셋(팀 저장/불러오기).
// ⚠️ 핵심: 프리셋은 정령 uid로 저장 → 불러오면 파티+박스에서 그 정령을 정확히 끌어오고, 정령 손실이 없어야 한다
//   (파티+박스 합 보존). 방생/교환으로 사라진 정령은 건너뛴다. uid·프리셋이 세이브 왕복에 영속돼야 한다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:820},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(600);
  await p.evaluate(()=>{ window.confirm=()=>true; window.prompt=()=>"타워팀"; });
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // ── 저장 → 파티 변경 → 불러오기로 원상 복구 ──
  const r=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G(); const ids=S.DEX.map(d=>d.id);
    G.party=ids.slice(0,3).map(id=>S.makeMon(id,20));   // A B C
    G.box=ids.slice(3,9).map(id=>S.makeMon(id,15));       // D E F G H I
    const A=G.party.map(m=>m.id).join(",");
    F.savePreset("타워팀");
    const uidsAssigned=G.party.every(m=>!!m.uid);
    const presetN=G.teamPresets.length;
    // 파티를 완전히 다른 걸로 바꿈
    G.party=G.box.slice(0,2); G.box=[...ids.slice(0,3).map(id=>{ const mm=G.party.length; return null; })].filter(Boolean);
    // 정확히: 파티+박스 재구성 — 원래 6+3=9마리 유지되게 다시 세팅
    S.setG(G);
    return { A, uidsAssigned, presetN }; });
  ok(r.uidsAssigned, "저장 시 파티 정령에 uid가 부여된다");
  ok(r.presetN===1, "프리셋이 1개 저장된다");

  // ── 불러오기: 정령 손실 없이 저장 팀으로 복원 ──
  const load=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G(); const ids=S.DEX.map(d=>d.id);
    G.party=ids.slice(0,3).map(id=>S.makeMon(id,20));
    G.box=ids.slice(3,9).map(id=>S.makeMon(id,15));
    const totalBefore=G.party.length+G.box.length;
    const wantIds=G.party.map(m=>m.id);
    F.savePreset("타워팀");
    // 파티를 박스 정령들로 갈아끼움(저장 팀은 박스로 흩어짐)
    const p2=G.box.slice(0,3); const rest=[...G.party, ...G.box.slice(3)];
    G.party=p2; G.box=rest; S.setG(G);
    // 프리셋 불러오기
    F.loadPreset(0);
    const g=S.G();
    return { partyIds:g.party.map(m=>m.id), wantIds, total:g.party.length+g.box.length, totalBefore,
      dupe:(new Set([...g.party,...g.box])).size!==(g.party.length+g.box.length) }; });
  ok(load.partyIds.join(",")===load.wantIds.join(","), `불러오면 저장한 팀 그대로 편성 (${load.partyIds.join(",")})`);
  ok(load.total===load.totalBefore, `⭐정령 손실 없음(합 ${load.total}=${load.totalBefore})`);
  ok(!load.dupe, "중복 정령 없음");

  // ── 사라진 정령(방생)은 건너뛴다 ──
  const miss=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G(); const ids=S.DEX.map(d=>d.id);
    G.party=ids.slice(0,3).map(id=>S.makeMon(id,20));
    F.savePreset("팀");
    // 한 마리 방생(제거)
    G.party.splice(1,1); S.setG(G);
    F.loadPreset(0);
    const g=S.G();
    return { n:g.party.length }; });
  ok(miss.n===2, `사라진 정령은 조용히 제외하고 나머지만 편성 (${miss.n}/3)`);

  // ── uid·프리셋 세이브 왕복 영속 ──
  const round=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("foxfire",20),S.makeMon("dewdrop",18)];
    F.savePreset("왕복팀"); const uidBefore=G.party[0].uid;
    const ser=F.serialize(); F.deserialize(ser); const g=S.G();
    return { hasTpre:!!(ser.tpre&&ser.tpre.length), presetKept:(g.teamPresets||[]).some(x=>x.name==="왕복팀"),
      uidKept:g.party[0].uid===uidBefore, usq:ser.usq>0 }; });
  ok(round.hasTpre && round.presetKept, "프리셋이 세이브 왕복에 영속된다");
  ok(round.uidKept && round.usq, "정령 uid가 세이브 왕복에 보존된다(프리셋 매칭 유지)");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 파티 프리셋 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
