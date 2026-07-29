// 전수 플레이스루 — 봇이 **실제 입력만으로** 처음부터 최대한 멀리(챔피언까지) 진행한다.
//
// 왜 필요한가:
//   longrun_test는 "첫 뱃지"에서 멈춘다. 그래서 그 뒤 구간(체육관 2~4 · 숲의 군주 · 리그 · 챔피언)은
//   아무도 실제로 걸어본 적이 없었고, 이번 세션에 "문서엔 완비인데 플레이에선 안 돌던" 버그가 6건 나왔다.
//   이 하네스는 진행 가능성 자체를 증명하려는 것 — 어디서 막히는지가 결과물이다.
//
// 봇이 하는 일: 목표 트래커 탭 이동 · 상성 기술 선택 · 회복약 · 위험하면 도주 ·
//   **약해진 야생 포획(파티 6마리까지)** · **정령센터에서 회복** · 진화/기술배우기 오버레이 처리.
// ⚠️ 확률·부하에 좌우되므로 하드 게이트는 "런타임 에러 0 / 진행이 0은 아니다"만. 도달 지점은 참고 출력.
//
// ── 현재 상태: **챔피언 완주 성공** (2026-07-29) ─────────────────────────
// 봇이 타이틀에서 **👑 챔피언까지 49.2분에 실입력만으로 완주**했다. 게임 런타임 에러 **0건**.
//   🏁 체육관1 272초 · 체육관2 635초 · 체육관3 1381초 · 체육관4(리그 개방) 1868초 · 챔피언 2952초
//   전투 244회(야생 190·트레이너 54) · 포획 5 · 회복약 74 · 센터회복 50 · 상점보충 3 · 그라인딩 257 · 전멸(추정) 60
//   최종: 파티 6마리 Lv[5,38,34,48,41,49] · 소지금 21080
// → **"문서엔 완비인데 플레이에선 안 돌던" 구간이 이제 없다**는 게 실측으로 증명됐다.
//   리그(회복 없는 5연전)까지 실입력으로 통과했고, 전멸→부활→재도전 루프도 60회 견뎠다.
// ⚠️ 판마다 편차가 크다 — 같은 코드로 10분 판이 뱃지 0으로 끝나기도 한다. **한 판으로 판단하지 말 것.**
// ⚠️ 숲의 군주(제단 X)는 목표 트래커 사슬 밖의 선택 콘텐츠라 봇이 안 간다(완주와 무관).
//
// 지금까지 잡은 건 **전부 봇 쪽 결함이고 게임 버그는 fullrun 고유 발견 1건**(전멸 후 모달, 아래 15번).
// 고친 결함:
//   1) HP 18%에서 도주 → 경험치를 못 얻어 Lv5 정체·전멸 반복 → 도주는 최후 수단으로
//   2) 간호사 회복이 다단 대사라 clearStory가 대사 사이 공백에서 조기 종료 → 회복 완료까지 폴링
//   3) 실패한 도주를 무한 반복 → 전투당 3회 상한
//   4) 기절 후 **강제 교체 오버레이**를 전투 중에 처리 안 해 Enter만 두드리며 갇힘
//   5) 실내에서 목표 트래커가 숨겨져 **센터 안에 7분간 갇힘** → 출구로 나가는 로직 추가
//   6) 실패한 회복약 클릭을 성공으로 세어 5분에 169회 반복 → 개수 감소로 성공 판정
//   7) **강제 교체에서 숨겨진 ✕를 클릭** → 게임이 다시 열어 무한 루프(정지의 진짜 원인이었다).
//      게임은 정상이다 — forced면 `switchClose`를 display:none으로 감춘다. `.click()`이 숨은 버튼도
//      동작한다는 게 함정. → `offsetParent!==null`로 **보이는 버튼만** 누른다.
//   8) 전투 중 가방이 열린 채 남으면 **주머니 탭만 무한 클릭** → 오버레이를 id로 구분해 가방은 닫는다.
//
// ── 트레이스 사용법 ──
//   TRACE=1 node scripts/fullrun_test.js dist/spirit_grove_3d.html 240
//   매 루프 한 줄(분기·상태·열린 오버레이 id/버튼)을 찍는다. 정지하면 마지막 몇 줄이 곧 원인이다.
//
//   9) **문 앞에서 안 부딪혔다**: 목표(체육관·센터·리그)는 비보행 문이라 봇이 문 앞 칸에 도착한 뒤
//      목표만 계속 재탭하며 제자리를 맴돌았다(walkTo가 0=이미 도착을 반환해 아무 일도 안 난다).
//      → 목표가 바로 옆이면 그 방향으로 부딪혀 들어간다. **이걸로 처음 체육관에 들어갔다.**
//  10) 체육관에 들어가자마자 실내 탈출 로직이 도로 내보냈다 → 체육관·리그는 목표 자체이므로
//      나가지 말고 위로 걸어 트레이너·관장에게 부딪힌다. **이걸로 첫 뱃지를 땄다(뱃지 1/4).**
//  11) **뱃지를 딴 뒤에도 체육관 안에 갇혔다**(실측: 25분 중 22분을 gym1 관장 앞에서 낭비).
//      10)의 "나가지 말고 싸운다"에 "이미 깼으면 나간다"가 없었다. gymN의 관장 타일은 숫자 N,
//      뱃지 키도 "1"~"4"라 같다 → `st.badgeKeys.includes(N)`이면 탈출 분기로 보낸다.
//
//  12) **봇이 팀을 못 꾸려 단일 정령 죽음 루프**(실측: 10분에 파티 1마리·전멸 반복, 뱃지1 후 시작 마을 정체).
//      원인 사슬: (a) 최강 기술로 야생을 OHKO → 잡을 기회 없음. (b) 약한 기술로 깎으려 해도 봇이
//      금세 야생을 **outlevel**해 약한 기술로도 OHKO → 저HP(<0.45, 좋은 확률)에 못 도달 → 볼을 **0회** 던짐.
//      포획 확률은 HP 의존(풀피 기본볼 ≈6% · 30%HP ≈45%)이라 풀피 던지기는 비효율이지만, 칩이 불가능하면
//      그게 유일한 시도다. → **파티가 1마리면 HP 무관 turn1에 일단 던지고**, 2마리 이상이면 약한 기술로
//      깎아서(<0.45/<0.35) 던진다. 이걸로 봇이 **2번째 정령을 잡고 gym2 인테리어까지 도달**(전멸↓·소지금↑).
//
//  13) **상점 볼 보충 구현**(`restockBalls`): 오버월드 S(보행 가능, 밟으면 상점)로 걸어가 정령구를 산다.
//      + 공격적 던지기를 party<3까지 확장 → 봇이 **3마리 팀**을 꾸리고 gym2 인테리어까지 도달(1→3마리).
//      시작 볼 8개로 보통 2마리를 잡아 restock은 볼 소진 후(중반) 걸린다 — 경로는 단독 프로브로 검증됨.
//
//  14) **그라인딩 구현**(`grindStep` + GYM_LV): 언더레벨이면 gym에 안 들어가고 반경8 풀숲(T)으로 걸어가
//      야생과 싸워 레벨을 올린다(gym별 목표 레벨 -1까지). 발동·전투·런타임에러0 확인. ⚠️ **완주급 장기 검증은
//      부하 높은 환경에서 브라우저가 1~6분에 죽어 못 했다**(load 5~6, 게임 버그 아님 — 저부하 세션에서 재측정).
//
//  15) **(게임 버그를 잡았다) 닫히지 않는 오버레이에 45분을 통째로 날렸다.** 저부하 환경 첫 완주 시도가
//      전투 1회·제자리로 끝났다. 트레이스를 보니 필드에서 `OV[switchOverlay] btns=["✕","내보내기[x]"]`가
//      무한 반복 — **전멸 후 필드에 남은 강제 교체 모달**이었다(원인·수정은 `faint_modal_test.js` 참조).
//      봇 쪽 결함은 **Escape만 믿은 것**: 필드 Escape는 `CANCELABLE_OVERLAYS`에 든 것만 닫는데
//      switchOverlay는 그 목록에 없다 → 보이는 `.closex`를 먼저 누르도록 바꿨다.
//      + **감시장치**: 같은 오버레이가 25루프를 버티면 게임 결함으로 기록(리포트에 출력·exit 1)하고
//      강제로 걷어 진행한다. 봇이 조용히 갇히면 그 판이 통째로 헛돈다는 걸 값비싸게 배웠다.
//
//  16) **(게임 UI가 바뀌면 봇이 조용히 멈춘다) '포획'이 볼 선택 가방을 연다.** 지난 세션의 볼 선택 UI 이후
//      봇은 `bagOverlay`면 무조건 ✕로 닫았다 → 포획 → 닫기 → 포획 …으로 **무한 핑퐁**, 전투 하나에 갇혔다
//      (실측: 15분 판이 전투 1회). 같은 이유로 **회복약도 죽어 있었다** — 아이템 대상 선택이 한 단계 더
//      붙었는데 봇은 개수 감소만 확인해 항상 실패로 세고 5회 뒤 회복약을 영영 포기했다.
//      → 볼 선택 화면이면 기본 정령구를 던지고, 대상 목록이 뜨면 **HP 비율이 가장 낮은** 정령을 고른다.
//      ⚠️ 두 화면 모두 렌더 후 300ms 연속탭 가드가 있다 — 그보다 넉넉히 기다린 뒤 눌러야 클릭이 먹는다.
//
//  17) **벽시계의 70%가 메시지 대기였다**(실측: 5분에 전투 10회 · `battle:busy` 210초 = 판당 21초).
//      게임엔 **누르는 동안 빨리감기**(SKIP)가 있는데 봇은 Enter만 두드렸다 — SKIP은 `#battleField`
//      **pointerdown 홀드** 상태라 키로는 안 걸린다. → busy 동안 홀드하고 메뉴를 누를 때 뗀다.
//      판당 busy 21초 → 3.6초, 같은 5분에 **전투 10 → 31회**. 실제 플레이어가 하는 조작 그대로다.
//
//  18) **볼만 사고 회복약은 안 샀다** → 5분에 소지금 21로 파산·회복약 0·저HP마다 도주 10회.
//      전멸하면 소지금 절반이라 자급이 끊긴다. → 상점에서 볼과 회복약을 **한 번에** 산다.
//      16~18을 고친 뒤 7분 판에서 **뱃지 2/4 · 파티 5 · Lv20 · 소지금 1442**(이전 최고는 12.8분에 뱃지 2).
//      ⚠️ 판마다 편차가 크다 — 같은 코드로 12전투/뱃지0(전멸 4)과 38전투/뱃지2가 나온다. 한 판으로 판단 금지.
//
//  19) **건물 문은 정면(아래)에서만 열린다**(`DOOR_TILES="+EHGUSX"`). 목표 트래커는 **인접한 아무 보행칸**으로
//      데려다주므로 옆에 서는 일이 흔하고, 옆에서 부딪히면 "🚪 입구는 건물 정면(아래쪽)에 있다"만 뜬다
//      → `field:bump`가 800ms씩 181회 반복하며 60분 판이 체육관2 앞에서 통째로 죽었다.
//      → 정면 칸이 보행 가능하면 **거기로 먼저 걸어가서** 위로 부딪힌다(자연 입구 D/V/M/J/O/z/^/!/W는 예외).
//      + 같은 자리 부딪힘이 12회를 넘으면 목표 탭으로 폴백. **16~19를 고친 뒤 챔피언 완주가 나왔다.**
//
// ⚠️ 남은 것 / 알려진 비효율:
//   · grindStep이 median 거리 풀숲을 고정 선택 → 두 타일 사이를 오갈 수 있다(조우가 끊어주지만 비효율).
//     레벨이 안 오르면 더 멀리/다른 방향으로 흩어지는 개선 여지.
//   · 목표 트래커 이동이 두 칸 사이를 오갈 때가 있다(8,44 ↔ 9,43). 탭마다 경로가 재계산되고
//     조우로 끊겨 한두 칸만 가고 마는 것으로 보인다. 진행은 되지만 느리다.
//   · ⚠️ **시도했다가 되돌린 방법**: `currentGoal()`의 좌표를 읽어 `walkTo`로 끝까지 걷게 했더니
//     **더 나빠졌다**(6분간 8,44에서 전투 0회). walkTo가 0(이미 도착)을 반환하는데도 재탭만 한 게
//     진짜 문제였다 — 그건 11)이 아니라 9)의 "문에 안 부딪힘"으로 해결됐다. 경로 자체는 문제 없다.
//   · 4뱃지 뒤 그라인딩 게이트는 **일부러 안 건다**(GYM_LV 주석 참조 — 재도전 루프가 곧 그라인딩이다).
// ⚠️ verify.sh·playtest.sh에 **일부러 등록하지 않았다** — 완주에 ~50분이 걸려 CI에 넣을 물건이 아니다.
//    (짧은 판은 뱃지 0으로 끝나기도 해 게이트로도 못 쓴다.) **수동 실행 전용.**
//    수동 실행: node scripts/fullrun_test.js dist/spirit_grove_3d.html <초>
//    정지 진단: TRACE=1 을 붙이고, 분기별 시간은 트레이스를 집계해 본다(아래).
//      perl -ne 'if(/^\s+\[\s*\d+\]\s+\+\s*(\d+)ms\s+(\S+)/){$t{$2}+=$1;$c{$2}++}
//        END{for(sort{$t{$b}<=>$t{$a}}keys %t){printf "%-16s %5d회 %7.1f초\n",$_,$c{$_},$t{$_}/1000}}' run.log
//    ⚠️ 이 집계는 **한 칸 밀려 있다** — dt는 "직전 분기가 끝난 뒤 지금까지"라, 드문 분기의 시간은
//       사실 그 앞 분기의 작업 시간이다(예: `story/dlg` 8초 = 앞선 `field:grind`의 걷기).
//       같은 분기가 연속되는 구간(`battle:busy`)은 자기보정되므로 그건 그대로 읽어도 된다.
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const BUDGET=Number(process.argv[3]||600);
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  const die=async(m)=>{ console.log("❌ "+m); await b.close(); process.exit(1); };
  // ⚠️ 브라우저가 **환경 압박**(부하·장시간)으로 죽는 것은 게임 버그가 아니다 — 그때까지의 진행을
  //    보고하고 정상 종료한다. 그렇지 않으면 25분 실측이 마지막 순간의 크래시로 통째로 날아간다.
  let browserDead=false;
  const isBrowserDeath=e=>/Target (page|closed)|context or browser has been closed|has been closed/i.test(String(e&&e.message||e));
  process.on("unhandledRejection", async e=>{ if(isBrowserDeath(e)){ browserDead=true; return; } die("unhandledRejection: "+e); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(1000);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // ── 게임 시작(타이틀 → 캐릭터 → 스타터 → 스토리) ──
  const clearStory=async(n)=>{ for(let i=0;i<n;i++){
      const hit=await p.evaluate(()=>{
        const s=document.querySelector("#storyOverlay.active");
        if(s){ const btn=s.querySelector("#storyNext")||s.querySelector("button"); if(btn){btn.click(); return "story";} }
        if(document.getElementById("dialogBox").classList.contains("show")){ window.SG.flow.advanceDialog(); return "dlg"; }
        return null; });
      if(!hit)break; await p.waitForTimeout(220); } };
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")].find(x=>/새 게임|시작/.test(x.textContent||"")); if(b)b.click(); });
  await p.waitForTimeout(600);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")].find(x=>/확정|결정|선택/.test(x.textContent||"")); if(b)b.click(); });
  await p.waitForTimeout(600);
  await p.evaluate(()=>{ const c=[...document.querySelectorAll(".starter-card,.mon-card,button")].find(x=>/파라꼬/.test(x.textContent||"")); if(c)c.click(); });
  await p.waitForTimeout(400);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")].find(x=>/결정|확정|이 정령/.test(x.textContent||"")); if(b)b.click(); });
  await clearStory(14);
  const started=await p.evaluate(()=>{ const G=window.SG.G(); return !!(G&&G.party&&G.party.length); });
  if(!started){ // 실패 시 폴백 — 화면 전환 배선이 바뀌었을 수 있다
    await p.evaluate(()=>{ const S=window.SG; const G=S.freshState(); G.party=[S.makeMon("foxfire",5)]; S.setG(G); S.flow.enterMap(true); });
  }
  await p.waitForTimeout(500);

  const t0=Date.now();
  const stats={battles:0,wild:0,trainer:0,caught:0,potions:0,runs:0,heals:0,restocks:0,grinds:0,faints:0,milestones:[],samples:[]};
  let wasBattle=false, lastStep=-1, lastMoney=null, stuck=0, lastKey="", fleeTries=0, healCooldown=0, potionFail=0, finSnapshot=null, lastPartyN=null, restockCd=0;
  let lastOvKey="", ovStuck=0; const stuckOverlays=[];   // 닫히지 않는 오버레이 감시(게임 결함 기록용)
  let bumpKey="", bumpCnt=0;   // 같은 자리 부딪힘 감시(문이 안 열리는 경우 폴백)

  const mark=(name,st)=>{ if(stats.milestones.some(m=>m.name===name))return;
    stats.milestones.push({name, t:Math.round((Date.now()-t0)/1000), lv:st.lv, battles:stats.battles, party:st.party});
    console.log(`     🏁 ${String(Math.round((Date.now()-t0)/1000)).padStart(4)}초  ${name} (파티 ${st.party}마리 · 선두 Lv${st.lv} · 누적 전투 ${stats.battles})`); };

  // 정령센터에서 회복 — 문으로 부딪혀 들어가 카운터의 간호사에게 부딪힌다(실제 조작과 같은 경로)
  const healAtCenter=async()=>{
    const done=await p.evaluate(async()=>{
      const S=window.SG,F=S.flow,G=S.G(); if(G.indoor)return "indoor";
      let best=null,bd=1e9;
      for(let y=0;y<50;y++)for(let x=0;x<25;x++){ if(F.tileAt(x,y)!=="+"){continue;}
        const d=Math.abs(x-G.pos.x)+Math.abs(y-G.pos.y); if(d<bd){bd=d;best={x,y};} }
      if(!best)return "no-center";
      // 문(+)은 비보행이라 인접 보행칸까지 간 뒤 부딪혀 들어간다
      const nb=[[0,1],[0,-1],[1,0],[-1,0]].map(([dx,dy])=>({x:best.x+dx,y:best.y+dy}))
                .filter(q=>F.walkable(q.x,q.y));
      if(!nb.length)return "no-approach";
      const spot=nb[0];
      const n=F.walkTo(spot.x,spot.y);
      return n?("walk:"+spot.x+","+spot.y+":"+best.x+","+best.y):"no-path";
    });
    if(!String(done).startsWith("walk"))return false;
    const [,sp,door]=String(done).split(":");
    const [sx,sy]=sp.split(",").map(Number), [dx,dy]=door.split(",").map(Number);
    let arrived=false, last=null, still=0;
    for(let i=0;i<60;i++){ await p.waitForTimeout(200);
      const q=await p.evaluate(()=>{ const G=window.SG.G(); return {x:G.pos.x,y:G.pos.y,inB:!!G.inBattle}; });
      if(q.inB)return false;
      if(q.x===sx&&q.y===sy){ arrived=true; break; }
      const k=q.x+","+q.y; if(k===last){ if(++still>=4)break; } else { still=0; last=k; } }
    // ⚠️ 도착 못 했는데 방향키를 누르면 엉뚱한 데서 헛돈다 → 포기하고 쿨다운(계속 재시도하면 루프를 통째로 잡아먹는다)
    if(!arrived)return false;
    const dir = dy<sy?"ArrowUp":dy>sy?"ArrowDown":dx<sx?"ArrowLeft":"ArrowRight";
    await p.keyboard.press(dir); await p.waitForTimeout(700);
    // 센터 안: 위로 걸어가 카운터의 간호사에게 부딪히면 회복
    for(let i=0;i<8;i++){ await p.keyboard.press("ArrowUp"); await p.waitForTimeout(260); }
    // ⚠️ 간호사 회복은 인사 → 회복 → 배웅의 다단 대사다. clearStory는 대사 **사이 공백**에서 조기 종료하므로
    //    회복이 끝날 때까지 대사를 넘기며 폴링해야 한다(안 그러면 항상 healed=false → 무한 회복 루프).
    let healed=false;
    for(let i=0;i<24;i++){
      await p.evaluate(()=>{ if(document.getElementById("dialogBox").classList.contains("show"))window.SG.flow.advanceDialog(); });
      await p.waitForTimeout(260);
      healed=await p.evaluate(()=>{ const G=window.SG.G(); return (G.party||[]).every(m=>!m||m.isEgg||m.hp===m.maxHp); });
      if(healed)break;
    }
    // 나가기
    for(let i=0;i<10;i++){ await p.keyboard.press("ArrowDown"); await p.waitForTimeout(220);
      const out=await p.evaluate(()=>!window.SG.G().indoor); if(out)break; }
    if(healed)stats.heals++;
    return healed;
  };

  // 상점에서 정령구 보충 — 팀 구성용. 오버월드 S는 **보행 가능**(밟으면 상점 진입)이라 부딪힘 없이 걸어 들어간다.
  // 볼 8개가 6% 풀피 던지기엔 부족해 팀이 2에서 안 늘던 문제(헤더 참조)를 푼다. 돈은 남으므로(소지금 1000+).
  const restockBalls=async()=>{
    const plan=await p.evaluate(()=>{ const S=window.SG,F=S.flow,G=S.G(); if(G.indoor)return "indoor";
      let best=null,bd=1e9;
      for(let y=0;y<50;y++)for(let x=0;x<25;x++){ if(F.tileAt(x,y)!=="S")continue;
        const d=Math.abs(x-G.pos.x)+Math.abs(y-G.pos.y); if(d<bd){bd=d;best={x,y};} }
      if(!best)return "no-shop";
      // ⚠️ 상점 S는 이제 **비보행 문**이다(포켓몬식 정면 출입구) — 예전처럼 밟아서 들어갈 수 없다.
      //    문 바로 아래 칸까지 걸어간 뒤 위로 부딪혀 들어간다(실제 플레이어와 같은 조작).
      const front={x:best.x,y:best.y+1};
      if(!F.walkable(front.x,front.y))return "no-front";
      const n=F.walkTo(front.x,front.y);
      return (n||(G.pos.x===front.x&&G.pos.y===front.y))?("go:"+front.x+","+front.y):"no-path"; });
    if(!String(plan).startsWith("go"))return false;
    // 상점 진입 대기(S를 밟으면 enterInterior(shop))
    let entered=false,last=null,still=0;
    for(let i=0;i<70;i++){ await p.waitForTimeout(200);
      const q=await p.evaluate(()=>{ const G=window.SG.G(); return {indoor:G.indoor,inB:!!G.inBattle,k:G.pos.x+","+G.pos.y}; });
      if(q.inB)return false;
      if(q.indoor==="shop"){ entered=true; break; }
      if(q.k===last){ if(++still>=5)break; } else { still=0; last=q.k; } }
    if(!entered){ for(let i=0;i<6;i++){ await p.keyboard.press("ArrowUp"); await p.waitForTimeout(240);
        const q=await p.evaluate(()=>window.SG.G().indoor); if(q==="shop"){ entered=true; break; } } }
    if(!entered)return false;
    await p.waitForTimeout(300);
    // 카운터(S)로 걸어 올라가 openShop
    let opened=false;
    for(let i=0;i<6;i++){ await p.keyboard.press("ArrowUp"); await p.waitForTimeout(260);
      opened=await p.evaluate(()=>!!document.querySelector("#shopOverlay.active")); if(opened)break; }
    if(opened){
      // 구매 탭 보장
      const tab=await p.evaluate(()=>{ const ov=document.querySelector("#shopOverlay.active"); if(!ov)return "no";
        const bt=ov.querySelector("#shopBuyTab"); if(bt&&!bt.classList.contains("on")){bt.click();return "tab";} return "ok"; });
      if(tab==="tab")await p.waitForTimeout(150);
      // ⚠️ 볼만 사면 봇이 굶는다 — 5분 프로브에서 **소지금 21로 파산 + 회복약 0**이라 저HP마다 도주했다.
      //    회복약이 없으면 전멸→소지금 절반이 반복돼 자급이 끊긴다. 볼과 회복약을 **한 번에** 산다.
      //    (고급/울트라는 비싸서 제외 — 싼 것을 많이 사는 게 봇에겐 낫다.)
      const wish=[{re:"정령구", ex:"고급|울트라|다크|네트|퀵|힐", n:12},{re:"회복약", ex:"고급|최고", n:8}];
      for(const w of wish){
        const rowClicked=await p.evaluate(({re,ex})=>{ const ov=document.querySelector("#shopOverlay.active"); if(!ov)return false;
          const rows=[...ov.querySelectorAll(".bag-item")]; const nmOf=r=>((r.querySelector(".nm")||{}).textContent||"");
          const R=new RegExp(re), X=new RegExp(ex);
          const row=rows.find(r=>R.test(nmOf(r))&&!X.test(nmOf(r))) || rows.find(r=>R.test(nmOf(r)));
          if(!row)return false; const b=row.querySelector(".pick"); if(!b||b.disabled)return false; b.click(); return true; }, w);
        if(!rowClicked)continue;
        await p.waitForTimeout(220);
        // 수량을 살 수 있는 만큼 늘려 한 번에 산다. buyPlus는 클릭마다 renderTrade로 갱신되므로 매번 재조회.
        await p.evaluate(n=>{ for(let i=0;i<n;i++){ const plus=document.getElementById("buyPlus"); if(plus&&!plus.disabled)plus.click(); else break; } }, w.n);
        await p.waitForTimeout(150);
        await p.evaluate(()=>{ const ok=document.getElementById("buyOk"); if(ok&&!ok.disabled)ok.click(); });
        await p.waitForTimeout(450);
      }
      // 상점 오버레이 닫기(Escape → 안 닫히면 ✕)
      await p.keyboard.press("Escape"); await p.waitForTimeout(220);
      await p.evaluate(()=>{ const c=document.querySelector("#shopOverlay.active .closex,#shopOverlay.active [id*=close]"); if(c)c.click(); });
      await p.waitForTimeout(180);
    }
    // 나가기
    for(let i=0;i<12;i++){ await p.keyboard.press("ArrowDown"); await p.waitForTimeout(230);
      const out=await p.evaluate(()=>!window.SG.G().indoor); if(out)break; }
    const balls=await p.evaluate(()=>{ const G=window.SG.G(); return (G.items.ball||0)+(G.items.greatball||0); });
    if(balls>=4)stats.restocks++;
    return balls>=4;
  };

  // 그라인딩 — 언더레벨이면 gym에 들어가기 전에 근처 풀숲(T)에서 야생과 싸워 레벨을 올린다.
  // (봇이 목표로 직행해 gym 리더에게 언더레벨로 막히던 문제. 이동 중 조우는 메인 루프의 전투 로직이 처리.)
  const grindStep=async()=>{
    const go=await p.evaluate(()=>{ const S=window.SG,F=S.flow,G=S.G(); if(G.indoor)return false;
      const cand=[];
      for(let y=Math.max(1,G.pos.y-8);y<Math.min(49,G.pos.y+9);y++)
        for(let x=Math.max(1,G.pos.x-8);x<Math.min(24,G.pos.x+9);x++){
          if(F.tileAt(x,y)!=="T"||!F.walkable(x,y))continue;
          const d=Math.abs(x-G.pos.x)+Math.abs(y-G.pos.y); if(d>=3)cand.push({x,y,d}); }
      if(!cand.length)return false;
      cand.sort((a,b)=>a.d-b.d); const t=cand[Math.min(cand.length-1,Math.floor(cand.length/2))];   // 중간 거리(고정 — Math.random 회피)
      return F.walkTo(t.x,t.y)?(t.x+","+t.y):false; });
    if(!go)return false;
    for(let i=0;i<40;i++){ await p.waitForTimeout(200);
      const q=await p.evaluate(()=>{ const G=window.SG.G(); return {inB:!!G.inBattle,k:(G.indoor||"")+G.pos.x+","+G.pos.y}; });
      if(q.inB)break;        // 조우 → 메인 루프가 전투 처리
      if(q.k===go)break; }   // 도착 → 다음 루프에서 다른 풀숲으로
    return true;
  };
  // gym별 목표 레벨(리더 대비 -1까지 그라인딩). 밸런스 문서 기준 근사치. **4뱃지 뒤엔 일부러 안 건다.**
  // ⚠️ 리그 앞에서 Lv43까지 그라인딩시키는 게이트를 넣어볼 뻔했으나 **되돌렸다** — 실측에서 봇은
  //    그 게이트 **없이** 챔피언까지 갔다(49.2분, 4뱃지 시점 Lv29 → 챔피언 시점 Lv48).
  //    리그에 언더레벨로 들어가 지고 → 전멸 → 걸어 돌아오며 야생과 싸우는 **재도전 루프 자체가 그라인딩**이다.
  //    게다가 `xpMult`가 지역 앵커(region6=34)를 넘으면 XP를 0.15배로 줄이므로 풀숲 그라인딩은 후반에 매우 느리다.
  //    검증된 동작을 미검증 변경으로 덮지 말 것.
  const GYM_LV=[11,17,25,31];

  // 전투 빨리감기(SKIP) — 게임은 **배틀 필드를 누르는 동안** 텍스트/애니를 빨리 넘긴다(자동 모드).
  // ⚠️ 이걸 안 쓰면 벽시계의 **70%가 메시지 대기**로 사라진다(실측: 5분에 전투 10회 · busy 210초).
  //    Enter를 두드려봐야 소용없다 — SKIP은 pointerdown 홀드 상태다. 실제 플레이어와 같은 조작으로
  //    busy 동안 누르고 있다가, 메뉴를 눌러야 할 때 뗀다.
  let holding=false;
  const ffOn=async()=>{ if(holding)return; try{ await p.dispatchEvent("#battleField","pointerdown"); holding=true; }catch(e){} };
  const ffOff=async()=>{ if(!holding)return; try{ await p.dispatchEvent("#battleField","pointerup"); }catch(e){} holding=false; };

  const TRACE=!!process.env.TRACE;
  let iter=0, lastTrace=Date.now();
  const tr=(branch,st)=>{ if(!TRACE)return; const dt=Date.now()-lastTrace; lastTrace=Date.now();
    console.log(`   [${String(++iter).padStart(4)}] +${String(dt).padStart(5)}ms ${branch.padEnd(14)} `+
      `inB=${st.inB?1:0} busy=${st.busy?1:0} main=${st.mainOn?1:0} mv=${st.moveOn?1:0} ov=${st.overlay?1:0} `+
      `dlg=${st.dlg?1:0} indoor=${st.indoor||"-"} hp=${(st.hp*100).toFixed(0)}% pot=${st.potion} pos=${st.pos.x},${st.pos.y}`+
      (st.ovId!==undefined&&st.ovId!==null?` OV[${st.ovId}] "${st.ovTxt}" btns=${JSON.stringify(st.ovBtns)}`:"")); };
  while((Date.now()-t0)/1000 < BUDGET){
   try {
    if(browserDead)break;
    const st=await p.evaluate(()=>{ const S=window.SG,G=S.G();
      const main=document.getElementById("mainMenu"), mv=document.getElementById("moveMenu");
      const lead=G.party[G.active];
      return { inB:!!G.inBattle, busy:!!G.busy, trainer:!!G.trainer, wild:!!G.inBattle&&!G.trainer,
        dlg:document.getElementById("dialogBox").classList.contains("show"),
        story:!!document.querySelector("#storyOverlay.active"),
        overlay:!!document.querySelector(".overlay.active"),
        ovId:(document.querySelector(".overlay.active")||{}).id||null,
        ovTxt:((document.querySelector(".overlay.active")||{}).textContent||"").replace(/\s+/g," ").trim().slice(0,60),
        ovBtns:[...(document.querySelector(".overlay.active")||{querySelectorAll:()=>[]}).querySelectorAll("button")].map(b=>(b.textContent||"").trim().slice(0,10)+(b.disabled?"[x]":"")).slice(0,8),
        mainOn: main&&getComputedStyle(main).display!=="none",
        moveOn: mv&&getComputedStyle(mv).display!=="none",
        badges:(G.badges||[]).length, badgeKeys:[...(G.badges||[])], lord:!!G.badge, champion:!!G.champion, indoor:G.indoor,
        hp: lead?lead.hp/lead.maxHp:1, lv: lead?lead.level:0, party:(G.party||[]).length,
        partyMaxLv:(G.party||[]).reduce((m,x)=>Math.max(m,(x&&!x.isEgg)?x.level:0),0),
        alive:(G.party||[]).filter(m=>m&&!m.isEgg&&m.hp>0).length,
        potion:(G.items.potion||0)+(G.items.hyperpotion||0),
        balls:(G.items.ball||0)+(G.items.greatball||0),
        foeHp: G.foe?G.foe.hp/G.foe.maxHp:1, money:G.money, pos:G.pos };
    });

    // 빨리감기 홀드는 **메시지 대기 중에만** — 메뉴를 누르거나 필드로 나가면 손을 뗀다.
    if(holding && !(st.inB && st.busy))await ffOff();

    // 포획 집계: 인라인 확인은 포획 애니(~5s)보다 일러 항상 0이었다 → 파티 증가로 센다(단일 출처).
    if(lastPartyN!=null && st.party>lastPartyN)stats.caught+=(st.party-lastPartyN);
    lastPartyN=st.party;

    // 마일스톤
    if(st.badges>=1)mark("체육관1 뱃지",st);
    if(st.badges>=2)mark("체육관2 뱃지",st);
    if(st.badges>=3)mark("체육관3 뱃지",st);
    if(st.badges>=4)mark("체육관4 뱃지 — 리그 개방",st);
    if(st.lord)mark("숲의 군주 격파",st);
    if(st.champion){ mark("👑 챔피언 등극",st); break; }

    if(st.story||st.dlg){ tr("story/dlg",st); await clearStory(6); continue; }

    /* ── 전투 ── */
    if(st.inB){
      if(!wasBattle){ stats.battles++; st.trainer?stats.trainer++:stats.wild++; wasBattle=true; fleeTries=0; }
      // ⚠️ 선두가 기절하면 **강제 교체 오버레이**가 뜬다. 이걸 전투 밖에서만 처리하면
      //    봇이 메뉴를 못 찾아 Enter만 두드리며 영영 갇힌다(실측으로 확인).
      if(st.overlay){
        const picked=await p.evaluate(()=>{ const ov=document.querySelector(".overlay.active"); if(!ov)return false;
          // ⚠️ 오버레이 종류를 구분해야 한다. 예전엔 전부 "아무 버튼이나 누르기"로 처리해서,
          //    가방이 열린 채로 남으면 **주머니 탭만 무한 클릭**하며 전투가 영영 안 끝났다.
          if(ov.id==="bagOverlay"){
            // ⚠️ **'포획'은 이제 볼 선택 가방을 연다**(볼 선택 UI). bagOverlay를 무조건 닫던 옛 코드는
            //    포획 → 닫기 → 포획 …으로 **무한 핑퐁**하며 전투 하나에 갇혔다(실측: 15분 판이 전투 1회).
            //    → 볼 선택 화면이면 닫지 말고 **기본 정령구를 던진다**(싸고 수량이 많다).
            if(/어떤 볼을 던질까/.test(ov.textContent||"")){
              const rows=[...ov.querySelectorAll(".bag-item")];
              const nm=r=>((r.querySelector(".nm")||{}).textContent||"");
              const row=rows.find(r=>/정령구/.test(nm(r))&&!/고급|울트라|다크|네트|퀵|힐/.test(nm(r)))||rows[0];
              const b=row&&[...row.querySelectorAll("button")].find(x=>x.offsetParent!==null&&!x.disabled);
              if(b){ b.click(); return "throw"; }
            }
            const x=[...ov.querySelectorAll("button")].find(b=>b.offsetParent!==null&&/✕|×/.test(b.textContent||""));
            if(x){ x.click(); return true; } return false; }
          // ⚠️ **숨겨진 버튼을 누르면 안 된다.** 강제 교체(기절 후)에서는 게임이 닫기 ✕를 display:none으로
          //    감추는데, .click()은 숨겨진 버튼도 동작한다 → 봇이 ✕를 눌러 닫고 게임이 다시 열어
          //    **무한 루프**에 빠졌다(실측: 이 하네스가 1~5분에 멈추던 진짜 원인).
          const visible=x=>x.offsetParent!==null && !x.disabled;
          const btns=[...ov.querySelectorAll("button")].filter(visible);
          const act=btns.find(x=>/내보내기|배운다|확인|예/.test(x.textContent||""))
                 || btns.find(x=>!/✕|×|닫기|취소|그만/.test(x.textContent||""));
          if(act){ act.click(); return true; }
          const card=[...ov.querySelectorAll(".mon-card")].find(c=>!/기절/.test(c.textContent||"")&&c.offsetParent!==null);
          if(card){ card.click(); return true; } return false; });
        tr("battle:overlay",st); if(!picked)await p.keyboard.press("Enter");
        await p.waitForTimeout(picked==="throw"?1400:320); continue;   // 포획 애니는 길다
      }
      if(st.busy){ tr("battle:busy",st); await ffOn(); await p.keyboard.press("Enter"); await p.waitForTimeout(110); continue; }
      if(st.moveOn){ tr("battle:move",st);
        const idx=await p.evaluate(()=>{ const S=window.SG,G=S.G(); const me=G.party[G.active],foe=G.foe;
          if(!me||!foe)return 0;
          // ⚠️ 팀이 작을 때(<3) 최강 기술로 야생을 OHKO하면 **잡을 기회가 없어 영영 단일 정령**이 된다
          //    (실측: 10분에 파티 1마리·전멸 9회 죽음 루프). → 팀을 꾸리는 동안엔 **가장 약한 damaging 기술**로
          //    깎아 다음 턴 포획을 노린다. 팀이 차거나(≥3) 상대가 이미 반피 이하면 평소대로 최강 기술.
          const balls=(G.items.ball||0)+(G.items.greatball||0);
          const wantWeak = foe && !G.trainer && G.party.length<4 && balls>0 && foe.hp/foe.maxHp>0.4;
          let best=0, bs=wantWeak?1e9:-1;
          me.moves.forEach((k,i)=>{ const mo=S.MOVES[k]; if(!mo||(me.pp[k]||0)<=0)return;
            if((mo.power||0)<=0)return;   // 변화기 제외(깎지 못함)
            let e=S.EFF?S.EFF[mo.type][foe.type]:1;
            if(foe.type2&&foe.type2!==foe.type&&S.EFF)e*=S.EFF[mo.type][foe.type2];
            const stab=(mo.type===me.type||(me.type2&&mo.type===me.type2))?1.5:1;
            const sc=(mo.power||0)*e*stab;
            if(wantWeak){ if(sc<bs){bs=sc;best=i;} } else { if(sc>bs){bs=sc;best=i;} } });
          return best; });
        await p.evaluate(i=>{ const bs=[...document.querySelectorAll("#moveMenu .mbtn")].filter(x=>!x.disabled);
          (bs[i]||bs[0]||{click(){}}).click(); }, idx);
        await p.waitForTimeout(230); continue;
      }
      if(st.mainOn){ tr("battle:main",st);
        // 파티가 모자라면 약해진 야생을 잡는다(게이트는 3~6마리를 전제로 설계돼 있다).
        // ⚠️ 포획 확률은 HP에 크게 좌우된다(풀피 기본볼 ≈6% · 30%HP ≈45%). 하지만 봇이 금세 야생을
        //    outlevel해 **약한 기술로도 OHKO**되면 저HP까지 못 깎는다 → `<0.45` 조건이 한 번도 안 걸려
        //    볼을 0회 던진다(실측: 8조우 0포획). 그래서 **팀이 작으면(<3) HP 무관 매 턴 던진다**
        //    (칩이 불가능할 때 유일한 시도). 볼은 상점 보충으로 채운다(위 restockBalls). 4마리 이상은 깎아서.
        if(st.wild && st.balls>0 && (st.party<3 || (st.party<4 && st.foeHp<0.45) || (st.party<6 && st.foeHp<0.35))){
          const threw=await p.evaluate(()=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")].find(x=>/포획/.test(x.textContent||"")); if(b){b.click();return true;} return false; });
          if(threw){ await p.waitForTimeout(1400); continue; }   // 포획 애니는 길다(~5s) → 여기서 세지 않고 파티 증가로 센다(아래)
        }
        if(st.hp<0.35 && st.potion>0 && potionFail<5){
          await p.evaluate(()=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")].find(x=>/아이템/.test(x.textContent||"")); if(b)b.click(); });
          await p.waitForTimeout(300);
          const used=await p.evaluate(()=>{ const ov=document.getElementById("bagOverlay"); if(!ov)return false;
            const clickIn=root=>{ const rows=[...root.querySelectorAll("*")].filter(e=>/회복약/.test(e.textContent||"")&&e.children.length<6);
              for(const r of rows){ const btn=r.querySelector("button"); if(btn&&!btn.disabled){btn.click();return true;} }
              const d=[...root.querySelectorAll("button")].find(b=>/회복약|사용/.test(b.textContent||"")&&!b.disabled);
              if(d){d.click();return true;} return false; };
            if(clickIn(ov))return true;
            for(const t of [...ov.querySelectorAll("button")].filter(b=>/회복|도구/.test(b.textContent||""))){ t.click(); if(clickIn(ov))return true; }
            return false; });
          // ⚠️ 회복약은 이제 **대상 정령 선택**이 한 단계 더 붙는다(아이템 대상 선택 UI).
          //    예전 코드는 여기서 곧장 개수 감소만 확인해 **항상 실패로 세고 5회 뒤 회복약을 영영 포기**했다.
          //    → 대상 목록이 떠 있으면 HP 비율이 가장 낮은 정령을 고른다. renderItemTarget의 연속탭 가드가
          //      300ms이므로 그보다 넉넉히 기다린 뒤 눌러야 클릭이 먹는다.
          if(used){ await p.waitForTimeout(420);
            await p.evaluate(()=>{ const ov=document.getElementById("bagOverlay"); if(!ov)return false;
              if(!/누구에게 쓸까/.test(ov.textContent||""))return false;
              let best=null,bh=2;
              for(const r of ov.querySelectorAll(".bag-item")){
                const b=r.querySelector("button"); if(!b||b.disabled||b.offsetParent===null)continue;
                const m=/(\d+)\s*\/\s*(\d+)/.exec(((r.querySelector(".ds")||{}).textContent)||"");
                const h=m?Number(m[1])/Number(m[2]):1; if(h<bh){ bh=h; best=b; } }
              if(best){ best.click(); return true; } return false; });
            await p.waitForTimeout(320); }
          // ⚠️ 클릭이 "먹혔는지"를 개수 감소로 확인해야 한다 — 안 그러면 실패한 클릭을 성공으로 세고
          //    같은 분기를 무한 반복한다(실측: 5분에 169회).
          const after=await p.evaluate(()=>{ const G=window.SG.G(); return (G.items.potion||0)+(G.items.hyperpotion||0); });
          if(used && after<st.potion){ stats.potions++; await p.waitForTimeout(500);
            await p.evaluate(()=>{ const c=document.querySelector(".overlay.active .closex"); if(c)c.click(); });
            await p.waitForTimeout(200); continue; }
          await p.keyboard.press("Escape"); await p.waitForTimeout(200);
          potionFail++;   // 회복약 경로가 안 먹으면 그만 시도한다
        }
        if(st.hp<0.12 && st.wild && st.potion===0 && st.alive<=1 && fleeTries<3){ fleeTries++;
          await p.evaluate(()=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")].find(x=>/도망/.test(x.textContent||"")); if(b)b.click(); });
          stats.runs++; await p.waitForTimeout(400); continue;
        }
        await p.evaluate(()=>{ const b=[...document.querySelectorAll("#mainMenu .mbtn")].find(x=>/공격/.test(x.textContent||"")); if(b)b.click(); });
        await p.waitForTimeout(210); continue;
      }
      tr("battle:enter",st); await p.keyboard.press("Enter"); await p.waitForTimeout(170); continue;
    }

    /* ── 필드 ── */
    if(wasBattle)wasBattle=false;
    if(st.overlay){ tr("field:overlay",st); // 진화·기술배우기 등: 확인 버튼이 있으면 누르고 없으면 닫는다
      const handled=await p.evaluate(()=>{ const ov=document.querySelector(".overlay.active"); if(!ov)return false;
        const visible=x=>x.offsetParent!==null && !x.disabled;   // 숨겨진 버튼 클릭 금지(위 주석 참조)
        const b=[...ov.querySelectorAll("button")].filter(visible)
          .find(x=>/내보내기|배운다|확인|그만|예|닫기/.test(x.textContent||""));
        if(b){b.click();return true;} return false; });
      // ⚠️ Escape만 믿으면 안 된다 — 필드 Escape는 `CANCELABLE_OVERLAYS`에 든 오버레이만 닫는다
      //    (switchOverlay는 목록에 없다). 그래서 **보이는 ✕(.closex)** 를 먼저 누른다.
      if(!handled){
        const closed=await p.evaluate(()=>{ const ov=document.querySelector(".overlay.active"); if(!ov)return false;
          const c=[...ov.querySelectorAll(".closex,[data-close]")].find(x=>x.offsetParent!==null);
          if(c){c.click();return true;} return false; });
        if(!closed)await p.keyboard.press("Escape");
      }
      // ⚠️ 그래도 안 닫히면 **게임 결함**이다(실측: 전멸 후 필드에 남은 강제 교체 모달 — ✕가 숨겨져 있어
      //    아무것도 닫지 못했고 45분 런이 통째로 여기서 죽었다). 봇이 조용히 갇히면 그 판이 헛돌므로
      //    같은 오버레이가 계속 버티면 **결함으로 기록**하고 강제로 걷어 진행을 이어간다.
      const ovKey=(st.ovId||"")+"/"+(st.ovTxt||"").slice(0,24);
      if(ovKey===lastOvKey){ if(++ovStuck===25){
          const note=`닫을 수 없는 오버레이: ${st.ovId} "${(st.ovTxt||"").slice(0,40)}" (필드, 버튼 ${JSON.stringify(st.ovBtns)})`;
          if(!stuckOverlays.includes(note))stuckOverlays.push(note);
          console.log("     ⚠️ "+note+" → 강제로 닫고 계속한다");
          await p.evaluate(()=>{ const ov=document.querySelector(".overlay.active"); if(ov)ov.classList.remove("active"); });
          ovStuck=0; } }
      else { lastOvKey=ovKey; ovStuck=0; }
      await p.waitForTimeout(220); continue;
    }
    if(st.alive===0){ tr("field:wipe",st); stats.faints++; await p.waitForTimeout(700); continue; }

    if(lastMoney!=null && st.money<lastMoney-40)stats.faints++;
    lastMoney=st.money;

    // 파티가 다치면 센터로 — 회복약이 없으면 진행이 막히므로 봇도 실제 플레이처럼 회복하러 간다
    if((st.hp<0.5 || st.alive<st.party) && st.potion<=1 && !st.indoor && healCooldown<=0){
      tr("field:heal",st); const healed=await healAtCenter();
      if(healed){ healCooldown=0; continue; }
      healCooldown=12;   // 실패하면 한동안 다시 시도하지 않는다(진행을 막지 않게)
    }
    if(healCooldown>0)healCooldown--;

    // 팀이 작은데 볼이 부족하면 상점에서 정령구 보충(팀 구성의 열쇠 — 볼 8개론 6% 풀피 던지기에 부족).
    // ⚠️ 볼뿐 아니라 **회복약이 마르면** 저HP마다 도주·전멸로 진행이 끊긴다 → 둘 중 하나만 부족해도 상점에 간다.
    if(((st.party<4 && st.balls<4) || st.potion<=1) && st.money>=300 && !st.indoor && restockCd<=0){
      tr("field:restock",st); const r=await restockBalls();
      restockCd = r?8:20;   // 성공하면 잠깐, 실패하면 오래 쉬어 진행을 막지 않는다
      continue;
    }
    if(restockCd>0)restockCd--;

    // ⚠️ 언더레벨이면 gym에 들어가지 말고 근처 풀숲에서 레벨을 올린다(리더에게 막히는 것 방지).
    //    gym별 목표 레벨(GYM_LV)의 -1까지. 이동 중 야생 조우는 메인 루프의 전투 로직이 처리한다.
    //    grind는 목표 근처에서 도므로(반경8) 그 지역 야생과 싸워 자연히 목표 레벨대로 수렴한다.
    if(!st.indoor && st.badges<GYM_LV.length && st.partyMaxLv < GYM_LV[st.badges]-1){   // 4뱃지 뒤엔 안 걸린다(위 주석)
      tr("field:grind",st); const g=await grindStep(); if(g){ stats.grinds++; continue; }
    }

    // ⚠️ 실내에서는 목표 트래커가 숨겨져 있어 봇이 방향키 폴백으로 제자리를 맴돈다.
    //    (실측: 센터 안에서 7분간 갇혀 간호사에게만 계속 부딪혔다.) 실내면 먼저 출구로 나간다.
    // 체육관·리그는 **목표 자체**다 — 나가면 안 되고 위로 걸어 트레이너·관장에게 부딪혀야 한다.
    // ⚠️ 단, **이미 깬 체육관이면 나간다.** gymN의 관장 타일은 숫자 N이고 뱃지 키도 "1"~"4"라
    //    같은 문자다. 이 조건이 없으면 뱃지를 딴 뒤에도 격파한 관장 앞에서 영영 위로 걸었다
    //    (실측: 25분 중 22분을 gym1 관장 앞에서 낭비, 다음 목표로 못 넘어감).
    const gymCleared = /^gym(\d)$/.test(st.indoor||"") && st.badgeKeys.includes(RegExp.$1);
    if(st.indoor && (/^gym/.test(st.indoor)||st.indoor==="league") && !gymCleared){
      tr("field:gymUp",st);
      for(let i=0;i<3;i++){ await p.keyboard.press("ArrowUp"); await p.waitForTimeout(260);
        const q=await p.evaluate(()=>({inB:!!window.SG.G().inBattle,dlg:document.getElementById("dialogBox").classList.contains("show")}));
        if(q.inB||q.dlg)break; }
      continue;
    }
    if(st.indoor){ tr("field:exit",st);
      const walked=await p.evaluate(()=>{ const S=window.SG,F=S.flow,G=S.G();
        const I=F.INTERIORS[G.indoor]; if(!I)return false;
        // 출구 타일 바로 위 칸까지 걸어간 뒤 아래로 밟고 나간다
        const ax=I.exitX, ay=I.exitY-1;
        if(G.pos.x===ax&&G.pos.y===ay)return "at";
        return F.walkTo(ax,ay)?"walk":false; });
      if(walked==="walk"){ for(let i=0;i<40;i++){ await p.waitForTimeout(200);
          const q=await p.evaluate(()=>{ const S=window.SG,G=S.G(); const I=S.flow.INTERIORS[G.indoor]||{};
            return {done:!G.indoor||(G.pos.x===I.exitX&&G.pos.y===I.exitY-1), inB:!!G.inBattle}; });
          if(q.done||q.inB)break; } }
      for(let i=0;i<4;i++){ await p.keyboard.press("ArrowDown"); await p.waitForTimeout(240);
        const out=await p.evaluate(()=>!window.SG.G().indoor); if(out)break; }
      await p.waitForTimeout(300); continue;
    }

    // ⚠️ 목표(체육관·센터·리그 입구)는 **비보행 문**이다. 봇은 문 앞 칸에 도착한 뒤
    //    목표만 계속 재탭하며 제자리를 맴돌았다(walkTo가 0=이미 도착을 반환하므로 아무 일도 안 난다).
    //    → 목표가 바로 옆이면 그 방향으로 **부딪혀 들어간다**(실제 플레이어가 하는 동작).
    // ⚠️ **건물 문은 정면(아래)에서만 열린다**(`DOOR_TILES="+EHGUSX"`, 포켓몬식 정면 출입구).
    //    옆이나 위에서 부딪히면 "🚪 입구는 건물 정면(아래쪽)에 있다"만 뜨고 영영 안 들어가진다.
    //    목표 트래커는 **인접한 아무 보행칸**으로 데려다주므로 옆에 서는 일이 흔하다 →
    //    실측: `field:bump`가 800ms씩 181회 반복하며 60분 판이 체육관2 앞에서 죽었다.
    //    → 정면 칸이 보행 가능하면 **거기로 먼저 걸어가서** 위로 부딪힌다.
    //    (자연 입구 D·V·M·J·O·z·^·!·W는 문이 아니라 방향을 안 가리고, 정면 칸이 없는 곳도 있어 옛 방식 유지.)
    const bump=await p.evaluate(()=>{ const S=window.SG,F=S.flow,G=S.G();
      const g=F.currentGoal&&F.currentGoal(); if(!g||g.x==null||G.indoor)return null;
      if(F.walkable(g.x,g.y))return null;
      const front={x:g.x,y:g.y+1};
      if(F.walkable(front.x,front.y)){
        if(G.pos.x===front.x&&G.pos.y===front.y)return "ArrowUp";
        return F.walkTo(front.x,front.y)?"walk":null; }
      const dx=g.x-G.pos.x, dy=g.y-G.pos.y;
      if(Math.abs(dx)+Math.abs(dy)!==1)return null;
      return dy<0?"ArrowUp":dy>0?"ArrowDown":dx<0?"ArrowLeft":"ArrowRight"; });
    if(bump==="walk"){ tr("field:front",st);   // 정면 칸까지 이동(도착·전투·정지 중 먼저 오는 것까지)
      let last=null,still=0;
      for(let i=0;i<40;i++){ await p.waitForTimeout(200);
        const q=await p.evaluate(()=>{ const G=window.SG.G(); return {k:G.pos.x+","+G.pos.y, inB:!!G.inBattle}; });
        if(q.inB)break;
        if(q.k===last){ if(++still>=3)break; } else { still=0; last=q.k; } }
      continue; }
    if(bump){ const bk=st.pos.x+","+st.pos.y+"/"+bump;
      if(bk===bumpKey)bumpCnt++; else { bumpKey=bk; bumpCnt=0; }
      // ⚠️ 같은 자리에서 부딪히기만 하는 상황(정면 칸을 NPC가 막는 등)이 남을 수 있다 →
      //    일정 횟수를 넘기면 목표 탭으로 폴백해 판이 통째로 헛도는 걸 막는다.
      if(bumpCnt<=12){ tr("field:bump",st); await p.keyboard.press(bump); await p.waitForTimeout(800); continue; } }

    tr("field:goal",st);
    const tapped=await p.evaluate(()=>{ const el=document.getElementById("goalTrack");
      if(el&&el.offsetParent){ el.click(); return true; } return false; });
    if(tapped){ let last=null,still=0;
      for(let i=0;i<50;i++){ await p.waitForTimeout(210);
        const q=await p.evaluate(()=>{ const G=window.SG.G();
          return {k:(G.indoor||"")+G.pos.x+","+G.pos.y, inB:!!G.inBattle, dlg:document.getElementById("dialogBox").classList.contains("show")}; });
        if(q.inB||q.dlg)break;
        if(q.k===last){ if(++still>=3)break; } else { still=0; last=q.k; } } }
    else { for(let i=0;i<4;i++){ await p.keyboard.press("ArrowUp"); await p.waitForTimeout(90); } }

    // 진행 정체 감지(같은 칸에서 계속 맴돌면 기록)
    const key=(st.indoor||"")+st.pos.x+","+st.pos.y+"/"+st.badges;
    if(key===lastKey)stuck++; else { stuck=0; lastKey=key; }

    // 브라우저가 죽을 때 대비해 최신 상태를 스냅샷으로 들고 있는다(evaluate가 끊기면 이 값으로 보고)
    finSnapshot={ badges:st.badges, lord:st.lord, champion:st.champion, lv:[st.lv], party:st.party,
      caught:0, money:st.money, pos:st.pos, indoor:st.indoor, defeated:0 };

    const el=Math.floor((Date.now()-t0)/60000);
    if(el>lastStep){ lastStep=el;
      stats.samples.push({t:el, lv:st.lv, party:st.party, battles:stats.battles, badges:st.badges, pos:`${st.indoor||""}${st.pos.x},${st.pos.y}`}); }
   } catch(e){ if(isBrowserDeath(e)){ browserDead=true; break; } throw e; }
  }
  if(browserDead)console.log("  ⚠️ 브라우저가 환경 압박으로 종료됨 — 그때까지의 진행을 보고한다(게임 버그 아님)");

  const fin=browserDead? (finSnapshot||{badges:0,lord:false,champion:false,lv:[],party:0,caught:0,money:0,pos:{x:0,y:0},indoor:null,defeated:0})
    : await p.evaluate(()=>{ const G=window.SG.G();
    return { badges:(G.badges||[]).length, lord:!!G.badge, champion:!!G.champion,
      lv:(G.party||[]).map(m=>m&&m.level), party:(G.party||[]).length,
      caught:G.caught.size, money:G.money, pos:G.pos, indoor:G.indoor,
      defeated:[...G.defeated].length }; });

  const mins=((Date.now()-t0)/60000).toFixed(1);
  console.log(`\n  [전수 플레이스루] ${mins}분 · 예산 ${BUDGET}초`);
  console.log(`     전투 ${stats.battles}회 (야생 ${stats.wild} · 트레이너 ${stats.trainer}) · 포획 ${stats.caught} · 회복약 ${stats.potions} · 센터회복 ${stats.heals} · 상점보충 ${stats.restocks} · 그라인딩 ${stats.grinds} · 도주 ${stats.runs} · 전멸(추정) ${stats.faints}`);
  console.log(`     도달: 뱃지 ${fin.badges}/4 · 숲의 군주 ${fin.lord?"격파":"미격파"} · 챔피언 ${fin.champion?"등극":"미등극"}`);
  console.log(`     파티 ${fin.party}마리 Lv[${fin.lv.join(",")}] · 도감 ${fin.caught} · 소지금 ${fin.money} · 위치 ${fin.indoor||"필드"} ${fin.pos.x},${fin.pos.y}`);
  if(stats.samples.length){ console.log("     진행 곡선(1분 간격):");
    stats.samples.forEach(s=>console.log(`       ${String(s.t).padStart(2)}분  Lv${String(s.lv).padStart(2)} · 파티${s.party} · 전투 ${String(s.battles).padStart(3)}회 · 뱃지 ${s.badges} · ${s.pos}`)); }
  if(!stats.milestones.length)console.log("     ⚠️ 마일스톤 0건 — 예산 안에서 첫 뱃지도 못 얻었다");
  if(stuckOverlays.length){ console.log("     ❌ 닫히지 않는 오버레이(게임 결함):"); stuckOverlays.forEach(n=>console.log("        · "+n)); process.exitCode=1; }

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  ok(stats.battles>0, `전투가 실제로 발생했다 (${stats.battles}회)`);
  if(!browserDead)ok(fin.party>=1, `파티가 유지된다 (${fin.party}마리)`);   // 브라우저가 죽으면 파티 스냅샷이 부정확할 수 있어 생략
  console.log(`  ℹ️  도달 지점은 예산·확률에 좌우된다 — 게이트가 아니라 관측값이다`);
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 전수 플레이스루 종료");
  try{ await b.close(); }catch(e){}
  process.exit(process.exitCode||0);
})();
