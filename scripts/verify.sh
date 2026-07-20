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

# 4) 스모크 + 코치 테스트 (jsdom 필요 — 없으면 건너뜀)
if node -e "require.resolve('jsdom')" 2>/dev/null; then
  node scripts/smoke.js "$F" || exit 1
  node scripts/coach_test.js "$F" || exit 1
  node scripts/goal_test.js "$F" || exit 1
  node scripts/altar_test.js "$F" || exit 1
  node scripts/curve_test.js "$F" || exit 1
  node scripts/movedesc_test.js "$F" || exit 1
  node scripts/dialog_test.js "$F" || exit 1
else
  echo "⏭️  스모크 테스트 건너뜀 (npm install jsdom 하면 실행됨)"
fi

# 5) 오디오 테스트 (Playwright 필요 — jsdom엔 Web Audio가 없어 실제 브라우저로만 검증 가능)
if node -e "require.resolve('playwright')" 2>/dev/null; then
  node scripts/audio_test.js "$F" || exit 1
  node scripts/lowhp_flow_test.js "$F" || exit 1
  node scripts/gym_test.js "$F" || exit 1
  node scripts/indoor_move_test.js "$F" || exit 1
  node scripts/grid_move_test.js "$F" || exit 1
  node scripts/dexnew_test.js "$F" || exit 1
  node scripts/shop_test.js "$F" || exit 1
  node scripts/evo_test.js "$F" || exit 1
  node scripts/battle_bag_test.js "$F" || exit 1
  node scripts/npc_roam_test.js "$F" || exit 1
  node scripts/title_music_test.js "$F" || exit 1
  node scripts/victory_music_test.js "$F" || exit 1
  node scripts/catch_music_test.js "$F" || exit 1
  node scripts/defeat_music_test.js "$F" || exit 1
  node scripts/door_bounce_test.js "$F" || exit 1
  node scripts/bugfix_batch_test.js "$F" || exit 1
  node scripts/duo_battle_test.js "$F" || exit 1
  node scripts/evo_unify_test.js "$F" || exit 1
  node scripts/sendout_test.js "$F" || exit 1
  node scripts/exp_test.js "$F" || exit 1
  node scripts/dialog_type_test.js "$F" || exit 1
  node scripts/battle_nav_test.js "$F" || exit 1
  node scripts/sail_fade_test.js "$F" || exit 1
  node scripts/party_lead_test.js "$F" || exit 1
  node scripts/duo_hit_test.js "$F" || exit 1
  node scripts/catch_identity_test.js "$F" || exit 1
  node scripts/type_chart_test.js "$F" || exit 1
  node scripts/newtypes_test.js "$F" || exit 1
  node scripts/legendary_test.js "$F" || exit 1
  node scripts/gym_ice_test.js "$F" || exit 1
  node scripts/ability_weather_test.js "$F" || exit 1
  node scripts/marsh_test.js "$F" || exit 1
  node scripts/stage_rank_test.js "$F" || exit 1
  node scripts/center_test.js "$F" || exit 1
  node scripts/foe_switch_test.js "$F" || exit 1
  node scripts/dex_flavor_test.js "$F" || exit 1
  node scripts/battlefx_daynight_test.js "$F" || exit 1
  node scripts/hof_pp_crit_test.js "$F" || exit 1
  node scripts/switchmoves_confusion_test.js "$F" || exit 1
else
  echo "⏭️  오디오 테스트 건너뜀 (npm install playwright 하면 실행됨)"
fi
echo "🎉 모든 검증 통과"
