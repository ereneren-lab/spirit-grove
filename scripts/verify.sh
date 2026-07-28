#!/usr/bin/env bash
# 정령의 숲 빌드 검증. 사용: bash scripts/verify.sh [파일]
# 대상은 빌드 결과물(dist). 소스는 src/index.html + assets/ 이다.
set -e
F="${1:-dist/spirit_grove_3d.html}"
echo "검증 대상: $F"

# 1) 죽은 의존성이 되살아나지 않았는지 (three.js / Map3D / BUNDLED_ART 는 제거됨)
DEAD=$(grep -c "THREE\.\|Map3D\|BUNDLED_ART" "$F" || true)
echo "죽은 의존성 참조: $DEAD  (기대: 0)"
[ "$DEAD" = "0" ] || { echo "❌ 제거된 의존성이 다시 들어왔다"; exit 1; }

# 1b) 홈 화면 앱(iOS PWA) 설정이 살아 있는지 — 빌드가 head를 안 건드리지만 회귀 방지
for tag in "apple-mobile-web-app-capable" "apple-touch-icon" "apple-mobile-web-app-title" 'display-mode:standalone' "viewport-fit=cover"; do
  grep -q "$tag" "$F" || { echo "❌ PWA 설정 누락: $tag (홈 화면 앱 실행이 깨진다)"; exit 1; }
done
echo "✅ 홈 화면 앱(PWA) 설정 OK"

# 2) JS 문법 (게임 <script> 블록)
OPEN=$(grep -n "^<script>" "$F" | sed -n '1p' | cut -d: -f1)
CLOSE=$(grep -n "^</script>" "$F" | sed -n '1p' | cut -d: -f1)
sed -n "$((OPEN+1)),$((CLOSE-1))p" "$F" > /tmp/_game.js
node --check /tmp/_game.js && echo "✅ JS 문법 OK"

# 3) PAINT_ART / DEX 대조
python3 - "$F" <<'PY'
import re, sys
txt = open(sys.argv[1], encoding="utf-8").read()
dex = list(dict.fromkeys(re.findall(r'\{id:"([a-zA-Z_]+)",name:', txt)))
pa, started = [], False
for ln in txt.split("\n"):
    if ln.strip() == "const PAINT_ART={": started = True; continue
    if started:
        m = re.match(r'^([a-zA-Z_]+):"data:image', ln)
        if m: pa.append(m.group(1))
        elif ln.startswith("};"): break
notcov = [d for d in dex if d not in pa]
dups = [k for k in set(pa) if pa.count(k) > 1]
print(f"DEX={len(dex)}  PAINT_ART={len(pa)}  안덮인={notcov or '없음'}  중복={dups or '없음'}")
assert not notcov and not dups, "❌ PAINT_ART/DEX 불일치"
print("✅ PAINT_ART/DEX 일치")
PY

# 4) 순수 규칙 단위 테스트 (브라우저 불필요 — 밀리초 단위, 가장 먼저 돈다)
#    src/rules/*.js 를 node vm에서 그대로 평가한다. 브라우저 테스트가 무거워 구간을 나눠 돌리는
#    환경에서도 이건 항상 전부 돈다 → 규칙 회귀는 여기서 즉시 걸린다.
node scripts/rules_unit_test.js || exit 1

# 5) 스모크 + 코치 테스트 (jsdom 필요 — 없으면 건너뜀)
if node -e "require.resolve('jsdom')" 2>/dev/null; then
# ⚠️ playwright 테스트를 연달아 45개 돌리면 브라우저 기동이 겹쳐
#    "Target page, context or browser has been closed"가 매번 다른 테스트에서 터진다.
#    각 실행 사이에 짧은 텀을 둬서 이전 브라우저가 정리될 시간을 준다.
# 브라우저 테스트가 많아 메모리 압박이 큰 환경에선 한 번에 다 못 돈다.
# PW_FROM/PW_TO로 구간을 나눠 실행할 수 있다:  PW_FROM=1 PW_TO=20 bash scripts/verify.sh
PW_I=0
PW_FROM="${PW_FROM:-1}"; PW_TO="${PW_TO:-9999}"
pw() {
  PW_I=$((PW_I+1))
  if [ "$PW_I" -lt "$PW_FROM" ] || [ "$PW_I" -gt "$PW_TO" ]; then return 0; fi
  node "scripts/$1" "$F" "${@:2}" || exit 1
  sleep 0.8
}

  pw smoke.js
  pw coach_test.js
  pw goal_test.js
  pw altar_test.js
  pw curve_test.js
  pw dialog_test.js
else
  echo "⏭️  스모크 테스트 건너뜀 (npm install jsdom 하면 실행됨)"
fi

# 6) 오디오 테스트 (Playwright 필요 — jsdom엔 Web Audio가 없어 실제 브라우저로만 검증 가능)
if node -e "require.resolve('playwright')" 2>/dev/null; then
  pw audio_test.js
  pw lowhp_flow_test.js
  pw gym_test.js
  pw indoor_move_test.js
  pw grid_move_test.js
  pw dexnew_test.js
  pw shop_test.js
  pw evo_test.js
  pw battle_bag_test.js
  pw npc_roam_test.js
  pw grassfx_test.js
  pw indoor_encounter_test.js
  pw dead_content_test.js
  pw battle_layout_test.js
  pw pc_card_test.js
  pw topbar_fit_test.js
  pw mobile_controls_test.js
  pw hero_facing_test.js
  pw title_music_test.js
  pw victory_music_test.js
  pw catch_music_test.js
  pw defeat_music_test.js
  pw door_bounce_test.js
  pw bugfix_batch_test.js
  pw duo_battle_test.js
  pw evo_unify_test.js
  pw sendout_test.js
  pw exp_test.js
  pw dialog_type_test.js
  pw battle_nav_test.js
  pw sail_fade_test.js
  pw party_lead_test.js
  pw duo_hit_test.js
  pw catch_identity_test.js
  # type_chart_test.js 는 순수 상성표라 rules_unit_test.js(브라우저 불필요)로 이관됨 → 여기선 제거.
  pw newtypes_test.js
  pw gym_ice_test.js
  pw ability_weather_test.js
  pw marsh_test.js
  pw stage_rank_test.js
  pw center_test.js
  pw foe_switch_test.js
  pw dex_flavor_test.js
  pw battlefx_daynight_test.js
  pw hof_pp_crit_test.js
  pw switchmoves_confusion_test.js
  pw movefx_variety_test.js
  pw ability_expand_test.js
  pw region_content_test.js
  pw indoor_quest_test.js
  pw blackout_test.js
  pw bugfix_round2_test.js
  pw bugfix_round3_test.js
  pw palette_source_test.js
  pw bugfix_round4_test.js
  pw protect_test.js
  pw helditems_test.js
  pw weather_test.js
  pw exchange_test.js
  pw escape_test.js
  pw content_pack_test.js
  pw catch_test.js
  pw stat_items_test.js
  pw battlemoves_test.js
  pw fishing_test.js
  pw twoturn_test.js
  pw movecontrol_test.js
  pw skyridge_test.js
  pw tower_test.js
  pw faint_modal_test.js
  pw item_target_test.js
else
  echo "⏭️  오디오 테스트 건너뜀 (npm install playwright 하면 실행됨)"
fi
echo "🎉 모든 검증 통과"

echo ""
echo "ℹ️  실플레이 검증(도달성·플레이스루·몽키 퍼즈)은 무거워서 분리돼 있다:  bash scripts/playtest.sh"
