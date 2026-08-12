// 타입 상성표(얼음·독·땅 포함 10종) 회귀 테스트: 주요 상성 + 10x10 완전성(NaN/undefined 없음).
const { chromium } = require("playwright"); const path=require("path");
(async()=>{ const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:760}});
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file://"+path.resolve(process.argv[2])); await p.waitForTimeout(800);
  const ok=(c,m)=>{ console.log((c?"  ✅ ":"  ❌ ")+m); if(!c)process.exitCode=1; };

  const r=await p.evaluate(()=>{ const S=window.SG; S.setG(S.freshState());
    const eff=(atk,def)=>{ const A={atk:50,spa:50,def:50,spDef:50,hp:100,maxHp:100,stages:{atk:0,def:0,spd:0},status:null};
      const D={type:def,type2:null,def:50,spDef:50,hp:100,maxHp:100,stages:{atk:0,def:0,spd:0}};
      return S.damage(A,D,{type:atk,power:50,acc:100,pp:10}).eff; };
    const types=["fire","water","grass","elec","normal","flying","rock","ice","poison","ground","dragon"];
    let bad=0; for(const a of types)for(const d of types){ const e=eff(a,d); if(typeof e!=="number"||isNaN(e))bad++; }
    return { bad, iceGrass:eff("ice","grass"), iceFire:eff("ice","fire"), iceFly:eff("ice","flying"),
      groundElec:eff("ground","elec"), groundFly:eff("ground","flying"), groundPoison:eff("ground","poison"),
      poisonGrass:eff("poison","grass"), poisonGround:eff("poison","ground"),
      fireIce:eff("fire","ice"), elecGround:eff("elec","ground"), rockIce:eff("rock","ice"),
      iceDragon:eff("ice","dragon"), fireDragon:eff("fire","dragon"), dragonDragon:eff("dragon","dragon"), normalDragon:eff("normal","dragon") }; });

  ok(r.bad===0, `상성표 10x10 완전성(NaN 없음, 불량 ${r.bad})`);
  ok(r.iceGrass===2, `얼음→풀 2배 (${r.iceGrass})`);
  ok(r.iceFire===0.5, `얼음→불 0.5배 (${r.iceFire})`);
  ok(r.iceFly===2, `얼음→비행 2배 (${r.iceFly})`);
  ok(r.groundElec===2, `땅→전기 2배 (${r.groundElec})`);
  ok(r.groundFly===0, `땅→비행 무효(0) (${r.groundFly})`);
  ok(r.groundPoison===2, `땅→독 2배 (${r.groundPoison})`);
  ok(r.poisonGrass===2, `독→풀 2배 (${r.poisonGrass})`);
  ok(r.poisonGround===0.5, `독→땅 0.5배 (${r.poisonGround})`);
  ok(r.fireIce===2, `불→얼음 2배 (${r.fireIce})`);
  ok(r.elecGround===0, `전기→땅 무효(0) (${r.elecGround})`);
  ok(r.rockIce===2, `바위→얼음 2배 (${r.rockIce})`);
  ok(r.iceDragon===2, `얼음→용 2배 (${r.iceDragon})`);
  ok(r.fireDragon===0.5, `불→용 0.5배 (${r.fireDragon})`);
  ok(r.dragonDragon===2, `용→용 2배 (${r.dragonDragon})`);
  ok(r.normalDragon===1, `노말→용 1배 (${r.normalDragon})`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 타입 상성표 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
