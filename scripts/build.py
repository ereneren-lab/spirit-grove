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

repl = {
    "//@@THREE@@": open(A("assets/vendor/three.min.js"), encoding="utf-8").read(),
    "//@@BUNDLED_ART@@": open(A("assets/vendor/bundled_art.js"), encoding="utf-8").read(),
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
print(f"✅ 빌드 완료: dist/spirit_grove_3d.html  ({os.path.getsize(out)//1024}KB, 크리처 {len(ids)}종)")
