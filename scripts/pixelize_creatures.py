#!/usr/bin/env python3
"""
정령 아트를 도트로 — 페인터리 원본 → 게임에 실리는 픽셀 스프라이트.

  python3 scripts/pixelize_creatures.py                 # art_inbox/creatures_src → assets/art/creatures
  python3 scripts/pixelize_creatures.py --size 48       # 더 굵은 도트로

왜 있나
  주인공을 픽셀로 바꾸고 나니 **오버월드는 픽셀, 전투는 페인터리**로 층이 갈렸다.
  정령을 다시 생성할 필요는 없다 — 기존 아트를 줄이고 팔레트를 줄이면 도트로 읽힌다(실측 확인).
  32px는 얼굴이 뭉개지고 48부터 살아나며 64가 가장 또렷하다 → 기본 64.

⚠️ **원본을 덮어쓰지 않는다.** 입력은 `art_inbox/creatures_src/`, 출력은 `assets/art/creatures/`다.
   같은 폴더에 다시 돌리면 이미 줄어든 그림을 또 줄이게 되어 되돌릴 수 없다.
⚠️ 알파는 딱 끊는다(반투명 가장자리가 도트를 흐린다). 그림자가 반투명으로 구워져 있으면 같이 빠진다.
"""
import argparse, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__)) + "/.."
A = lambda *p: os.path.join(ROOT, *p)


def dotize(im, size, colors, alpha_cut):
    bb = im.getbbox()
    if bb:
        im = im.crop(bb)
    s = max(im.size)                       # 정사각 — 게임이 정사각 박스에 그린다
    sq = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    sq.alpha_composite(im, ((s - im.width) // 2, (s - im.height) // 2))
    small = sq.resize((size, size), Image.LANCZOS)
    a = small.getchannel("A").point(lambda v: 255 if v >= alpha_cut else 0)
    rgb = small.convert("RGB").quantize(colors=colors, method=Image.MEDIANCUT).convert("RGB")
    out = rgb.convert("RGBA")
    out.putalpha(a)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="art_inbox/creatures_src")
    ap.add_argument("--out", default="assets/art/creatures")
    ap.add_argument("--size", type=int, default=64)
    ap.add_argument("--colors", type=int, default=22)
    ap.add_argument("--alpha", type=int, default=110)
    a = ap.parse_args()

    src, out = A(a.src), A(a.out)
    if os.path.abspath(src) == os.path.abspath(out):
        sys.exit("❌ 입력과 출력이 같다 — 원본을 덮어쓰면 되돌릴 수 없다. --src 를 원본 폴더로 줄 것")
    if not os.path.isdir(src):
        sys.exit(f"❌ 원본 폴더가 없다: {src}\n   assets/art/creatures 를 여기로 먼저 옮길 것")
    os.makedirs(out, exist_ok=True)

    files = sorted(f for f in os.listdir(src) if f.endswith(".webp"))
    if not files:
        sys.exit(f"❌ {src} 에 .webp 가 없다")
    tot_in = tot_out = 0
    for f in files:
        im = Image.open(os.path.join(src, f)).convert("RGBA")
        d = dotize(im, a.size, a.colors, a.alpha)
        dst = os.path.join(out, f)
        d.save(dst, "WEBP", lossless=True)
        tot_in += os.path.getsize(os.path.join(src, f))
        tot_out += os.path.getsize(dst)
    print(f"✅ {len(files)}종 변환 · 칸 {a.size}px · 색 {a.colors}종 이내")
    print(f"   용량 {tot_in//1024}KB → {tot_out//1024}KB")
    print("   다음: python3 scripts/build.py")


if __name__ == "__main__":
    main()
