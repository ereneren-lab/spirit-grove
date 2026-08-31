// 회귀 — 출신지(집) 실내 인물이 대사 정체(할아버지·소장·상인·숲의 목소리)에 맞는 스프라이트로 그려진다.
//  유저 제보: "할아버지"인데 젊은 현자(NPC_SPR.lore)로 그려졌다 → 집마다 다른 절차적 스프라이트를 쓴다.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 430, height: 760 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.resolve(process.argv[2])); await p.waitForTimeout(600);
  const ok = (c, m) => { console.log((c ? "  ✅ " : "  ❌ ") + m); if (!c) process.exitCode = 1; };

  const r = await p.evaluate(() => {
    const S = window.SG; const H = S.HOME_NPC_SPR, L = S.NPC_SPR && S.NPC_SPR.lore;
    const out = { has: !!H, keys: H ? Object.keys(H) : [] };
    if (!H) return out;
    // 네 집 전부 정의 · 전부 lore(회청색 현자)와 다른 개별 스프라이트
    out.four = ["home_rio", "home_mina", "home_tori", "home_el"].every(k => !!H[k]);
    out.notLore = out.keys.every(k => H[k] !== L);
    // 절차적 경로(_char)가 그리도록 sheet 필드가 없다(시트가 있으면 색·수염이 안 먹힌다)
    out.procedural = out.keys.every(k => !H[k].sheet);
    // 할아버지 = 노인 단서(수염) + 밀짚모자 + 밝은(백발) 머리색
    const g = H.home_tori;
    out.grandpaBeard = g.extra === "beard";
    out.grandpaStraw = g.hat === "straw";
    out.grandpaWhiteHair = /^#[cdefCDEF]/.test(g.hair || "");   // 밝은 계열(백발)
    // 숲의 목소리(노현자)도 수염, 상인은 등짐+두건, 소장은 모자 없음
    out.elBeard = H.home_el.extra === "beard";
    out.minaMerchant = H.home_mina.extra === "bag" && H.home_mina.hat === "bandana";
    // 넷이 서로 구별되는 실루엣 키(hat+extra+build 조합)를 가진다
    const sig = out.keys.map(k => (H[k].build || "adult") + "|" + (H[k].hat || "none") + "|" + (H[k].extra || "none"));
    out.distinct = new Set(sig).size === out.keys.length;
    return out;
  });

  ok(r.has, "HOME_NPC_SPR 정의·노출");
  ok(r.four, `네 집(rio·mina·tori·el) 전부 인물 스프라이트 정의 (${r.keys.join(",")})`);
  ok(r.notLore, "전부 기존 lore(회청색 현자) 스프라이트와 다름");
  ok(r.procedural, "절차적 경로로 그린다(sheet 필드 없음 → 색·수염·모자 반영)");
  ok(r.grandpaBeard && r.grandpaStraw && r.grandpaWhiteHair, "할아버지 = 수염 + 밀짚모자 + 백발(노인 단서)");
  ok(r.elBeard, "숲의 목소리 = 수염(노현자)");
  ok(r.minaMerchant, "동행 상인 = 등짐 + 두건");
  ok(r.distinct, "네 인물이 서로 다른 실루엣(모자·소지품·체형)");
  ok(errs.length === 0, "런타임 에러 0" + (errs.length ? ": " + errs.slice(0, 3).join(" / ") : ""));
  console.log(process.exitCode ? "\n❌ 실패" : "\n🎉 집 NPC 나이대·역할 스프라이트 통과");
  await b.close(); process.exit(process.exitCode || 0);
})();
