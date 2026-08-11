#!/usr/bin/env bash
# 한 줄 배포: 빌드 검증 → main push → Actions가 서버에서 빌드해 GitHub Pages로 배포.
# 사용:  bash scripts/deploy.sh
#
# ⚠️ 이 환경은 git-over-HTTPS push가 막혀 SSH 원격만 됨(origin = git@github.com:...).
#
# 📌 2026-08-11에 구조를 바꿨다 — **원격 main = 전체 이력**이다.
#    예전엔 매번 orphan 스냅샷 1개로 force-push해 덮었다. 그건 `.git`이 479MB이던 시절의 잔재고,
#    `git gc`로 180MB가 된 뒤엔 이유가 사라졌다(옛 주석도 "이제 이력 push가 현실적이다"라고 적고 있었다).
#    바꾼 실제 이유는 따로 있다: **유저가 핸드폰 Claude 앱을 이 저장소에 연결한다.**
#    앱은 기본 브랜치(main)를 받는데 그게 이력 없는 스냅샷이면
#      ① 커밋 이력이 안 보이고
#      ② ⚠️ **앱이 main에 커밋해도 다음 배포의 force-push가 통째로 지운다.**
#    그래서 orphan 방식을 버렸다. 되돌리지 말 것.
#
# 📌 Pages는 **브랜치가 아니라 Actions 아티팩트**로 나간다(.github/workflows) —
#    워크플로가 소스에서 `build.py`를 직접 돌린다. 그래서 dist를 밀어올릴 필요가 없다.
set -e
cd "$(dirname "$0")/.."

echo "▶ 1/3 빌드 검증 (서버가 같은 걸 돌린다)"
python3 scripts/build.py >/dev/null
echo "  ✅ 빌드 OK"

echo "▶ 2/3 커밋되지 않은 변경 확인"
if [ -n "$(git status --porcelain)" ]; then
  # ⚠️ 예전 방식은 `git add -A`로 뭐든 삼켜서 배포했다 — 커밋 안 한 실험이 조용히 라이브로 나갔다.
  #    이제 main을 그대로 밀므로, 커밋되지 않은 게 있으면 **배포에 안 들어간다.** 먼저 알린다.
  echo "  ⚠️ 커밋되지 않은 변경이 있다 — 이건 배포에 포함되지 않는다:"
  git status --short | sed 's/^/     /'
  echo "     (계속하려면 커밋하거나, 지금 상태 그대로 배포해도 되면 무시)"
fi

echo "▶ 3/3 GitHub push (SSH)"
git push -q origin main
echo "  ✅ push 완료"

echo ""
echo "🎉 push 완료 — GitHub Actions가 1~2분 뒤 자동 배포한다."
echo "   진행:  gh run watch   ·  https://github.com/ereneren-lab/spirit-grove/actions"
echo "   주소:  https://ereneren-lab.github.io/spirit-grove/"
echo ""
# ⚠️ 큰따옴표 안의 백틱은 **명령 치환으로 실행된다** — 여기서 실제로 겪었다(브랜치 이름이 사라졌다).
echo '📌 history 브랜치는 옛 구조의 백업이다. main이 이제 전체 이력이라 더 밀 필요 없다.'
