// 타이틀/메뉴 음악 회귀 테스트: 첫 제스처에 언락 리스너가 잔잔한 title 테마를 재생,
// startMusic이 이후 필드 음악으로 교체(맵 진입 시나리오). Chromium Web Audio.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch({args:["--autoplay-policy=no-user-gesture-required"]});
  const p=await b.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(700);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // 제스처 전: 타이틀 활성, 오디오 미초기화(무음)
  const pre=await p.evaluate(()=>({track:window.SG.Audio.track, ctx:!!window.SG.Audio.ctx,
    titleOn:document.getElementById("title").classList.contains("active")}));
  ok(pre.titleOn, "타이틀 화면 활성");
  ok(pre.track==null && !pre.ctx, `제스처 전 무음 (track=${pre.track}, ctx=${pre.ctx})`);

  // 첫 제스처(키 입력) → 언락 리스너가 title 테마 시작
  await p.keyboard.press("Shift"); await p.waitForTimeout(350);
  const on=await p.evaluate(()=>({track:window.SG.Audio.track, timer:!!window.SG.Audio.timer, ctx:!!window.SG.Audio.ctx,
    hasTitleTrack:!!window.SG.Audio.tracks.title}));
  ok(on.hasTitleTrack, "title 트랙 정의됨");
  ok(on.ctx, "제스처 후 오디오 컨텍스트 생성");
  ok(on.track==="title", `타이틀 테마 재생 (track=${on.track})`);
  ok(on.timer, "스케줄러 동작 중");

  // 필드 음악이 타이틀을 교체(맵 진입 시 startMusic 호출 시나리오)
  await p.evaluate(()=>window.SG.Audio.startMusic("forest")); await p.waitForTimeout(120);
  const sw=await p.evaluate(()=>window.SG.Audio.track);
  ok(sw==="forest", `startMusic이 트랙 교체 (track=${sw})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 타이틀 음악 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
