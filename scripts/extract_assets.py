#!/usr/bin/env python3
"""
1회성 추출: 인라인 번들(spirit_grove_3d.html) -> 편집용 소스(src/) + 에셋(assets/).

  python3 scripts/extract_assets.py

- three.js / BUNDLED_ART: 편집 대상이 아니므로 원문 그대로 vendor 파일로.
- PAINT_ART / HERO_ART / HERO_ART_BACK: base64를 디코딩해 실제 .webp 파일로.
- src/index.html 에는 주입 마커만 남는다. 되돌리려면 scripts/build.py.
"""
import base64, json, os, re, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "spirit_grove_3d.html"
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/.."
A = lambda *p: os.path.join(ROOT, *p)

lines = open(A(SRC), encoding="utf-8").read().split("\n")


def find(pred, what):
    hits = [i for i, l in enumerate(lines) if pred(l)]
    if len(hits) != 1:
        raise SystemExit(f"❌ 앵커 '{what}' 를 {len(hits)}개 찾음 (1개여야 함)")
    return hits[0]


# ---- 앵커 (내용이 아니라 구조로 찾는다) ----
i_three = find(lambda l: l.startswith("!function(t,e)"), "three.js")
i_bund = find(lambda l: l.startswith("const BUNDLED_ART={"), "BUNDLED_ART")
i_hero = find(lambda l: l.startswith("const HERO_ART={"), "HERO_ART")
i_back = find(lambda l: l.startswith("const HERO_ART_BACK={"), "HERO_ART_BACK")
i_paint = find(lambda l: l.strip() == "const PAINT_ART={", "PAINT_ART 시작")
i_pend = next(i for i in range(i_paint + 1, len(lines)) if lines[i].startswith("};"))

for d in ("assets/vendor", "assets/art/creatures", "assets/art/hero",
          "assets/art/hero_back", "src", "dist"):
    os.makedirs(A(d), exist_ok=True)

manifest = {}

# ---- vendor: 원문 그대로 (바이트 동일성 보장) ----
open(A("assets/vendor/three.min.js"), "w", encoding="utf-8").write(lines[i_three])
open(A("assets/vendor/bundled_art.js"), "w", encoding="utf-8").write(lines[i_bund])

# ---- 크리처 아트: base64 -> .webp ----
paint_ids = []
for ln in lines[i_paint + 1:i_pend]:
    m = re.match(r'^([a-zA-Z_]+):"data:image/webp;base64,([^"]+)",?$', ln)
    if not m:
        raise SystemExit(f"❌ PAINT_ART 줄 형식 불일치: {ln[:60]}")
    cid, b64 = m.group(1), m.group(2)
    open(A("assets/art/creatures", cid + ".webp"), "wb").write(base64.b64decode(b64))
    paint_ids.append(cid)
manifest["paint"] = paint_ids

# ---- 주인공 아트: base64 -> .webp ----
for const, idx, sub in ((lines[i_hero], i_hero, "hero"), (lines[i_back], i_back, "hero_back")):
    keys = []
    for k, b64 in re.findall(r'"(\d)":"data:image/webp;base64,([^"]+)"', const):
        open(A("assets/art", sub, k + ".webp"), "wb").write(base64.b64decode(b64))
        keys.append(k)
    if not keys:
        raise SystemExit(f"❌ {sub} 아트를 추출하지 못함")
    manifest[sub] = keys

json.dump(manifest, open(A("assets/manifest.json"), "w"), indent=1)

# ---- src/index.html: 마커만 남긴다 ----
out = lines[:]
out[i_paint + 1:i_pend] = ["//@@PAINT_ART@@"]
out[i_back] = "//@@HERO_ART_BACK@@"
out[i_hero] = "//@@HERO_ART@@"
out[i_bund] = "//@@BUNDLED_ART@@"
out[i_three] = "//@@THREE@@"
open(A("src/index.html"), "w", encoding="utf-8").write("\n".join(out))

kb = lambda p: os.path.getsize(A(p)) // 1024
print(f"✅ 추출 완료")
print(f"   크리처 {len(paint_ids)}종 · 주인공 {len(manifest['hero'])}+{len(manifest['hero_back'])}장")
print(f"   src/index.html  {kb('src/index.html')}KB   (원본 {kb(SRC)}KB)")
print(f"   vendor: three.min.js {kb('assets/vendor/three.min.js')}KB · "
      f"bundled_art.js {kb('assets/vendor/bundled_art.js')}KB")
