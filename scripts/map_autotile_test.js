// 맵 오토타일 회귀 (유저: "맵이 너무 타일처럼 되어있으니까 아쉬워. 포켓몬처럼 만들자").
//
// 예전 문제: 키큰 풀 T가 **타일마다 인셋된 둥근 사각형**이라 붙어 있어도 하나하나 떨어져 보였고,
// 물·길은 꽉 찬 사각형이라 계단식 직각 경계가 그대로 드러났으며, 지역 경계에서 바닥색이 한 줄로 뚝 끊겼다.
//
// 지금: 이웃이 같은 종류면 그 변을 이어 붙이고 **바깥으로 드러난 모서리만** 둥글게 깎는다(`_autoPath`),
// 지역 팔레트는 경계 앞뒤 4칸에 걸쳐 섞는다(`_gcol`).
//
// ⚠️ 검증 방식: 픽셀 비교 대신 **드로우 콜을 가로채 모서리 깎기(arcTo) 횟수를 센다**
//    (grassfx_test에서 쓴 것과 같은 기법). 사방이 같은 종류면 arcTo=0(각지게 이어짐),
//    고립되면 arcTo=4(사방이 둥글다)가 되어야 한다.
const { chromium } = require("playwright"); const path=require("path");

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)fail=1; };
  process.on("unhandledRejection",async e=>{ console.log("❌ "+e); await b.close(); process.exit(1); });
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(900);
  await p.evaluate(()=>{ const S=window.SG,G=S.freshState(); G.party=[S.makeMon("foxfire",8)];
    G.pos={x:9,y:44}; G.repel=999; S.setG(G); S.flow.enterMap(true); });
  await p.waitForTimeout(700);

  /* 드로우 콜을 세는 가짜 ctx — 실제 캔버스 대신 넘겨 _tile을 직접 부른다 */
  const probe=await p.evaluate(()=>{
    const F=window.SG.Field, tileAt=window.SG.flow.tileAt;
    const mk=()=>{ const n={arcTo:0}; const noop=()=>{};
      const ctx=new Proxy({},{ get:(t,k)=>{
        if(k in n)return ()=>{ n[k]++; };
        if(k==="canvas")return {width:800,height:800};
        if(k==="measureText")return ()=>({width:10});
        return typeof k==="string"?noop:undefined; }, set:()=>true });
      return {ctx,n}; };
    // 모든 T 타일을 훑어 "같은 종류 이웃 수 → 모서리 깎기(arcTo) 횟수"를 모은다
    const buckets={};
    for(let y=1;y<49;y++)for(let x=1;x<24;x++){
      if(tileAt(x,y)!=="T")continue;
      const nb=[[0,-1],[0,1],[-1,0],[1,0]].filter(([dx,dy])=>tileAt(x+dx,y+dy)==="T").length;
      const {ctx,n}=mk(); F._tile(ctx,"T",0,0,32,x,y,1);
      (buckets[nb]=buckets[nb]||[]).push(n.arcTo);
    }
    const stat={}; Object.keys(buckets).forEach(k=>{ const a=buckets[k];
      stat[k]={n:a.length, min:Math.min(...a), max:Math.max(...a)}; });
    return { stat,
      gcol:{ far: F._gcol(44), near: F._gcol(41), near2: F._gcol(40), above: F._gcol(38) } };
  });

  console.log("\n[1] 키큰 풀 오토타일 — 이웃이 많을수록 모서리를 덜 깎는다");
  console.log("     이웃수별 arcTo:", JSON.stringify(probe.stat));
  const st=probe.stat;
  ok(!!st["0"], "고립된 풀숲 표본이 있다");
  ok(st["0"] && st["0"].min===4, `고립되면 네 모서리를 다 깎는다 (arcTo=${st["0"]&&st["0"].min})`);
  const joined=Object.keys(st).filter(k=>Number(k)>=1);
  ok(joined.length>0, `이어진 풀숲 표본이 있다 (이웃 ${joined.join(",")}칸)`);
  ok(joined.every(k=>st[k].max<4), `이어진 쪽은 그 변을 안 깎는다 (최대 ${Math.max(...joined.map(k=>st[k].max))} < 4)`);
  const most=Math.max(...joined.map(Number));
  ok(st[String(most)].max <= (st["0"].min-most>0?st["0"].min-most:st["0"].min),
     `이웃 ${most}칸이면 모서리가 확실히 줄어든다 (arcTo≤${st[String(most)].max})`);

  console.log("\n[2] 물·길도 같은 규칙");
  const wp=await p.evaluate(()=>{
    const tileAt=window.SG.flow.tileAt, F=window.SG.Field;
    const mk=()=>{ const n={arcTo:0}; const noop=()=>{};
      const ctx=new Proxy({},{ get:(t,k)=>{ if(k in n)return ()=>{n[k]++;};
        if(k==="canvas")return {width:800,height:800};
        if(k==="measureText")return ()=>({width:10}); return typeof k==="string"?noop:undefined; }, set:()=>true });
      return {ctx,n}; };
    const find=(ch,pred)=>{ for(let y=1;y<49;y++)for(let x=1;x<24;x++) if(tileAt(x,y)===ch&&pred(x,y))return {x,y}; return null; };
    const same=ch=>(x,y)=>[[0,-1],[0,1],[-1,0],[1,0]].filter(([dx,dy])=>tileAt(x+dx,y+dy)===ch).length>=3;
    const edge=ch=>(x,y)=>!(tileAt(x,y-1)===ch)&&!(tileAt(x-1,y)===ch);
    const out={};
    for(const ch of ["~","."]){
      const i=find(ch,same(ch)), e=find(ch,edge(ch));
      const r1=i?(()=>{const {ctx,n}=mk(); F._tile(ctx,ch,0,0,32,i.x,i.y,1); return n.arcTo;})():null;
      const r2=e?(()=>{const {ctx,n}=mk(); F._tile(ctx,ch,0,0,32,e.x,e.y,1); return n.arcTo;})():null;
      out[ch]={inner:r1,edge:r2,i,e};
    }
    return out; });
  for(const ch of ["~","."]){
    const nm=ch==="~"?"물":"길"; const r=wp[ch];
    if(r.inner!==null&&r.edge!==null){
      ok(r.inner<=1, `${nm}: 안쪽은 모서리를 거의 안 깎는다 (arcTo=${r.inner})`);
      ok(r.edge>0,   `${nm}: 바깥 모서리는 깎는다 (arcTo=${r.edge})`);
    } else console.log(`  ℹ️ ${nm}: 표본 부족 — 건너뜀`);
  }

  console.log("\n[3] 지역 경계 색 블렌드");
  const g=probe.gcol;
  ok(JSON.stringify(g.far)!==JSON.stringify(g.above), "지역이 다르면 바닥색도 다르다");
  const between=(v,a,c)=>[0,1,2].every(i=>v[i]>=Math.min(a[i],c[i])-1 && v[i]<=Math.max(a[i],c[i])+1);
  ok(between(g.near,g.above,g.far)&&between(g.near2,g.above,g.far),
     `경계 근처 색이 두 지역 사이 값이다 (${JSON.stringify(g.above)} → ${JSON.stringify(g.near2)} → ${JSON.stringify(g.near)} → ${JSON.stringify(g.far)})`);
  ok(JSON.stringify(g.near)!==JSON.stringify(g.near2), "경계에서 한 줄로 끊기지 않고 단계적으로 바뀐다");

  ok(errs.length===0, `런타임 에러 0 (${errs.length}${errs.length?": "+errs[0]:""})`);
  console.log(fail?"\n❌ 실패":"\n🎉 맵 오토타일 통과");
  await b.close(); process.exit(fail);
})();
