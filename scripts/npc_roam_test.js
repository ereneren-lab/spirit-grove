// 로밍 NPC 부드러운 보간 이동 회귀 테스트.
// - 논리 타일(n.x/n.y)을 강제로 옮기면 렌더 좌표(n.rx/n.ry)가 팝 없이 타일 사이로 보간됐다가 정확히 수렴한다.
// - 로밍(npcRoamTick)이 실제로 NPC 논리 좌표를 움직인다.
// npcRoamTick는 G.busy면 조기 return하므로, G.busy로 로밍을 얼려 보간만 결정적으로 관찰한다.
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };
  const evalP=f=>p.evaluate(f);

  // 오버월드 세팅 + 로밍 얼림. 미나(로밍 NPC)를 화면에 두어 걷는 draw 경로도 태운다.
  await evalP(()=>{ const SG=window.SG; const G=SG.freshState(); G.party=[SG.makeMon("emberwolf",20)];
    G.pos={x:12,y:48}; SG.setG(G); SG.flow.enterMap(true); G.busy=true; });   // busy=로밍 정지
  await p.waitForTimeout(450);   // 렌더가 rx/ry 초기화(rx=x)

  const roamIds=await evalP(()=>window.SG.NPCS.filter(n=>n.lines&&!n.battleKey).map(n=>n.id));
  ok(roamIds.includes("mina"), `로밍 NPC 존재 (${roamIds.length}종: ${roamIds.join(",")})`);

  // 논리 좌표 강제 이동 → 보간 시작
  const before=await evalP(()=>{ const n=window.SG.NPCS.find(z=>z.id==="mina");
    const b={x:n.x,rx:n.rx,ry:n.ry}; n.x=n.x+2; return {b, after:n.x}; });
  ok(Math.abs(before.b.rx-(before.after-2))<0.02, `이동 전 rx==논리x (rx=${before.b.rx})`);

  // 보간 중: rx가 옛 타일과 새 타일 '사이'(팝이면 즉시 after와 같아야 함)
  await p.waitForTimeout(160);
  const mid=await evalP(()=>{ const n=window.SG.NPCS.find(z=>z.id==="mina"); return n.rx; });
  const oldX=before.after-2, newX=before.after;
  ok(mid>oldX+0.05 && mid<newX-0.05, `보간 중: rx가 타일 사이 (${oldX} < ${mid.toFixed(3)} < ${newX}) — 팝 아님`);

  // 수렴: 로밍 얼려 있으니 논리 좌표 고정 → rx가 정확히 수렴
  await p.waitForTimeout(1000);
  const end=await evalP(()=>{ const n=window.SG.NPCS.find(z=>z.id==="mina"); return {rx:n.rx,ry:n.ry,x:n.x,y:n.y}; });
  ok(Math.abs(end.rx-end.x)<0.02 && end.x===newX, `수렴: rx→논리x (rx=${end.rx.toFixed(3)}, x=${end.x})`);

  // 세로 좌표는 안 건드렸으니 그대로 유지(2D 보간 정확성)
  ok(Math.abs(end.ry-before.b.ry)<0.02, `가로만 이동, 세로 rx 유지 (ry=${end.ry.toFixed(3)})`);

  // 로밍 해제 → 실제로 NPC가 돌아다니는지(논리 좌표 변화). 랜덤이라 여러 NPC 합산으로 관측.
  const base=await evalP(()=>{ const G=window.SG.G(); G.busy=false;
    return window.SG.NPCS.filter(n=>n.lines&&!n.battleKey).map(n=>({id:n.id,x:n.x,y:n.y})); });
  await p.waitForTimeout(2600);   // 로밍 간격 820ms → 여러 틱
  const moved=await p.evaluate((base)=>{ const cur=window.SG.NPCS.filter(n=>n.lines&&!n.battleKey);
    let cnt=0; for(const n of cur){ const b=base.find(z=>z.id===n.id); if(b&&(b.x!==n.x||b.y!==n.y))cnt++; } return cnt; }, base);
  ok(moved>=1, `로밍 동작: ${moved}종이 이동함`);

  // 인접 힐끗: 플레이어 옆(좌측)에 미나를 두면 그쪽(left)을 보고 제자리에 멈춘다.
  await evalP(()=>{ const G=window.SG.G(); G.busy=false; G.pos={x:12,y:48};
    const m=window.SG.NPCS.find(z=>z.id==="mina"); m.x=13; m.y=48; m.dir="up"; });   // 일부러 엉뚱한 방향
  await p.waitForTimeout(1100);   // 로밍 틱(820ms) 최소 1회
  const gl=await evalP(()=>{ const m=window.SG.NPCS.find(z=>z.id==="mina"); return {dir:m.dir,x:m.x,y:m.y}; });
  ok(gl.dir==="left", `인접 힐끗: 플레이어(좌) 향해 회전 (dir=${gl.dir})`);
  ok(gl.x===13&&gl.y===48, `인접 시 제자리 유지(안 돌아다님) (${gl.x},${gl.y})`);

  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,2).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 NPC 로밍/보간 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
