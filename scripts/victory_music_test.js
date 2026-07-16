// 승리 음악 회귀 테스트: 트레이너를 물리치면 전투 음악(battle)이 깨끗한 승리 팡파르(victory) 트랙으로 교체된다.
// (예전엔 전투 음악이 계속 깔린 채 일회성 SFX만 얹혔음.) endBattle 전에 트랙을 확인.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch({args:["--autoplay-policy=no-user-gesture-required"]});
  const p=await b.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 최소 전투 상태 세팅 + 전투 음악 재생
  const setup=await p.evaluate(()=>{ const SG=window.SG; const G=SG.freshState();
    G.party=[SG.makeMon("emberwolf",20)]; G.active=0; G.inBattle=true;
    G.foe=SG.makeMon("emberwolf",18); G.foe.hp=0;
    G.trainer={key:"__test",team:[["emberwolf",18]],idx:0,money:100,reward:{},rematch:false};
    SG.setG(G); SG.CONFIG.battleText="auto";
    SG.Audio.init && SG.Audio.init(); if(SG.Audio.ctx&&SG.Audio.ctx.resume)SG.Audio.ctx.resume();
    SG.Audio.startMusic("battle");
    return {ctx:!!SG.Audio.ctx, track:SG.Audio.track}; });
  ok(setup.ctx, "오디오 컨텍스트 생성");
  ok(setup.track==="battle", `전투 음악 재생 중 (track=${setup.track})`);

  // 트레이너 격파 처리 시작(비동기) — 첫 await(mw) 전에 startMusic("victory")가 동기 실행됨
  await p.evaluate(()=>{ try{ window.SG.flow.trainerDefeated(); }catch(e){} });
  await p.waitForTimeout(200);   // endBattle(수 초 뒤) 전에 확인
  const mid=await p.evaluate(()=>window.SG.Audio.track);
  ok(mid==="victory", `승리 시 팡파르 트랙으로 교체 (track=${mid})`);
  ok(mid!=="battle", "전투 음악이 계속 깔리지 않음");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 승리 음악 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
