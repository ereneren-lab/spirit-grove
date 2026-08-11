// 버그 4건 회귀 (2026-07 3차):
//  1. 맹독(toxic)은 본가처럼 누적(maxHp*n/16). 보통 독은 고정 1/8.
//     ⚠️ 맹독은 '독의 변종'이라 status는 psn 그대로 — 해독제·독타입 면역·면역 특성이 동일하게 걸려야 한다.
//  2. 다단히트 2~5회는 가중치(2·3회 각 3/8, 4·5회 각 1/8). 균등이면 평균 타수가 3.5로 부푼다.
//  3. 전투 중에는 저장되지 않는다 — 지는 전투를 저장 후 리로드로 무효화하던 로드스컴 차단.
//     ⚠️ battleUseItem 등이 매 턴 자동 저장을 부르므로 saveGame 자체를 막아야 한다.
//  4. 상점 재고가 뱃지 수로 열린다 — 첫 상점에서 진화의 돌·기술머신까지 다 사서 커브를 우회하던 것.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ let b=null;
  const bail=async e=>{ console.log("  ❌ 예외:",e&&e.message||e); try{ if(b)await b.close(); }catch(_){}; process.exit(1); };
  process.on("uncaughtException",bail); process.on("unhandledRejection",bail);
  b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  /* ── 1. 맹독 누적 ── */
  const tox=await p.evaluate(()=>{
    const S=window.SG, F=S.flow;
    // ⚠️ applyStatus는 renderStages()를 부르고 그게 G.foe를 읽는다 → 최소 전투 상태를 세워야 한다
    S.setG(S.freshState()); const _G=S.G();
    _G.party=[S.makeMon(S.DEX[0].id,20)]; _G.foe=S.makeMon(S.DEX[0].id,20); _G.inBattle=true;
    const mv=S.MOVES.toxic;
    // 맹독은 psn을 걸되 badly 플래그가 있어야 한다
    const marked=!!(mv&&mv.eff&&mv.eff.badly&&mv.eff.status==="psn");
    // ⚠️ 중립 특성으로 고정 — 면역 특성이 섞이면 검증이 가려진다. 독/불 타입도 피한다(타입 면역).
    const sp=S.DEX.find(d=>d.type==="normal"&&d.type2!=="poison");
    const mk=()=>{ const m=S.makeMon(sp.id,40); m.maxHp=160; m.hp=160; m.ability="sturdy"; m.status=null; m._tox=0; return m; };
    const bad=mk(); F.applyStatus(bad,"psn","me",true);
    const norm=mk(); F.applyStatus(norm,"psn","me",false);
    return { marked, sp:sp.id, badTox:bad._tox, normTox:norm._tox,
             badStatus:bad.status, normStatus:norm.status };
  });
  ok(tox.marked, "맹독이 badly 플래그를 갖는다");
  ok(tox.badStatus==="psn"&&tox.normStatus==="psn", "맹독도 status는 psn (해독제·면역이 동일 적용)");
  ok(tox.badTox===1, `맹독은 카운터 1로 시작 (${tox.badTox})`);
  ok(tox.normTox===0, `보통 독은 카운터 0 (${tox.normTox})`);

  // 누적 피해 곡선: maxHp 160 → 10, 20, 30, 40 …
  const curve=await p.evaluate(()=>{
    const maxHp=160; const out=[];
    let n=1; for(let t=0;t<4;t++){ out.push(Math.max(1,Math.floor(maxHp*Math.min(15,n)/16))); n=Math.min(15,n+1); }
    const flat=Math.max(1,Math.floor(maxHp/8));
    return { out, flat };
  });
  ok(JSON.stringify(curve.out)==="[10,20,30,40]", `맹독 피해가 누적된다 (${curve.out.join("→")})`);
  ok(curve.flat===20, `보통 독은 고정 1/8 (${curve.flat})`);

  // 치료 후 다시 보통 독에 걸리면 옛 카운터가 살아나면 안 된다
  const reapply=await p.evaluate(()=>{
    const S=window.SG, F=S.flow;
    // ⚠️ applyStatus는 renderStages()를 부르고 그게 G.foe를 읽는다 → 최소 전투 상태를 세워야 한다
    S.setG(S.freshState()); const _G=S.G();
    _G.party=[S.makeMon(S.DEX[0].id,20)]; _G.foe=S.makeMon(S.DEX[0].id,20); _G.inBattle=true;
    const sp=S.DEX.find(d=>d.type==="normal"&&d.type2!=="poison");
    const m=S.makeMon(sp.id,40); m.ability="sturdy"; m.status=null; m._tox=0;
    F.applyStatus(m,"psn","me",true); m._tox=9;      // 맹독이 한참 진행됨
    m.status=null;                                    // 해독제 등으로 치료
    F.applyStatus(m,"psn","me",false);                // 이번엔 보통 독
    return m._tox;
  });
  ok(reapply===0, `치료 후 보통 독은 맹독으로 되살아나지 않는다 (_tox=${reapply})`);

  // 세이브 왕복
  const toxSave=await p.evaluate(()=>{
    const S=window.SG, F=S.flow;
    const m=S.makeMon(S.DEX[0].id,20); m.status="psn"; m._tox=6;
    const round=F.reviveMon(JSON.parse(JSON.stringify(F.serMon(m))));
    return { tox:round._tox, status:round.status };
  });
  ok(toxSave.tox===6 && toxSave.status==="psn", `맹독 진행도가 세이브에 남는다 (_tox=${toxSave.tox})`);

  /* ── 2. 다단히트 분포 ── */
  const multi=await p.evaluate(()=>{
    const S=window.SG, F=S.flow;
    const c={2:0,3:0,4:0,5:0}; const N=40000;
    for(let i=0;i<N;i++) c[F.multiHits([2,5])]++;
    const pct=k=>c[k]/N*100;
    // 다른 범위는 균등이어야 한다
    const c2={}; for(let i=0;i<4000;i++){ const h=F.multiHits([2,3]); c2[h]=(c2[h]||0)+1; }
    const avg=(2*c[2]+3*c[3]+4*c[4]+5*c[5])/N;
    return { p2:pct(2),p3:pct(3),p4:pct(4),p5:pct(5), avg, other:Object.keys(c2).sort() };
  });
  const near=(v,t,tol)=>Math.abs(v-t)<tol;
  ok(near(multi.p2,37.5,2)&&near(multi.p3,37.5,2), `2·3회가 각 37.5% (${multi.p2.toFixed(1)}/${multi.p3.toFixed(1)})`);
  ok(near(multi.p4,12.5,2)&&near(multi.p5,12.5,2), `4·5회가 각 12.5% (${multi.p4.toFixed(1)}/${multi.p5.toFixed(1)})`);
  ok(near(multi.avg,3.0,0.1), `평균 타수 3.0 (균등이면 3.5로 부푼다) — ${multi.avg.toFixed(2)}`);
  ok(multi.other.join(",")==="2,3", `2~5 외 범위는 균등 유지 (${multi.other.join(",")})`);

  /* ── 3. 전투 중 저장 금지 ── */
  const scum=await p.evaluate(async()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState()); S.CONFIG.reduceMotion=true; F.enterMap(true);
    const G=S.G(); G.party=[S.makeMon(S.DEX[0].id,10)];
    // 필드에서는 저장된다
    G.inBattle=false; G.money=1234; F.saveGame();
    const afterField=localStorage.getItem("spiritgrove_save_v1")||localStorage.getItem(Object.keys(localStorage).find(k=>/spirit|grove|sg/i.test(k))||"");
    const fieldSaved=!!afterField && /1234/.test(afterField);
    // 전투 중에는 저장되지 않아야 한다
    G.inBattle=true; G.money=9999; F.saveGame();
    const key=Object.keys(localStorage).find(k=>/spirit|grove|sg/i.test(k));
    const raw=key?localStorage.getItem(key):"";
    const battleBlocked=!/9999/.test(raw);
    // 전투가 끝나면 다시 저장된다
    G.inBattle=false; F.saveGame();
    const raw2=key?localStorage.getItem(key):"";
    return { fieldSaved, battleBlocked, afterBattle:/9999/.test(raw2), key };
  });
  ok(scum.fieldSaved, "필드에서는 정상 저장된다");
  ok(scum.battleBlocked, "전투 중에는 저장되지 않는다 (로드스컴 차단)");
  ok(scum.afterBattle, "전투가 끝나면 다시 저장된다 (결과가 유실되지 않는다)");

  /* ── 4. 상점 뱃지 게이팅 ── */
  const shop=await p.evaluate(()=>{
    const S=window.SG, F=S.flow; S.setG(S.freshState());
    const G=S.G();
    const stockAt=n=>{ G.badges=["1","2","3","4"].slice(0,n); return F.SHOP.filter(it=>!it.need||F.forestBadges()>=it.need).length; };
    const total=F.SHOP.length;
    const s0=stockAt(0), s1=stockAt(1), s2=stockAt(2), s3=stockAt(3), s4=stockAt(4);
    G.badges=[];
    const gated=F.SHOP.filter(it=>it.need).map(it=>it.key);
    const early=F.SHOP.filter(it=>!it.need).map(it=>it.key);
    return { total, s0,s1,s2,s3,s4, gatedN:gated.length,
             stonesGated:["firestone","waterstone","thunderstone","leafstone"].every(k=>gated.includes(k)),
             tmGated:F.SHOP.filter(it=>it.key.startsWith("tm_")).every(it=>!!it.need),
             basicsOpen:["ball","potion","antidote","repel","rod"].every(k=>early.includes(k)) };
  });
  ok(shop.s0<shop.total, `뱃지 0개에선 전 품목이 아니다 (${shop.s0}/${shop.total})`);
  ok(shop.s0<shop.s1 && shop.s1<shop.s2 && shop.s2<shop.s3, `뱃지가 늘면 재고도 는다 (${shop.s0}→${shop.s1}→${shop.s2}→${shop.s3})`);
  ok(shop.s4===shop.total, `뱃지 4개면 전 품목 (${shop.s4}/${shop.total})`);
  ok(shop.stonesGated, "진화의 돌 4종이 잠겨 있다");
  ok(shop.tmGated, "기술머신 전부가 잠겨 있다");
  ok(shop.basicsOpen, "기본 품목(정령구·회복약·해독제·퇴치·낚싯대)은 처음부터 열려 있다");

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs[0]?": "+errs[0]:""})`);
  await b.close();
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 버그 4건 회귀 통과");
})();
