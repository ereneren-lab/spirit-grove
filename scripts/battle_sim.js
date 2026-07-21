// 밸런스 실측용 전투 시뮬레이터 — balance_test.js와 league_test.js가 **공유**한다.
//
// 왜 공유하는가
//   예전엔 두 하네스가 거의 같은 battle()/applyMove()를 각자 복사해 갖고 있었다.
//   그래서 한쪽만 고치면 두 측정이 서로 다른 규칙으로 돌아가는데도 티가 안 났다.
//   (실제로 상태이상을 넣으려 했을 때 두 곳에 같은 로직을 또 써야 하는 상황이었다.)
//
// 무엇을 모델링하는가
//   피해·명중·다단히트·회복·능력 랭크 + **상태이상**(이번에 추가):
//     - 상태 부여: 타입 면역(불=화상 등) · 특성 면역(불면/면역/수의베일) · 맹독(badly)
//     - 행동 불가: 잠듦(1~3턴) · 냉동(매턴 20% 해동) · 마비(25% 못 움직임)
//     - 잔류 피해: 독 1/8 · 맹독 n/16 누적 · 화상 1/16
//     - 풀죽음(flinch) · 혼란(자해) · 씨뿌리기(seed)
//   화상의 물리 반감과 마비의 속도 반감은 게임의 damage()/effSpd()가 이미 처리한다.
//
// ⚠️ 일부러 뺀 것 (해석할 때 감안할 것)
//   장막(reflect/lightscreen) · 설치기(hazard) · 날씨 — 전부 필드 상태(G)가 필요한데
//   시뮬레이터엔 G가 없다. 이것들이 빠졌으므로 이 수치는 "장막·설치·날씨 없는 전투"다.
//
// 사용: const SIM=require("./battle_sim.js"); await p.addScriptTag({content:SIM});
//       그러면 페이지에 window.__SIM = {battle, pickMove} 가 생긴다.
module.exports = `
window.__SIM = (function(){
  const S = window.SG, F = S.flow;

  // PP가 남고 실제로 존재하는 기술을 고른다. 게임의 적 AI(foeChooseMove)를 그대로 쓴다
  // = "평범하게 두는 플레이어" 기준. 숙련자는 이보다 잘한다.
  function pickMove(a, d){
    let k = S.foeChooseMove(a, d);
    if(!S.MOVES[k] || (a.pp[k]||0) <= 0){
      const usable = (a.moves||[]).filter(x => S.MOVES[x] && (a.pp[x]||0) > 0);
      k = usable.length ? usable[0] : "struggle";
    }
    return k;
  }

  // 상태 부여. 게임의 applyStatus는 DOM(renderStages/setMsg)을 건드리므로 여기서 규칙만 재현한다.
  // ⚠️ 면역 규칙은 게임과 같은 출처(S.STATUS_TYPE_IMMUNE)를 쓴다 — 손으로 복사하면 또 어긋난다.
  function trySetStatus(m, st, badly){
    if(F.statusBlockReason(m, st)) return false;   // 면역 판정은 게임의 규칙 계층과 같은 출처
    F.setStatusFields(m, st, badly);
    return true;
  }

  // 행동 가능한가. 잠듦/냉동/마비가 턴을 통째로 먹는 게 상태이상의 핵심 가치라 반드시 모델링한다.
  function canAct(m){
    if(m.status === "slp"){
      if((m._slp||0) > 0){ m._slp--; return false; }
      m.status = null;                                          // 깨어남
    }
    if(m.status === "frz"){
      if(Math.random() < 0.2) m.status = null;                   // 20% 해동
      else return false;
    }
    if(m._flinch){ m._flinch = 0; return false; }
    if(m.status === "par" && Math.random() < 0.25) return false; // 25% 못 움직임
    if((m._confuse||0) > 0){
      m._confuse--;
      if(Math.random() < 0.33){                                  // 자해하고 턴 소모
        m.hp = Math.max(0, m.hp - F.confusionSelfHit(m));
        return false;
      }
    }
    if(m._attract && Math.random() < 0.5) return false;          // 헤롱헤롱: 50% 못 움직임
    return true;
  }

  function applyMove(a, d, k){
    let mv = S.MOVES[k];
    if(!mv) return;
    let _resurf = false;
    if(a._charging){ k = a._charging; mv = S.MOVES[k]; a._charging = null; a._invuln = false; _resurf = true; }   // 2턴기 재부상
    if(!_resurf && a.pp[k] != null) a.pp[k] = Math.max(0, a.pp[k]-1);
    if(k !== "protect") a._protectStreak = 0;                    // 방어 아닌 기술 → 연속 카운터 리셋
    if(!a._choiceLock && k!=="struggle" && !_resurf && (a.held==="choiceband"||a.held==="choicescarf")) a._choiceLock=k;   // 구애 고정
    if(mv.acc < 100 && Math.random()*100 > mv.acc) return;      // 빗나감 — 부가효과도 없다
    if(!_resurf && mv.eff && mv.eff.charge){ a._charging = k; if(mv.eff.invuln) a._invuln = true; return; }   // 2턴기 1턴째 충전

    // 방어(protect): 이 턴 상대를 노리는 기술은 막힌다. 자기/필드 대상은 통과.
    if(mv.eff && mv.eff.protect){
      const s = a._protectStreak || 0;
      if(Math.random() < 1/Math.pow(3, s)){ a._protect = true; a._protectStreak = s+1; }
      else a._protectStreak = 0;
      return;
    }
    if(d._protect && (mv.power > 0 || (mv.eff && (mv.eff.status || mv.eff.seed || mv.eff.confuse)))) return;
    if(d._invuln && mv.power > 0) return;                        // 상대가 날기 중(반무적) → 빗나감

    if(mv.power > 0){
      const hits = mv.multi ? F.multiHits(mv.multi) : 1; let dealt=0;
      for(let h=0; h<hits && d.hp>0; h++){
        let dmg = S.damage(a, d, mv).dmg;
        if(d.held==="focussash" && d.hp===d.maxHp && dmg>=d.hp){ dmg=d.hp-1; d.held=null; }   // 기합의띠
        dmg = Math.min(dmg, d.hp); d.hp = Math.max(0, d.hp - dmg); dealt += dmg;
      }
      if(a.held==="lifeorb" && dealt>0) a.hp = Math.max(0, a.hp - Math.max(1, Math.floor(a.maxHp/10)));   // 생명의구슬 반동
      if(mv.eff && mv.eff.selfKO) a.hp = 0;                       // 자폭: 피해 후 자신도 기절(상대 생사 무관)
      if(d.hp <= 0) return;
      const e = mv.eff;
      if(e && e.status && Math.random() < (e.chance||0)) trySetStatus(d, e.status, e.badly);
      if(e && e.flinch && Math.random() < e.flinch) d._flinch = 1;
      if(e && e.confuse && Math.random() < (e.chance||1)) d._confuse = 1 + Math.floor(Math.random()*4);
      if(e && e.trap && !(d._trapped>0)) d._trapped = 4 + Math.floor(Math.random()*2);   // 묶기: 4~5턴
      return;
    }

    // 변화기
    const e = mv.eff || {};
    if(mv.heal){ a.hp = Math.min(a.maxHp, a.hp + Math.floor(a.maxHp * mv.heal)); return; }
    if(e.status){ if(Math.random() < (e.chance||1)) trySetStatus(d, e.status, e.badly); return; }
    if(e.confuse){ d._confuse = 1 + Math.floor(Math.random()*4); return; }
    if(e.attract){ if(d.gender && a.gender && d.gender!=="N" && a.gender!=="N" && d.gender!==a.gender) d._attract = true; return; }   // 헤롱헤롱: 이성만
    if(e.seed){ d._seeded = true; return; }
    if(e.stat){
      const t = e.target === "self" ? a : d;
      t.stages = t.stages || S.newStages();
      if(e.stat in t.stages) t.stages[e.stat] = Math.max(-6, Math.min(6, (t.stages[e.stat]||0) + e.stage));
    }
    // screen/hazard/weather는 필드 상태가 필요해 모델링하지 않는다(위 주석 참조)
  }

  // 턴 끝 잔류 피해. 맹독은 누적(n/16), 보통 독은 1/8, 화상은 1/16.
  function residual(m, foe){
    if(m.hp <= 0) return;
    if(m.status === "psn"){
      const bad = m._tox > 0;
      const dmg = bad ? Math.max(1, Math.floor(m.maxHp * Math.min(15, m._tox) / 16))
                      : Math.max(1, Math.floor(m.maxHp / 8));
      if(bad) m._tox = Math.min(15, m._tox + 1);
      m.hp = Math.max(0, m.hp - dmg);
    } else if(m.status === "brn"){
      m.hp = Math.max(0, m.hp - Math.max(1, Math.floor(m.maxHp / 16)));
    }
    if(m._seeded && m.hp > 0 && foe && foe.hp > 0){
      const d = Math.max(1, Math.floor(m.maxHp / 8));
      m.hp = Math.max(0, m.hp - d);
      foe.hp = Math.min(foe.maxHp, foe.hp + d);
    }
    if(m._trapped > 0 && m.hp > 0){ m.hp = Math.max(0, m.hp - Math.max(1, Math.floor(m.maxHp / 8))); m._trapped--; }   // 조이기 잔뎀
  }

  // 교체하면 랭크·혼란·씨앗은 사라지고 맹독 카운터는 1로 리셋(본가 규칙, 게임과 동일).
  function onSwitchOut(m){
    if(!m) return;
    m.stages = S.newStages(); m._confuse = 0; m._seeded = false; m._flinch = 0;
    m._protect = false; m._protectStreak = 0; m._choiceLock = null; m._attract = false; m._trapped = 0; m._charging = null; m._invuln = false;
    if(m._tox) m._tox = 1;
  }

  // 한 전투. mine은 상태를 이어받는다(HP·PP·상태이상이 누적) — 리그 연속전을 재려면 필수.
  function battle(mine, foeTeam, potions){
    const foes = foeTeam.map(([id, lv]) => { const m = S.makeMon(id, lv); m.hp = m.maxHp; return m; });
    const alive = arr => arr.some(m => m.hp > 0);
    let mi = mine.findIndex(m => m.hp > 0), fi = 0, t = 0, used = 0;

    while(alive(mine) && alive(foes) && t < 400){
      t++;
      while(mine[mi] && mine[mi].hp <= 0) mi++;
      if(mi >= mine.length) mi = mine.findIndex(m => m.hp > 0);
      while(foes[fi] && foes[fi].hp <= 0) fi++;
      if(mi < 0 || !mine[mi] || !foes[fi]) break;
      const me = mine[mi], fo = foes[fi];

      // 위험하면 회복약(리그에서도 아이템은 쓸 수 있다). 회복은 턴을 소모한다.
      if(potions && potions.n > 0 && me.hp / me.maxHp < 0.3){
        me.hp = Math.min(me.maxHp, me.hp + 130); potions.n--; used++;
        if(canAct(fo)) applyMove(fo, me, pickMove(fo, me));
        residual(me, fo); residual(fo, me);
        continue;
      }

      const mk = pickMove(me, fo), fk = pickMove(fo, me);
      const mPri = (S.MOVES[mk] && S.MOVES[mk].pri) || 0, fPri = (S.MOVES[fk] && S.MOVES[fk].pri) || 0;
      // 우선도 먼저, 같으면 실효 속도(마비 반감이 여기서 반영된다)
      const meFirst = mPri !== fPri ? mPri > fPri : S.effSpd(me) >= S.effSpd(fo);
      const order = meFirst ? [[me, fo, mk], [fo, me, fk]] : [[fo, me, fk], [me, fo, mk]];

      for(const [a, d, k] of order){
        if(a.hp <= 0 || d.hp <= 0) continue;
        if(!canAct(a)) continue;
        applyMove(a, d, k);
      }
      me._protect = false; fo._protect = false;                 // 방어는 이번 턴만
      residual(me, fo); residual(fo, me);
    }
    return { win: alive(mine) && !alive(foes), potionsUsed: used };
  }

  return { battle, pickMove, trySetStatus, canAct, residual, onSwitchOut, applyMove };
})();
`;
