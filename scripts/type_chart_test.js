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
    const types=["fire","water","grass","elec","normal","flying","rock","ice","poison","ground","dragon","bug","fight","psychic","fairy","ghost","dark","steel"];
    let bad=0; for(const a of types)for(const d of types){ const e=eff(a,d); if(typeof e!=="number"||isNaN(e))bad++; }
    return { bad, iceGrass:eff("ice","grass"), iceFire:eff("ice","fire"), iceFly:eff("ice","flying"),
      groundElec:eff("ground","elec"), groundFly:eff("ground","flying"), groundPoison:eff("ground","poison"),
      poisonGrass:eff("poison","grass"), poisonGround:eff("poison","ground"),
      fireIce:eff("fire","ice"), elecGround:eff("elec","ground"), rockIce:eff("rock","ice"),
      iceDragon:eff("ice","dragon"), fireDragon:eff("fire","dragon"), dragonDragon:eff("dragon","dragon"), normalDragon:eff("normal","dragon"),
      bugGrass:eff("bug","grass"), fireBug:eff("fire","bug"), flyBug:eff("flying","bug"), bugFire:eff("bug","fire"),
      fightNormal:eff("fight","normal"), fightRock:eff("fight","rock"), fightIce:eff("fight","ice"),
      fightFlying:eff("fight","flying"), fightBug:eff("fight","bug"), flyFight:eff("flying","fight"), rockFight:eff("rock","fight"),
      psyFight:eff("psychic","fight"), psyPoison:eff("psychic","poison"), bugPsy:eff("bug","psychic"),
      fightPsy:eff("fight","psychic"), psyPsy:eff("psychic","psychic"),
      fairyDragon:eff("fairy","dragon"), fairyFight:eff("fairy","fight"), fairyFire:eff("fairy","fire"),
      dragonFairy:eff("dragon","fairy"), poisonFairy:eff("poison","fairy"),
      ghostPsy:eff("ghost","psychic"), ghostGhost:eff("ghost","ghost"), ghostNormal:eff("ghost","normal"),
      normalGhost:eff("normal","ghost"), fightGhost:eff("fight","ghost"),
      darkPsy:eff("dark","psychic"), darkGhost:eff("dark","ghost"), darkFairy:eff("dark","fairy"),
      psyDark:eff("psychic","dark"), fightDark:eff("fight","dark"), bugDark:eff("bug","dark"),
      steelRock:eff("steel","rock"), steelFairy:eff("steel","fairy"), steelFire:eff("steel","fire"),
      poisonSteel:eff("poison","steel"), fireSteel:eff("fire","steel"), fightSteel:eff("fight","steel"),
      grassSteel:eff("grass","steel") }; });

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
  ok(r.bugGrass===2, `벌레→풀 2배 (${r.bugGrass})`);
  ok(r.fireBug===2, `불→벌레 2배 (${r.fireBug})`);
  ok(r.flyBug===2, `비행→벌레 2배 (${r.flyBug})`);
  ok(r.bugFire===0.5, `벌레→불 0.5배 (${r.bugFire})`);
  ok(r.fightNormal===2, `격투→노말 2배 (${r.fightNormal})`);
  ok(r.fightRock===2 && r.fightIce===2, `격투→바위·얼음 2배 (${r.fightRock}/${r.fightIce})`);
  ok(r.fightFlying===0.5 && r.fightBug===0.5, `격투→비행·벌레 0.5배 (${r.fightFlying}/${r.fightBug})`);
  ok(r.flyFight===2, `비행→격투 2배 (${r.flyFight})`);
  ok(r.rockFight===0.5, `바위→격투 0.5배 (${r.rockFight})`);
  ok(r.psyFight===2 && r.psyPoison===2, `에스퍼→격투·독 2배 (${r.psyFight}/${r.psyPoison})`);
  ok(r.bugPsy===2, `벌레→에스퍼 2배 (${r.bugPsy})`);
  ok(r.fightPsy===0.5, `격투→에스퍼 0.5배 (${r.fightPsy})`);
  ok(r.psyPsy===0.5, `에스퍼→에스퍼 0.5배 (${r.psyPsy})`);
  ok(r.fairyDragon===2 && r.fairyFight===2, `페어리→용·격투 2배 (${r.fairyDragon}/${r.fairyFight})`);
  ok(r.fairyFire===0.5, `페어리→불 0.5배 (${r.fairyFire})`);
  ok(r.dragonFairy===0, `용→페어리 무효(0) (${r.dragonFairy})`);
  ok(r.poisonFairy===2, `독→페어리 2배 (${r.poisonFairy})`);
  ok(r.ghostPsy===2 && r.ghostGhost===2, `고스트→에스퍼·고스트 2배 (${r.ghostPsy}/${r.ghostGhost})`);
  ok(r.ghostNormal===0, `고스트→노말 무효(0) (${r.ghostNormal})`);
  ok(r.normalGhost===0, `노말→고스트 무효(0) (${r.normalGhost})`);
  ok(r.fightGhost===0, `격투→고스트 무효(0) (${r.fightGhost})`);
  ok(r.darkPsy===2 && r.darkGhost===2, `악→에스퍼·고스트 2배 (${r.darkPsy}/${r.darkGhost})`);
  ok(r.darkFairy===0.5, `악→페어리 0.5배 (${r.darkFairy})`);
  ok(r.psyDark===0, `에스퍼→악 무효(0) (${r.psyDark})`);
  ok(r.fightDark===2 && r.bugDark===2, `격투·벌레→악 2배 (${r.fightDark}/${r.bugDark})`);
  ok(r.steelRock===2 && r.steelFairy===2, `강철→바위·페어리 2배 (${r.steelRock}/${r.steelFairy})`);
  ok(r.steelFire===0.5, `강철→불 0.5배 (${r.steelFire})`);
  ok(r.poisonSteel===0, `독→강철 무효(0) (${r.poisonSteel})`);
  ok(r.fireSteel===2 && r.fightSteel===2, `불·격투→강철 2배 (${r.fireSteel}/${r.fightSteel})`);
  ok(r.grassSteel===0.5, `풀→강철 0.5배 (${r.grassSteel})`);
  ok(errs.length===0, "런타임 에러 0"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  console.log(process.exitCode?"\n❌ 실패":"\n🎉 타입 상성표 통과");
  await b.close(); process.exit(process.exitCode||0);
})();
