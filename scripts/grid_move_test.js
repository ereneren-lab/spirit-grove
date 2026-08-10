// 그리드 이동(opt-in) 회귀 테스트: 부드럽게=한 번 눌러 이동, 그리드=새 방향 탭은 회전만·홀드는 걷기.
const { chromium } = require("playwright"); const path=require("path");
async function enterGym(p, grid){
  await p.evaluate((g)=>{ const SG=window.SG; SG.CONFIG.gridMove=g;
    /* ⚠️ 좌표를 박지 않는다 — GYM_AT에서 gym1을 찾아 그 문 앞에 선다.
       (8,44)로 박아뒀다가 체육관을 옮기자 위로 눌러도 실내로 안 들어가
       "부드럽게: 1칸 이동 (43→43)"으로 빨개졌다. 이동 로직은 멀쩡했다. */
    const k=Object.keys(SG.GYM_AT||{}).find(k=>SG.GYM_AT[k]==="gym1")||"8,43";
    const [gx,gy]=k.split(",").map(Number);
    const G=SG.freshState(); G.party=[SG.makeMon("emberwolf",30)]; G.pos={x:gx,y:gy+1};
    G.defeated=new Set(["7","a","1"]); SG.setG(G); SG.flow.enterMap(true); },grid);
  await p.keyboard.press("ArrowUp"); await p.waitForTimeout(600);   // 체육관 입장 → (4,9)
}
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  await enterGym(p,false);
  const s0=await p.evaluate(()=>window.SG.G().pos.y);
  await p.keyboard.press("ArrowUp"); await p.waitForTimeout(450);
  const s1=await p.evaluate(()=>window.SG.G().pos.y);
  ok(s0-s1===1, `부드럽게: 위 한 번 → 1칸 이동 (${s0}→${s1})`);

  await enterGym(p,true);
  const g0=await p.evaluate(()=>window.SG.G().pos.x);
  await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(350);   // 새 방향 탭 → 회전만
  const g1=await p.evaluate(()=>window.SG.G().pos.x);
  ok(g0===g1, `그리드: 새 방향 한 번 탭 → 이동 없음(회전만) (x ${g0}→${g1})`);
  const y1=await p.evaluate(()=>window.SG.G().pos.y);
  await p.keyboard.down("ArrowUp"); await p.waitForTimeout(1000); await p.keyboard.up("ArrowUp");
  const y2=await p.evaluate(()=>window.SG.G().pos.y);
  ok(y1-y2>=3, `그리드: 홀드 → 여러 칸 걷기 (y ${y1}→${y2}, ${y1-y2}칸)`);
  ok(errs.length===0, "런타임 에러 0");

  console.log(process.exitCode?"\n❌ 실패":"\n🎉 그리드 이동 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
