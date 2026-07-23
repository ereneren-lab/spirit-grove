#!/usr/bin/env python3
"""
빌드: src/index.html + assets/ -> dist/spirit_grove_3d.html (인라인 번들 한 파일)

  python3 scripts/build.py

아트를 갈아끼우려면 assets/art/**/*.webp 를 교체하고 다시 빌드하면 된다.
크리처를 추가하려면 .webp 를 넣고 assets/manifest.json 의 "paint" 배열에 id 를 추가.
"""
import base64, json, os

ROOT = os.path.dirname(os.path.abspath(__file__)) + "/.."
A = lambda *p: os.path.join(ROOT, *p)

man = json.load(open(A("assets/manifest.json")))
html = open(A("src/index.html"), encoding="utf-8").read()


def b64(path):
    return base64.b64encode(open(A(path), "rb").read()).decode()


def url(path):
    return "data:image/webp;base64," + b64(path)


# PAINT_ART: 한 줄 1종, 마지막 줄만 콤마 없음 (verify.sh 가 이 형식을 파싱한다)
ids = man["paint"]
paint = "\n".join(
    f'{cid}:"{url("assets/art/creatures/" + cid + ".webp")}"' + ("," if i < len(ids) - 1 else "")
    for i, cid in enumerate(ids)
)

hero = "const HERO_ART={%s};" % ",".join(
    f'"{k}":"{url("assets/art/hero/" + k + ".webp")}"' for k in man["hero"])
back = "const HERO_ART_BACK={%s};" % ",".join(
    f'"{k}":"{url("assets/art/hero_back/" + k + ".webp")}"' for k in man["hero_back"])

# 순수 규칙(src/rules/*.js)을 마커 자리에 그대로 끼워 넣는다.
# 브라우저는 이 인라인 결과를, node 단위 테스트(scripts/rules_env.js)는 같은 파일들을
# 같은 순서로 이어붙여 평가한다 — 즉 양쪽이 문자 그대로 동일한 코드를 돈다.
def rules(name):
    return open(A("src/rules/%s.js" % name), encoding="utf-8").read()

repl = {
    "//@@RULES_UTIL@@": rules("util"),
    "//@@RULES_TYPES@@": rules("tables"),
    "//@@RULES_MOVES@@": rules("moves"),
    "//@@RULES_DEX@@": rules("dex"),
    "//@@RULES_BATTLE@@": rules("battle"),
    "//@@HERO_ART@@": hero,
    "//@@HERO_ART_BACK@@": back,
    "//@@PAINT_ART@@": paint,
}
for marker, body in repl.items():
    if marker not in html:
        raise SystemExit(f"❌ 마커 없음: {marker}")
    html = html.replace(marker, body, 1)

os.makedirs(A("dist"), exist_ok=True)
out = A("dist/spirit_grove_3d.html")
open(out, "w", encoding="utf-8").write(html)
# GitHub Pages 배포용: 저장소 루트에 index.html도 같이 내보낸다(dist와 동일 내용).
# → Pages 루트 URL(user.github.io/spirit-grove/)로 게임이 바로 열린다. 빌드마다 자동 동기화.
open(A("index.html"), "w", encoding="utf-8").write(html)
print(f"✅ 빌드 완료: dist/spirit_grove_3d.html + index.html  ({os.path.getsize(out)//1024}KB, 크리처 {len(ids)}종)")
