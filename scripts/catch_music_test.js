// 포획 음악 회귀 테스트: 야생 정령 포획 성공 시 전투 음악(battle)이 승리 팡파르(victory)로 교체된다(포켓몬식).
// Math.random을 고정해 포획 성공을 보장하고, endBattle 전에 트랙 전환을 폴링으로 관찰.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch({args:["--autoplay-policy=no-user-gesture-required"]});
  const p=await b.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 최소 야생 전투 상태 + 전투 음악. HP를 낮춰 포획 확률↑, Math.random 고정으로 성공 보장.
  const setup=await p.evaluate(()=>{ const SG=window.SG; const G=SG.freshState();
    G.party=[SG.makeMon("emberwolf",20)]; G.active=0; G.inBattle=true; G.trainer=null;
    G.foe=SG.makeMon("emberwolf",8); G.foe.hp=1; G.items.ball=9;
    SG.setG(G); SG.CONFIG.battleText="auto"; SG.CONFIG.reduceMotion=true;
    SG.Audio.init && SG.Audio.init(); if(SG.Audio.ctx&&SG.Audio.ctx.resume)SG.Audio.ctx.resume();
    SG.Audio.startMusic("battle"); Math.random=()=>0.01;   // 포획 성공 보장
    return {track:SG.Audio.track, ctx:!!SG.Audio.ctx}; });
  ok(setup.ctx, "오디오 컨텍스트 생성");
  ok(setup.track==="battle", `전투 음악 재생 중 (track=${setup.track})`);

  // 포획 시도(비동기). 성공 확정 시점에 startMusic("victory")가 동기 실행됨.
  await p.evaluate(()=>{ try{ window.SG.flow.tryCatch(); }catch(e){} });
  let got=null;
  for(let i=0;i<45;i++){ const t=await p.evaluate(()=>window.SG.Audio.track); if(t==="victory"){got=t;break;} if(t&&t!=="battle"){got=t;break;} await p.waitForTimeout(150); }
  ok(got==="victory", `포획 성공 시 승리 팡파르로 교체 (track=${got})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 포획 음악 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
