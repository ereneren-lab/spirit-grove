#!/usr/bin/env python3
"""
정령의 숲 아트 파이프라인.
배경제거(GrabCut) → 리사이즈 → WebP q86 → base64 → HTML 주입.

사용 예:
  # 크리처 (PAINT_ART, 중앙정렬). jobs = 파일패턴:id
  python scripts/process_art.py creature spirit_grove_3d.html \
      art_inbox/foxfire.png=foxfire art_inbox/emberwolf.png=emberwolf

  # 주인공 정면 (HERO_ART, 발끝 하단정렬). id는 0~3
  python scripts/process_art.py hero spirit_grove_3d.html \
      art_inbox/rio.png=0 art_inbox/mina.png=1

  # 주인공 뒷모습 (HERO_ART_BACK)
  python scripts/process_art.py hero_back spirit_grove_3d.html art_inbox/rio_back.png=0

의존성: pip install opencv-python-headless numpy Pillow
한 이미지에 캐릭터 2명이면 미리 좌/우로 잘라서 각각 넣을 것.
"""
import sys, io, base64, re
import cv2, numpy as np
from PIL import Image

R = 420

def cutout_rgba(path):
    img0 = cv2.imread(path); img = cv2.resize(img0, (R, R), interpolation=cv2.INTER_AREA)
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

def encode(im):
    buf = io.BytesIO(); im.save(buf, "WEBP", quality=86)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()

def process(path, mode):
    rgba = cutout_rgba(path)
    im = to_center(rgba) if mode == "creature" else to_bottom_anchor(rgba)
    return encode(im)

def inject_paint(html, id_, url):
    # replace existing entry if present, else insert after `const PAINT_ART={`
    pat = re.compile(r'^' + re.escape(id_) + r':"data:image[^\n]*$', re.M)
    line = f'{id_}:"{url}",'
    if pat.search(html):
        return pat.sub(line, html, count=1)
    return html.replace("const PAINT_ART={", "const PAINT_ART={\n" + line, 1)

def inject_hero(html, const_name, idx, url):
    # object literal on one line: const HERO_ART={"0":"...","1":"..."}
    m = re.search(r'(const ' + const_name + r'=\{)(.*?)(\};)', html, re.S)
    if not m:
        raise SystemExit(f"{const_name} 상수를 찾지 못함")
    body = m.group(2)
    key = f'"{idx}"'
    entry = f'{key}:"{url}"'
    if re.search(re.escape(key) + r':"data:image.*?"', body):
        body = re.sub(re.escape(key) + r':"data:image[^"]*"', entry, body, count=1)
    else:
        body = (body + "," if body.strip() else "") + entry
    return html[:m.start()] + m.group(1) + body + m.group(3) + html[m.end():]

def main():
    if len(sys.argv) < 4:
        print(__doc__); raise SystemExit(1)
    mode, html_path = sys.argv[1], sys.argv[2]
    jobs = [a.split("=", 1) for a in sys.argv[3:]]
    html = open(html_path, encoding="utf-8").read()
    for path, target in jobs:
        kind = "creature" if mode == "creature" else "hero"
        url = process(path, kind)
        if mode == "creature":
            html = inject_paint(html, target, url)
        elif mode == "hero":
            html = inject_hero(html, "HERO_ART", target, url)
        elif mode == "hero_back":
            html = inject_hero(html, "HERO_ART_BACK", target, url)
        else:
            raise SystemExit(f"알 수 없는 모드: {mode}")
        print(f"  주입 완료: {target}  ({len(url)//1024}KB base64)")
    open(html_path, "w", encoding="utf-8").write(html)
    print("완료. 이제 scripts/verify.sh 로 검증하세요.")

if __name__ == "__main__":
    main()
