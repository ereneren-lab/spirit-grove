// 전멸(화이트아웃) 음악 회귀 테스트: 패배 징글 사운드가 존재하고, 전멸 시 전투 음악이 멈춘다(stopMusic).
// 포켓몬식 화이트아웃. Chromium Web Audio 계측.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch({args:["--autoplay-policy=no-user-gesture-required"]});
  const p=await b.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 1) defeat 사운드가 여러 노트를 낸다
  const r1=await p.evaluate(()=>{ const A=window.SG.Audio; A.init&&A.init(); if(A.ctx&&A.ctx.resume)A.ctx.resume();
    if(!A.ctx)return {err:"no ctx"};
    let n=0; const oc=A.ctx.createOscillator.bind(A.ctx); A.ctx.createOscillator=function(){ n++; return oc(); };
    A.muted=false; const before=n; A.sfx("defeat"); return {notes:n-before}; });
  if(r1.err){ console.log("❌",r1.err); process.exit(1); }
  ok(r1.notes>=5, `패배 징글이 여러 노트를 냄 (${r1.notes}개)`);

  // 2) 전멸(모든 정령 기절) 시 전투 음악이 멈춘다
  const r2=await p.evaluate(()=>{ const SG=window.SG; const G=SG.freshState();
    const m=SG.makeMon("emberwolf",20); m.hp=0; G.party=[m]; G.active=0; G.inBattle=true; G.trainer=null;
    G.foe=SG.makeMon("emberwolf",8); SG.setG(G); SG.CONFIG.battleText="auto";
    SG.flow.enterMap(true); G.inBattle=true;   // Field 초기화(endBattle/blackout 안전)
    SG.Audio.init&&SG.Audio.init(); if(SG.Audio.ctx&&SG.Audio.ctx.resume)SG.Audio.ctx.resume();
    SG.Audio.startMusic("battle");
    SG._stopSpy=false; const os=SG.Audio.stopMusic.bind(SG.Audio); SG.Audio.stopMusic=function(){ SG._stopSpy=true; return os(); };
    return {track:SG.Audio.track}; });
  ok(r2.track==="battle", `전투 음악 재생 중 (${r2.track})`);

  await p.evaluate(()=>{ try{ window.SG.flow.faintMine(); }catch(e){} });
  let stopped=false;
  for(let i=0;i<30;i++){ const s=await p.evaluate(()=>window.SG._stopSpy); if(s){stopped=true;break;} await p.waitForTimeout(120); }
  ok(stopped, "전멸 시 전투 음악 정지(stopMusic 호출)");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 전멸 음악 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
