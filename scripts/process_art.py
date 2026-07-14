#!/usr/bin/env python3
"""
정령의 숲 아트 파이프라인.
배경제거(GrabCut) → 정렬/리사이즈 → assets/art/**.webp 저장.

사용 예:
  # 크리처 (중앙정렬) → assets/art/creatures/<id>.webp
  python3 scripts/process_art.py creature art_inbox/foxfire.png=foxfire

  # 주인공 정면 (발끝 하단정렬) → assets/art/hero/<0-3>.webp
  python3 scripts/process_art.py hero art_inbox/rio.png=0

  # 주인공 뒷모습 → assets/art/hero_back/<0-3>.webp
  python3 scripts/process_art.py hero_back art_inbox/rio_back.png=0

저장 후 `python3 scripts/build.py` 로 dist 번들에 반영, `bash scripts/verify.sh` 로 검증.
새 크리처 id 는 assets/manifest.json 의 "paint" 배열에도 추가해야 번들에 들어간다.

의존성: pip install opencv-python-headless numpy Pillow
한 이미지에 캐릭터 2명이면 미리 좌/우로 잘라서 각각 넣을 것.
"""
import sys, os, json
import cv2, numpy as np
from PIL import Image

R = 420
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/.."
A = lambda *p: os.path.join(ROOT, *p)
OUTDIR = {"creature": "assets/art/creatures", "hero": "assets/art/hero",
          "hero_back": "assets/art/hero_back"}


def cutout_rgba(path):
    img0 = cv2.imread(path)
    if img0 is None:
        raise SystemExit(f"❌ 이미지를 읽지 못함: {path}")
    img = cv2.resize(img0, (R, R), interpolation=cv2.INTER_AREA)
    mask = np.zeros((R, R), np.uint8)
    rect = (int(R*0.05), int(R*0.05), int(R*0.90), int(R*0.90))
    bgd = np.zeros((1, 65), np.float64); fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(img, mask, rect, bgd, fgd, 6, cv2.GC_INIT_WITH_RECT)
    m = np.where((mask == 2) | (mask == 0), 0, 255).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN,  cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        m = np.where(lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])), 255, 0).astype(np.uint8)
    m = cv2.GaussianBlur(m, (3, 3), 0)
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA); rgba[:, :, 3] = m
    return cv2.cvtColor(rgba, cv2.COLOR_BGRA2RGBA)


def to_center(rgba, size=360):
    return Image.fromarray(rgba).resize((size, size), Image.LANCZOS)


def to_bottom_anchor(rgba, size=360):
    im = Image.fromarray(rgba); a = np.array(im)[:, :, 3]
    ys, xs = np.where(a > 16)
    if len(ys) == 0:
        return im.resize((size, size), Image.LANCZOS)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    crop = im.crop((x0, y0, x1+1, y1+1)); cw, ch = crop.size
    scale = (size*0.917) / ch
    if cw*scale > size*0.955:
        scale = (size*0.955) / cw
    nw, nh = max(1, int(cw*scale)), max(1, int(ch*scale))
    crop = crop.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(crop, ((size-nw)//2, int(size*0.989)-nh), crop)
    return canvas


def main():
    if len(sys.argv) < 3 or sys.argv[1] not in OUTDIR:
        print(__doc__); raise SystemExit(1)
    mode = sys.argv[1]
    jobs = [a.split("=", 1) for a in sys.argv[2:]]
    outdir = A(OUTDIR[mode]); os.makedirs(outdir, exist_ok=True)
    known = set(json.load(open(A("assets/manifest.json")))["paint"])

    for path, target in jobs:
        rgba = cutout_rgba(path)
        im = to_center(rgba) if mode == "creature" else to_bottom_anchor(rgba)
        dest = os.path.join(outdir, target + ".webp")
        im.save(dest, "WEBP", quality=86)
        note = ""
        if mode == "creature" and target not in known:
            note = "  ⚠️ manifest.json 의 paint 배열에 없음 — 추가해야 번들에 들어감"
        print(f"  저장: {os.path.relpath(dest, A('.'))}  ({os.path.getsize(dest)//1024}KB){note}")

    print("완료. 이제 `python3 scripts/build.py` → `bash scripts/verify.sh`")


if __name__ == "__main__":
    main()
