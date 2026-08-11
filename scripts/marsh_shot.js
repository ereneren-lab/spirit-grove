// 늪지 내부를 직접 띄워 캡처(시각 확인용, 회귀 아님).
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  await p.evaluate(()=>{ const S=window.SG, F=S.flow; const g=S.freshState(); g.party=[S.makeMon("swampfrog",22)]; S.setG(g); S.CONFIG.reduceMotion=true; F.enterMap(true); F.enterInterior(F.INTERIORS.marsh); });
  await p.waitForTimeout(700);
  await p.screenshot({path:(process.argv[3]||"/tmp")+"/marsh_interior.png"});
  // 오버월드 진입 타일 J 근처도 한 컷
  await p.evaluate(()=>{ const S=window.SG, F=S.flow; F.enterMap(true); let jx=-1,jy=-1; for(let y=0;y<50&&jx<0;y++)for(let x=0;x<25;x++){ if(F.tileAt(x,y)==="J"){jx=x;jy=y;break;} } S.G().pos={x:jx,y:jy+1}; S.Field.placeImmediate&&S.Field.placeImmediate(); });
  await p.waitForTimeout(600);
  await p.screenshot({path:(process.argv[3]||"/tmp")+"/marsh_entrance.png"});
  console.log("shot done"); await b.close(); })();
