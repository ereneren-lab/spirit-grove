#!/usr/bin/env python3
"""고스트 탈 라인(hexmask/wraithmask/dreadmask) 절차적 픽셀 스프라이트 — 플레이 가능 플레이스홀더.

강철·사마귀 라인과 같은 목적: GPT 손그림이 오기 전까지 게임 규격의 '플레이 가능 + 교체 대상'
스프라이트를 코드로 찍는다. 부유하는 저주받은 탈(가면) + 아래로 자라는 그림자 자락.
규격: 256x256 RGBA webp, 투명 배경, 중앙 부유. 로직 64px → nearest 확대.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/art/creatures"
L = 64

# 창백한 탈(뼈/상아) + 자주빛 그림자 자락 + 시퍼런 눈불
OUTLINE = (30, 24, 38, 255)
MASKSH  = (150, 132, 150, 255)   # 탈 그림자
MASKMID = (206, 192, 200, 255)   # 탈 중간(상아빛)
MASKHI  = (238, 230, 236, 255)   # 탈 하이라이트
SHROUD  = (78, 54, 92, 255)      # 그림자 자락(자주)
SHROUDHI= (112, 82, 128, 255)
EYE     = (120, 224, 220, 255)   # 시퍼런 눈불
EYEHI   = (214, 252, 250, 255)
MOUTH   = (40, 30, 46, 255)


def new():
    im = Image.new("RGBA", (L, L), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)


def outline_pass(im):
    px = im.load(); base = im.copy(); bp = base.load()
    for y in range(L):
        for x in range(L):
            if bp[x, y][3] != 0: continue
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,1),(1,-1),(-1,-1)):
                nx, ny = x+dx, y+dy
                if 0 <= nx < L and 0 <= ny < L and bp[nx, ny][3] != 0 and bp[nx, ny] != OUTLINE:
                    px[x, y] = OUTLINE; break
    return im


def shroud_tatters(d, cx, top, bot, half):
    """탈 아래로 너덜너덜 갈라진 그림자 자락(삼각 톱니)."""
    for y in range(top, bot):
        t = (y - top) / max(1, bot - top)
        w = int(half * (1 - t * 0.35))
        # 톱니: x 위치에 따라 세로로 들쭉날쭉하게 끝단 자르기
        d.line([(cx - w, y), (cx + w, y)], fill=SHROUD if (y % 3) else SHROUDHI)
    # 아래 끝 톱니 파내기(투명)
    import random; random.seed(top)
    for k in range(-half, half, 3):
        notch = 2 + (k * 7 % 4)
        d.line([(cx + k, bot - notch), (cx + k, bot)], fill=(0, 0, 0, 0))
        d.line([(cx + k + 1, bot - notch), (cx + k + 1, bot)], fill=(0, 0, 0, 0))


def mask_face(d, px, cx, cy, w, h, eyes=2, mouth=True):
    """상아빛 탈: 둥근 위 + 뾰족한 턱 + 눈구멍 + 입."""
    d.polygon([(cx-w, cy-h), (cx+w, cy-h), (cx+w-1, cy), (cx, cy+h), (cx-w+1, cy)], fill=MASKMID)
    # 3톤: 위 하이라이트 / 아래 그림자
    for yy in range(cy-h, cy+h):
        tt = (yy-(cy-h))/(2*h)
        col = MASKHI if tt < 0.3 else (MASKMID if tt < 0.66 else MASKSH)
        left = cx - int(w*(1-max(0, (yy-cy)/h))) if yy > cy else cx-w
        right = cx + int(w*(1-max(0, (yy-cy)/h))) if yy > cy else cx+w
        d.line([(left, yy), (right, yy)], fill=col)
    # 눈불(시퍼런)
    ex = w // 2
    for sx in ([-ex, ex] if eyes == 2 else [0]):
        d.polygon([(cx+sx-2, cy-2), (cx+sx+2, cy-2), (cx+sx, cy+1)], fill=EYE)
        px[cx+sx, cy-1] = EYEHI
    if mouth:
        d.line([(cx-3, cy+h-2), (cx+3, cy+h-2)], fill=MOUTH)
        px[cx-2, cy+h-1] = MOUTH; px[cx+2, cy+h-1] = MOUTH


def finish(im, cid):
    im = outline_pass(im)
    big = im.resize((256, 256), Image.NEAREST)
    OUT.mkdir(parents=True, exist_ok=True)
    big.save(OUT / f"{cid}.webp", "WEBP", lossless=True)
    print("  wrote", cid)


def hexmask():
    """1단 저주탈 — 작은 탈만 둥실. 그림자 자락 거의 없음."""
    im, d = new(); px = im.load()
    mask_face(d, px, 32, 30, 11, 14, eyes=2)
    # 살짝의 그림자 꼬리
    shroud_tatters(d, 32, 44, 50, 6)
    finish(im, "hexmask")


def wraithmask():
    """2단 탈망령 — 탈 아래로 너덜너덜 그림자 자락이 자랐다."""
    im, d = new(); px = im.load()
    mask_face(d, px, 32, 24, 12, 15, eyes=2)
    shroud_tatters(d, 32, 39, 58, 12)
    # 자락에서 뻗은 두 팔 그림자
    d.line([(20, 42), (14, 50)], fill=SHROUD, width=2)
    d.line([(44, 42), (50, 50)], fill=SHROUD, width=2)
    finish(im, "wraithmask")


def dreadmask():
    """3단 원귀탈 — 큰 탈 + 넓게 드리운 원한의 자락. 눈불 강조."""
    im, d = new(); px = im.load()
    # 뒤로 드리운 큰 그림자(먼저 깔고)
    shroud_tatters(d, 32, 30, 60, 18)
    mask_face(d, px, 32, 20, 15, 17, eyes=2)
    # 이마 뿔(원한)
    d.polygon([(22, 8), (26, 4), (27, 12)], fill=MASKSH)
    d.polygon([(42, 8), (38, 4), (37, 12)], fill=MASKSH)
    # 곁에서 뻗은 유령 손
    d.line([(15, 40), (9, 34)], fill=SHROUDHI, width=2)
    d.line([(49, 40), (55, 34)], fill=SHROUDHI, width=2)
    # 눈불 한 겹 더 밝게
    for sx in (-7, 7):
        px[32+sx, 19] = EYEHI
    finish(im, "dreadmask")


if __name__ == "__main__":
    print("고스트 탈 라인 절차적 스프라이트:")
    hexmask(); wraithmask(); dreadmask()
    print("완료 → assets/art/creatures/")
