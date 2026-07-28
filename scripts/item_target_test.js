// 아이템 대상 선택 + 라이벌 레벨 스케일링 회귀 (둘 다 유저 제보에서 나온 것)
//
// [A] 아이템: 예전엔 가방에서 "사용"을 누르는 순간 **곧바로 선두에게** 쓰였다
//     (유저 제보: "배틀중에 아이템을 눌렀는데 그냥 자기 마음대로 회복약 써버리네").
//     본가는 아이템 선택 → **대상 정령 선택**이다. 이제 대상을 받는 아이템은 파티 목록을 먼저 띄운다
//     → 실수 탭으로 소모되지 않고, 원하는 정령에게 쓸 수 있다.
//     ⚠️ 대조군: X류(전투 중 선두 전용)·탈출로프처럼 **대상이 없는 아이템은 단계가 늘지 않아야** 한다.
//
// [B] 라이벌: 고정 팀이라 그라인딩한 플레이어에겐 허수아비였다(유저 제보: "라이벌 약해").
//     이제 파티 최고 레벨을 따라오되 **설계 레벨보다 낮아지지는 않는다**(덜 큰 플레이어에겐 원작 그대로).
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);

  const boot=async()=>{ await p.evaluate(()=>{ const S=window.SG; const G=S.freshState();
      G.party=[S.makeMon("foxfire",12),S.makeMon("shellow",11)];
      G.party[0].hp=Math.floor(G.party[0].maxHp/2); G.party[1].hp=Math.floor(G.party[1].maxHp/3);
      G.items.potion=5; G.items.xatk=2; S.setG(G); S.flow.enterMap(true); });
    await p.waitForTimeout(600); };

  /* ── [A] 전투 중 아이템: 대상 선택 단계 ── */
  console.log("\n[A] 전투 중 아이템 → 대상 선택");
  await boot();
  await p.evaluate(()=>window.SG.flow.startEncounter());
  await p.waitForTimeout(2200);
  for(let i=0;i<40;i++){ const rdy=await p.evaluate(()=>!window.SG.G().busy &&
      document.getElementById("mainMenu").offsetParent!==null); if(rdy)break; await p.waitForTimeout(250); }
  ok(await p.evaluate(()=>!!window.SG.G().inBattle), "전투 진입");

  const before=await p.evaluate(()=>window.SG.G().items.potion||0);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")].find(x=>/아이템/.test(x.textContent||"")); if(b)b.click(); });
  await p.waitForTimeout(500);
  ok(await p.evaluate(()=>document.getElementById("bagOverlay").classList.contains("active")), "가방이 열린다");

  // 회복약 "사용" → 소모되지 않고 대상 목록이 떠야 한다
  const picked=await p.evaluate(()=>{ const rows=[...document.querySelectorAll("#bagOverlay .bag-item")];
    const r=rows.find(x=>/^회복약$/.test(((x.querySelector(".nm")||{}).textContent||"").trim()));
    if(!r)return "no-row"; const btn=r.querySelector(".pick"); if(!btn||btn.disabled)return "no-btn"; btn.click(); return "clicked"; });
  ok(picked==="clicked", "회복약 '사용' 클릭");
  await p.waitForTimeout(400);
  const mid=await p.evaluate(()=>{ const body=document.getElementById("bagBody");
    return { potion:window.SG.G().items.potion||0, txt:(body.textContent||"").slice(0,40),
      rows:[...body.querySelectorAll(".bag-item")].length }; });
  ok(mid.potion===before, `아직 소모되지 않았다 (${before}→${mid.potion})`);
  ok(/누구에게 쓸까/.test(mid.txt), `대상 선택이 뜬다 ("${mid.txt.trim()}")`);
  ok(mid.rows===2, `파티 2마리가 후보로 뜬다 (${mid.rows})`);

  // 2번째 정령(비선두)에게 사용 → 그 정령이 회복돼야 한다(예전엔 무조건 선두)
  const hpBefore=await p.evaluate(()=>{ const G=window.SG.G(); return {a:G.party[0].hp,b:G.party[1].hp}; });
  await p.evaluate(()=>{ const rows=[...document.querySelectorAll("#bagBody .bag-item")];
    const btn=rows[1].querySelector(".pick"); btn.click(); });
  await p.waitForTimeout(1200);
  const hpAfter=await p.evaluate(()=>{ const G=window.SG.G(); return {a:G.party[0].hp,b:G.party[1].hp,potion:G.items.potion||0}; });
  ok(hpAfter.b>hpBefore.b, `고른 정령(2번)이 회복됐다 (${hpBefore.b}→${hpAfter.b})`);
  ok(hpAfter.a===hpBefore.a, `선두는 건드리지 않았다 (${hpBefore.a}→${hpAfter.a})`);
  ok(hpAfter.potion===before-1, `이때 비로소 소모된다 (${before}→${hpAfter.potion})`);

  /* ── [A-2] 대조군: 대상 없는 아이템은 단계가 늘지 않는다 ── */
  console.log("\n[A-2] 대조군: 대상 없는 아이템(X공격)은 즉시 적용");
  ok(await p.evaluate(()=>!window.SG.flow.itemNeedsTarget({use:"stage"})), "X류는 대상 선택 대상이 아니다");
  ok(await p.evaluate(()=>window.SG.flow.itemNeedsTarget({use:"heal"})), "회복약은 대상 선택 대상이다");
  ok(await p.evaluate(()=>!window.SG.flow.itemNeedsTarget({use:"escape"})), "탈출로프는 대상 선택 대상이 아니다");

  /* ── [B] 라이벌 스케일링 ── */
  console.log("\n[B] 라이벌이 내 수준을 따라온다");
  await p.reload(); await p.waitForTimeout(900);
  const lv=async(partyLv,key)=>p.evaluate(([plv,k])=>{ const S=window.SG; const G=S.freshState();
      G.party=[S.makeMon("foxfire",plv),S.makeMon("shellow",plv-1),S.makeMon("foxfire",plv-2)];
      S.setG(G); return S.flow.rivalTeam(S.TRAINERS[k]).map(t=>t[1]); },[partyLv,key]);

  const base=await p.evaluate(()=>window.SG.TRAINERS.V.team.map(t=>t[1]));
  const low=await lv(6,"V");
  ok(JSON.stringify(low)===JSON.stringify(base.slice(0,base.length-1).concat(base[base.length-1])) || Math.max(...low)>=Math.max(...base),
     `덜 큰 플레이어(Lv6)에겐 설계 레벨 이상 유지 (설계 ${JSON.stringify(base)} → ${JSON.stringify(low)})`);
  ok(Math.min(...low)>=Math.min(...base), "설계 레벨보다 낮아지지 않는다");

  const high=await lv(30,"V");
  ok(Math.max(...high)>=31, `그라인딩한 플레이어(Lv30)를 따라온다 — 에이스 Lv${Math.max(...high)} (예전엔 고정 ${Math.max(...base)})`);
  ok(Math.max(...high)>Math.max(...low), "파티가 강할수록 라이벌도 강해진다");

  const sz=await p.evaluate(()=>{ const S=window.SG; const G=S.freshState();
    G.party=[1,2,3,4,5].map(()=>S.makeMon("foxfire",30)); S.setG(G);
    return { n:S.flow.rivalTeam(S.TRAINERS.V).length, base:S.TRAINERS.V.team.length }; });
  ok(sz.n>sz.base && sz.n<=sz.base+2, `마릿수도 파티를 따라 붙는다 (설계 ${sz.base} → ${sz.n}, 원작+2 이내)`);

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs.length?": "+errs[0]:""})`);
  console.log(fail?"\n❌ 실패":"\n🎉 아이템 대상 선택 · 라이벌 스케일링 통과");
  await b.close(); process.exit(fail);
})();
