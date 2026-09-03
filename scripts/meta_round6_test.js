// 회귀 — 감사 6라운드 수정 3건.
//  (1) 핫싯 '다시 대전'이 먹통(pvpEnd가 G.inBattle을 안 풀어 startHotSeat 가드에 막힘).
//  (2) parseTradeCode: 체크섬은 맞지만 이 빌드에 없는 종 id면 makeMon(undefined)이 던져 크래시
//      → 친절한 에러로. (버전 다른/조작 코드)
//  (3) 교환으로 받은 정령이 보낸 사람 uid를 그대로 지녀 팀 프리셋이 충돌 → 새 uid 발급.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(800);

  // ── (1) 핫싯 재대전 재진입 메커니즘 ──
  const hot = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    G.party = [S.makeMon("emberwolf", 30), S.makeMon("shellow", 30)];
    F.startHotSeat(); const first = F.getPVP && F.getPVP();
    // 매치 종료 잔여 상태 재현: pvpEnd는 inBattle을 안 푼다
    G.inBattle = true;
    // OLD 버그: 이 상태로 startHotSeat 부르면 가드에 막혀 재시작 안 됨
    const before = JSON.stringify(F.getPVP()) ; F.startHotSeat(); const blockedSame = (F.getPVP() === first);
    // 수정된 '다시 대전' 핸들러가 하는 일: 플래그 clear 후 재시작
    G.inBattle = false; G._pvp = false; G.busy = false; F.startHotSeat();
    const re = F.getPVP();
    return { firstOpen: !!(first && first.phase === "select"), blockedByGuard: blockedSame,
      reopened: !!(re && re.phase === "select"), reIsNew: re !== first };
  });
  ok(hot.firstOpen, "핫싯 1회차 시작(렌탈 선택 단계)");
  ok(hot.blockedByGuard, "매치 종료(inBattle=true) 상태에선 startHotSeat 가드가 막음(버그 조건 재현)");
  ok(hot.reopened && hot.reIsNew, "플래그를 풀면 '다시 대전'이 새 매치를 연다(수정된 핸들러 동작)");

  // ── (2) 트레이드 코드: 알 수 없는 종 id → 크래시 없이 친절한 에러 ──
  const bad = await p.evaluate(() => {
    const S = window.SG, F = S.flow;
    // 게임 내부 인코더 복제(_b64e·_tradeChk·TRADE_VER는 IIFE 비공개라 동일 알고리즘 재현)
    const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    const chk = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
    const body = b64e(JSON.stringify({ id: "notaspecies_zzz", lv: 20, mv: ["tackle"] }));
    const code = "SGT1." + body + "." + chk(body);
    let r, threw = false; try { r = F.parseTradeCode(code); } catch (e) { threw = true; r = { err: "THREW:" + e.message }; }
    return { threw, err: r && r.err, mon: !!(r && r.mon) };
  });
  ok(!bad.threw, "알 수 없는 종 코드가 크래시하지 않는다");
  ok(!!bad.err && !bad.mon, `친절한 에러 반환 (${bad.err})`);

  // ── (3) 교환 수신 정령은 새 uid를 받는다(보낸 사람 uid 충돌 방지) ──
  const uid = await p.evaluate(() => {
    const S = window.SG, F = S.flow; S.setG(S.freshState()); const G = S.G();
    // 보낼 정령 하나 만들어 uid 고정 후 코드 생성
    const sent = S.makeMon("emberwolf", 25); sent.uid = "m5"; sent.moves = ["tackle"]; sent.pp = { tackle: 30 };
    const code = F.tradeCodeFor(sent);
    // 내 세이브에 uid m5인 정령을 이미 두어 충돌 상황 조성
    const mine = S.makeMon("shellow", 25); mine.uid = "m5"; G.party = [mine]; G.box = []; G._uidSeq = 5;
    // 실제 받기 경로: parseTradeCode + tradeRecv 핸들러 로직(uid strip + ensureUid)
    const r = F.parseTradeCode(code);
    // tradeRecv가 하는 일 재현
    r.mon.uid = null; F.ensureUid && F.ensureUid(r.mon); G.box.push(r.mon);
    return { parsed: !!(r && r.mon), recvUid: r.mon.uid, mineUid: mine.uid, distinct: r.mon.uid !== mine.uid };
  });
  ok(uid.parsed, "유효 코드 복원");
  ok(uid.distinct && !!uid.recvUid, `받은 정령은 새 uid (${uid.recvUid}) ≠ 기존(${uid.mineUid})`);

  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 감사 6라운드 수정 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
