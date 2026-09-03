#!/usr/bin/env python3
"""강철 정령 라인(orelet/ironforge/steelgolem) 절차적 픽셀 스프라이트 생성.

기계·강철 계열은 기하학적이라 코드로 그려도 읽힌다. 스타일 바이블의 픽셀 톤(투명 배경·
도트·3톤 셰이딩·시안 코어 발광)에 맞춘 '플레이 가능 + 업그레이드 대상' 스프라이트.
게임이 먹는 규격: 256x256 RGBA webp, 투명 배경, 중앙 부유(접지 없음).
로직 해상도 64px에서 그린 뒤 nearest 확대 → 도트감 유지.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/art/creatures"
L = 64  # 로직 픽셀 해상도

# 강철 팔레트 (아웃라인/그림자/중간/하이라이트) + 시안 코어 발광 + 주황 리벳
OUTLINE = (28, 32, 40, 255)
SHADOW  = (74, 84, 98, 255)
MID     = (120, 132, 148, 255)
HI      = (176, 188, 202, 255)
SPEC    = (222, 230, 240, 255)
CORE    = (86, 214, 226, 255)      # 시안 코어/눈
COREHI  = (200, 248, 252, 255)
RIVET   = (210, 150, 70, 255)      # 놋쇠 리벳


def new():
    im = Image.new("RGBA", (L, L), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def mirror_px(px, x, y, c):
    px[x, y] = c
    px[L - 1 - x, y] = c


def outline_pass(im):
    """불투명 픽셀 둘레에 아웃라인 한 겹 — 배경에서 실루엣이 뜬다."""
    px = im.load(); base = im.copy(); bp = base.load()
    for y in range(L):
        for x in range(L):
            if bp[x, y][3] != 0:
                continue
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,1),(1,-1),(-1,-1)):
                nx, ny = x+dx, y+dy
                if 0 <= nx < L and 0 <= ny < L and bp[nx, ny][3] != 0 and bp[nx, ny] != OUTLINE:
                    px[x, y] = OUTLINE; break
    return im


def shade_block(d, x0, y0, x1, y1):
    """가로 대칭 블록 + 위 하이라이트/아래 그림자 3톤."""
    for y in range(y0, y1+1):
        t = (y - y0) / max(1, (y1 - y0))
        col = HI if t < 0.28 else (MID if t < 0.68 else SHADOW)
        d.line([(x0, y), (x1, y)], fill=col)


def finish(im, cid):
    im = outline_pass(im)
    big = im.resize((256, 256), Image.NEAREST)
    OUT.mkdir(parents=True, exist_ok=True)
    big.save(OUT / f"{cid}.webp", "WEBP", lossless=True)
    print("  wrote", cid)


def orelet():
    im, d = new(); px = im.load()
    # 둥근 쇳덩이 몸통
    d.ellipse([18, 22, 45, 48], fill=MID)
    shade_block(d, 20, 24, 43, 46)
    # 둥근 실루엣 다듬기(모서리 깎기)
    for (cx, cy) in ((18,22),(45,22),(18,48),(45,48)):
        d.ellipse([cx-3, cy-3, cx+3, cy+3], fill=(0,0,0,0))
    d.ellipse([18, 22, 45, 48], outline=None)
    d.ellipse([20, 24, 43, 46], fill=None)
    # 상단 하이라이트 스팟
    d.ellipse([24, 26, 32, 31], fill=HI)
    d.point([(27, 27)], fill=SPEC)
    # 놋쇠 리벳 3개
    for rx, ry in ((23, 41), (32, 44), (40, 41)):
        d.ellipse([rx-1, ry-1, rx+1, ry+1], fill=RIVET)
    # 시안 눈 두 개
    for ex in (26, 37):
        d.ellipse([ex-2, 33, ex+2, 37], fill=CORE)
        px[ex, 34] = COREHI
    # 작은 볼트 뿔
    d.rectangle([30, 18, 33, 22], fill=SHADOW); px[31, 18] = RIVET; px[32, 18] = RIVET
    finish(im, "orelet")


def ironforge():
    im, d = new(); px = im.load()
    # 육각 장갑 몸통(사다리꼴 + 어깨판)
    d.polygon([(22,20),(42,20),(48,34),(44,50),(20,50),(16,34)], fill=MID)
    shade_block(d, 20, 22, 44, 48)
    d.polygon([(22,20),(42,20),(48,34),(44,50),(20,50),(16,34)], fill=None)
    # 어깨 플레이트 두 겹
    d.polygon([(14,30),(24,26),(24,36),(14,40)], fill=HI)
    d.polygon([(50,30),(40,26),(40,36),(50,40)], fill=SHADOW)
    # 가슴 플레이트 라인
    d.line([(24,32),(40,32)], fill=SHADOW); d.line([(24,40),(40,40)], fill=SHADOW)
    # 시안 코어(가슴)
    d.rectangle([29, 34, 34, 39], fill=CORE); d.rectangle([30, 35, 33, 38], fill=COREHI)
    # 바이저 눈(슬릿)
    d.rectangle([25, 25, 38, 27], fill=OUTLINE); d.rectangle([26, 26, 37, 26], fill=CORE)
    # 리벳
    for rx, ry in ((22, 46), (41, 46)):
        d.ellipse([rx-1, ry-1, rx+1, ry+1], fill=RIVET)
    # 스터디 다리
    d.rectangle([24, 50, 29, 54], fill=SHADOW); d.rectangle([34, 50, 39, 54], fill=SHADOW)
    finish(im, "ironforge")


def steelgolem():
    im, d = new(); px = im.load()
    # 머리(블록) + 바이저
    d.rectangle([26, 12, 37, 22], fill=MID); shade_block(d, 27, 13, 36, 21)
    d.rectangle([27, 16, 36, 18], fill=OUTLINE); d.rectangle([28, 17, 35, 17], fill=CORE)
    d.rectangle([30, 10, 33, 12], fill=SHADOW)  # 볼트 뿔
    # 넓은 어깨 + 몸통
    d.polygon([(16,26),(47,26),(44,46),(19,46)], fill=MID); shade_block(d, 20, 27, 43, 45)
    d.polygon([(16,26),(47,26),(44,46),(19,46)], fill=None)
    # 어깨 플레이트
    d.polygon([(12,26),(22,24),(22,34),(12,36)], fill=HI)
    d.polygon([(51,26),(41,24),(41,34),(51,36)], fill=SHADOW)
    # 가슴 코어(큰 발광)
    d.rectangle([28, 31, 35, 40], fill=OUTLINE); d.rectangle([29, 32, 34, 39], fill=CORE)
    d.rectangle([30, 33, 33, 37], fill=COREHI)
    # 가슴 플레이트 라인
    d.line([(22,30),(41,30)], fill=SHADOW)
    # 팔(블록)
    d.rectangle([13, 30, 18, 44], fill=SHADOW); d.rectangle([45, 30, 50, 44], fill=SHADOW)
    d.rectangle([12, 43, 19, 48], fill=MID); d.rectangle([44, 43, 51, 48], fill=MID)  # 주먹
    # 다리(블록)
    d.rectangle([22, 46, 29, 54], fill=SHADOW); d.rectangle([34, 46, 41, 54], fill=SHADOW)
    d.rectangle([21, 53, 30, 56], fill=MID); d.rectangle([33, 53, 42, 56], fill=MID)  # 발
    # 리벳
    for rx, ry in ((24, 43), (39, 43), (31, 27)):
        d.ellipse([rx-1, ry-1, rx+1, ry+1], fill=RIVET)
    finish(im, "steelgolem")


if __name__ == "__main__":
    print("강철 라인 절차적 스프라이트:")
    orelet(); ironforge(); steelgolem()
    print("완료 → assets/art/creatures/")
