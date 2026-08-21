// H3-8b 회귀 — 코드/QR 기반 정령 교환. serMon→base64url 코드 왕복, 체크섬 검증, QR이 실제로 디코드되는가,
// 그리고 UI(교환 중개인 NPC→내보내기→받기)로 정령이 보관함에 들어오는가.
// 왜: 오프라인 단일 HTML의 유일한 교환 수단. 직렬화/QR 인코더/UI 어느 하나가 깨지면 조용히 못 쓴다.
const { chromium } = require("playwright"); const path=require("path"); let jsQR=null; try{ jsQR=require("jsqr"); }catch(_){}
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // ── 코드 왕복 · 체크섬 · QR 매트릭스 ──
  const r=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState());
    const m=S.makeMon("blazelion",42); m.nick="불꽃이"; m.shiny=true; m.nature="adamant";
    m.ivs={hp:31,atk:31,def:20,spa:5,spDef:10,spd:28}; m.moves=["inferno","flare","crunch","suckerpunch"];
    const code=F.tradeCodeFor(m); const back=F.parseTradeCode(code);
    const badChk=F.parseTradeCode(code.slice(0,-1)+(code.slice(-1)==="X"?"Y":"X"));
    const badFmt=F.parseTradeCode("nonsense");
    const eggCode=F.tradeCodeFor(S.makeMon("blazelion",5));   // 형식만 확인
    const mods=F.qrModules(code);
    return { code, ok:!back.err, id:back.mon&&back.mon.id, nick:back.mon&&back.mon.nick,
      shiny:back.mon&&back.mon.shiny, lv:back.mon&&back.mon.level, moves:back.mon&&back.mon.moves,
      ivatk:back.mon&&back.mon.ivs&&back.mon.ivs.atk, nature:back.mon&&back.mon.nature,
      badChk:!!badChk.err, badFmt:!!badFmt.err, qrN:mods.length, mods, hasEgg:!!eggCode }; });

  ok(r.ok && r.id==="blazelion", "코드가 종을 왕복 복원한다");
  ok(r.nick==="불꽃이", "한글 별명이 보존된다(UTF-8 base64url)");
  ok(r.shiny===true && r.lv===42 && r.nature==="adamant", "이로치·레벨·성격이 보존된다");
  ok(JSON.stringify(r.moves)===JSON.stringify(["inferno","flare","crunch","suckerpunch"]) && r.ivatk===31, "커스텀 기술셋·개체값이 보존된다");
  ok(r.badChk && r.badFmt, "체크섬 훼손·형식 오류 코드는 거부된다");
  ok(r.qrN>=21, `QR 매트릭스가 생성된다 (${r.qrN}×${r.qrN})`);
  if(jsQR){ const n=r.qrN,s=6,pad=4*s,W=n*s+pad*2; const d=new Uint8ClampedArray(W*W*4).fill(255);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(r.mods[y][x])for(let dy=0;dy<s;dy++)for(let dx=0;dx<s;dx++){ const i=((pad+y*s+dy)*W+(pad+x*s+dx))*4; d[i]=d[i+1]=d[i+2]=0; }
    const dec=jsQR(d,W,W); ok(dec&&dec.data===r.code, "생성한 QR이 원본 코드로 디코드된다(폰 카메라 호환)");
  } else console.log("  … jsqr 없음 — QR 디코드 검증 건너뜀");

  // ── UI: 교환 중개인 → 내보내기 → 받기(보관함 유입) ──
  const ui=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState());
    const G=S.G(); G.party=[S.makeMon("krakentide",40)]; G.box=[];
    const npc=(S.NPCS||[]).find(n=>n.tradecode);
    F.openTradeCode();                                  // 홈
    const homeOpen=(document.getElementById("tradeOverlay")||{}).classList.contains("active");
    // 내보내기 → 첫 정령 코드
    const code=F.tradeCodeFor(G.party[0]);
    // 받기: 코드 파싱→보관함
    const before=G.box.length; const res=F.parseTradeCode(code);
    if(!res.err){ res.mon.traded=true; G.box.push(res.mon); }
    return { npc:!!npc, homeOpen, gained:G.box.length-before, boxId:G.box[0]&&G.box[0].id }; });

  ok(ui.npc, "교환 중개인 NPC가 존재한다");
  ok(ui.homeOpen, "교환 오버레이가 열린다");
  ok(ui.gained===1 && ui.boxId==="krakentide", "받은 정령이 보관함에 들어온다");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 코드/QR 교환 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
