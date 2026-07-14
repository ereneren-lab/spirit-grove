#!/usr/bin/env bash
# 정령의 숲 빌드 검증. 사용: bash scripts/verify.sh [파일]
# 대상은 빌드 결과물(dist). 소스는 src/index.html + assets/ 이다.
set -e
F="${1:-dist/spirit_grove_3d.html}"
echo "검증 대상: $F"

# 1) three.js 무결성 (반드시 1)
TJS=$(grep -c "^<script>/\*\*" "$F" || true)
echo "three.js 마커: $TJS  (기대: 1)"
[ "$TJS" = "1" ] || { echo "❌ three.js 무결성 실패"; exit 1; }

# 2) JS 문법 (2번째 <script> 블록)
OPEN=$(grep -n "^<script>" "$F" | sed -n '2p' | cut -d: -f1)
CLOSE=$(grep -n "^</script>" "$F" | sed -n '2p' | cut -d: -f1)
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
echo "🎉 모든 검증 통과"
