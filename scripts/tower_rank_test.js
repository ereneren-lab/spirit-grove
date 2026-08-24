// H5-A 회귀 — 배틀타워 랭크·세트룰·시즌·기록.
// ⚠️ 세트룰의 핵심 위험: 렌탈 팀으로 도전 중 내 진짜 파티를 백업했다가 종료 시 정확히 복원해야 한다.
//    (복원 실패 = 내 정령이 렌탈로 덮여 사라짐.) 이 테스트가 그 왕복을 못박는다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  // ── 랭크 파생 ──
  const rk=await p.evaluate(()=>{ const F=window.SG.flow;
    return { r0:F.towerRank(0), r7:F.towerRank(7), r21:F.towerRank(21), r49:F.towerRank(49), n:F.TOWER_RANKS.length }; });
  ok(rk.r0.ko==="무급" && rk.r0.next===7, "0연승=무급, 다음 7");
  ok(rk.r7.ko==="브론즈", "7연승=브론즈");
  ok(rk.r21.ko==="골드", "21연승=골드");
  ok(rk.r49.ko==="마스터" && rk.r49.next===null, "49연승=마스터(최고)");

  // ── 세트룰: 파티 백업/복원 + 모드별 최고기록 ──
  const set=await p.evaluate(async()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.champion=true;
    const myTeam=[S.makeMon("foxfire",20),S.makeMon("dewdrop",18)]; G.party=myTeam.slice(); G.box=[];
    const rental=[S.makeMon("blazelion",50),S.makeMon("krakentide",50),S.makeMon("lunarmoth",50)];
    F.towerBegin("set",rental);
    const duringPartyIsRental=G.party.length===3 && G.party[0].id==="blazelion";
    const backupHeld=(G._partyBackup||[]).length===2;
    // 세트룰에서 연승 → towerBestSet 갱신, towerBest는 그대로
    G.towerStreak=9; await F.towerWin();   // streak→10, best 갱신
    const bestSet=G.towerBestSet, bestParty=G.towerBest;
    // 종료 → 파티 복원 + 기록 적립
    G.towerStreak=10; await F.endTowerRun(); await new Promise(r=>setTimeout(r,50));
    const restored=G.party.length===2 && G.party[0].id==="foxfire";
    const recorded=(G.towerRecords||[]).some(r=>r.mode==="set"&&r.streak===10);
    const season=F.towerSeasonBest();
    return { duringPartyIsRental, backupHeld, bestSet, bestParty, restored, recorded, season }; });
  ok(set.duringPartyIsRental, "세트룰 중엔 파티가 렌탈 3마리로 교체된다");
  ok(set.backupHeld, "내 파티가 백업된다");
  ok(set.bestSet>=10 && set.bestParty===0, "세트룰 최고기록만 갱신(파티 최고는 별도)");
  ok(set.restored, "⭐종료 후 내 진짜 파티가 정확히 복원된다(정령 손실 X)");
  ok(set.recorded, "기록(리더보드)에 세트룰 결과가 남는다");
  ok(set.season>=10, "이번 달 시즌 최고기록이 갱신된다");

  // ── 기록 정렬·상한 ──
  const rec=await p.evaluate(()=>{ const S=window.SG,F=S.flow; S.setG(S.freshState()); const G=S.G();
    G.party=[S.makeMon("foxfire",20)];
    for(const s of [3,15,7,22,1,9,30,5,12,18]){ G.towerStreak=s; F.towerRecordRun(s,"party"); }
    return { n:G.towerRecords.length, top:G.towerRecords[0].streak, sorted:G.towerRecords.every((r,i,a)=>i===0||a[i-1].streak>=r.streak) }; });
  ok(rec.n<=8 && rec.top===30, `기록은 상위 8개·내림차순 (top ${rec.top})`);
  ok(rec.sorted, "기록이 연승 내림차순 정렬");

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 배틀타워 랭크/세트룰 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
