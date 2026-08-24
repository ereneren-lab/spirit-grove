// 온라인 Phase 0 스캐폴드 회귀 — 오프라인 우선 불변식.
// ⚠️ 최우선 원칙: 백엔드가 없거나 온라인이 꺼져 있어도(=지금 스캐폴드 상태) 게임은 100% 정상이어야 한다.
//   NET.* 는 절대 throw하지 않고 {offline:true}로 안전 실패하며, saveGame/전투/직렬화는 무중단.
//   이 테스트가 "온라인은 부가 레이어"라는 불변식을 못박는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:900,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // ── NET 기본 상태: 오프라인 ──
  const base=await p.evaluate(()=>{ const S=window.SG; return {
    hasNet:!!S.NET, enabled:S.NET.enabled, available:S.NET.available(),
    onlineDefault:S.CONFIG.online }; });
  ok(base.hasNet, "NET 모듈이 존재한다");
  ok(base.enabled===false && base.available===false, "기본 상태는 오프라인(enabled=false)");
  ok(base.onlineDefault===false, "CONFIG.online 기본값은 false");

  // ── 모든 NET 메서드가 throw 없이 {offline:true} 반환 ──
  const off=await p.evaluate(async()=>{ const N=window.SG.NET; const out={}; const calls={
      pushSave:()=>N.pushSave(1,{v:4}), pullSave:()=>N.pullSave(1), submitScore:()=>N.submitScore("tower_best",7),
      readBoard:()=>N.readBoard("tower_best",10), putOffer:()=>N.putOffer({id:"foxfire"}),
      claimTrade:()=>N.claimTrade("ABC123"), offerStatus:()=>N.offerStatus("ABC123"), cancelOffer:()=>N.cancelOffer("ABC123") };
    for(const k in calls){ try{ const r=await calls[k](); out[k]=(r&&r.offline===true&&r.ok===false); }catch(e){ out[k]="THREW:"+e.message; } }
    return out; });
  const allOffline=Object.values(off).every(v=>v===true);
  ok(allOffline, "모든 NET 메서드가 throw 없이 {ok:false,offline:true} ("+JSON.stringify(off).slice(0,120)+")");

  // ── 온라인 '켬' 시도해도 스캐폴드는 오프라인으로 안전 귀결(백엔드 없음) ──
  const tryOn=await p.evaluate(async()=>{ const S=window.SG; await S.netTryEnable(true);
    return { online:S.CONFIG.online, enabled:S.NET.enabled, reason:S.NET.reason() }; });
  ok(tryOn.online===true && tryOn.enabled===false, "켜기 의사는 저장되지만 스캐폴드는 오프라인 유지(백엔드 미연결)");
  ok(tryOn.reason==="no-backend", `상태 사유가 명확하다 (${tryOn.reason})`);

  // ── 온라인 켠 상태에서도 saveGame/직렬화/게임이 무중단 ──
  const core=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("foxfire",10)]; G.towerBest=9;
    let threw=null; try{ F.saveGame(); }catch(e){ threw=e.message; }
    const ser=F.serialize(); const reOk=F.deserialize(ser);
    // 온라인 사용 의사가 세이브 왕복에 영속되는지
    return { saveThrew:threw, v:ser.v, on:ser.cfg&&ser.cfg.on, reOk, onlineRestored:S.CONFIG.online }; });
  ok(core.saveThrew===null, "온라인 ON 상태에서도 saveGame이 예외 없이 동작");
  ok(core.v===4 && core.reOk, "직렬화/역직렬화 정상(v:4)");
  ok(core.on===1 && core.onlineRestored===true, "온라인 사용 의사가 세이브(cfg.on)에 영속·복원된다");

  // ── 끄면 다시 깨끗하게 오프라인 ──
  const back=await p.evaluate(async()=>{ const S=window.SG; await S.netTryEnable(false);
    return { online:S.CONFIG.online, enabled:S.NET.enabled }; });
  ok(back.online===false && back.enabled===false, "온라인을 끄면 CONFIG.online=false·오프라인");

  // ── 설정 UI에 온라인 세그가 있다 ──
  const ui=await p.evaluate(()=>document.querySelectorAll("#segOnline button").length);
  ok(ui===2, `설정에 온라인 세그가 있다 (${ui})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 오프라인 불변식(온라인 스캐폴드) 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
