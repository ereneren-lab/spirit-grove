#!/usr/bin/env python3
"""NPC 원형 시트 일괄 변환 — 폴더 안의 "3자세 한 장"들을 3×3 걷기 시트로 만든다.

왜 있나
    주인공 4명은 `make_hero_sheet.py`로 한 장씩 만들었다. NPC는 원형이 12종이라
    같은 명령을 12번 치게 되는데, 그때마다 --front/--back/--side를 손으로 넣으면
    한 군데만 틀려도 조용히 어긋난다(옆모습을 왼쪽으로 넣는 실수가 대표적이다).
    → **변환 로직은 make_hero_sheet.py를 그대로 재사용**하고, 여기선 반복만 돌린다.

⚠️ 변환 규칙 자체를 여기에 다시 쓰지 않는다. 배경 제거·그림자 처리·공통 정사각 변은
   전부 make_hero_sheet.py의 함수를 import해서 쓴다. 규칙이 두 벌이 되면 반드시 갈라진다
   (이 저장소가 병렬 테이블로 여러 번 당했다).

쓰는 법
    python3 scripts/make_npc_sheet.py --src art_inbox/npc --out assets/art/npc_sheet

    파일 이름이 곧 원형 id가 된다:  kid.png → assets/art/npc_sheet/kid.webp
    원형 id 목록은 outputs/production/2026-08-11_spirit-grove_npc-sheet-prompts.md §1.
"""
import argparse, sys, json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from PIL import Image
from make_hero_sheet import (strip_background, drop_soft_alpha, detect_grid,
                             cell, to_square_feet_bottom, dotize, step_frame)

# §1의 원형 12종. 여기 없는 파일 이름이 오면 경고하고 넘어간다 —
# 오타로 만든 원형이 조용히 매니페스트에 들어가면 게임에선 폴백만 보고 원인을 못 찾는다.
ARCHETYPES = ["kid", "bugkid", "youth_f", "youth_m", "hunter", "angler",
              "miner", "scholar", "mystic", "guard", "merchant", "elder",
              # 2차(2026-08-11) — 같은 원형끼리 쌍둥이가 되던 것 + 역할과 그림이 어긋난 자리. §7
              "kid_f", "scholar_f", "elder_m", "woodcutter", "falconer",
              # 3차-A(2026-08-11) — NPC_SPR 쪽. 이들은 NPC_ARCH가 아니라 NPC_SPR에 sheet를 넣는다. §8-A
              "nurse", "clerk", "lore", "p", "n", "s", "snowMaster", "isleLeader",
              # 3차-B(2026-08-11) — 같은 원형 겹침 해소. §8-B
              "angler2", "mystic2", "kid2", "guard_f", "youth_f2", "scholar2", "elder2"]


def convert(src: Path, out: Path, C=64, colors=22, bob=1, sway=1, bgthresh=45):
    im = drop_soft_alpha(strip_background(Image.open(src).convert("RGBA"), bgthresh))
    cols, rows = detect_grid(im)
    print(f"  격자 감지: {len(rows)}행 × {len(cols)}열", end="")
    if len(rows) != 1 or len(cols) != 3:
        # 자세가 붙어 있으면 여기서 걸린다. 그냥 진행하면 정면 세 장짜리 시트가 나온다.
        print("  ❌")
        print(f"     기대: 1행 × 3열 (정면·뒷모습·오른쪽옆). 자세 사이 여백을 넉넉히 받아야 한다.")
        return False
    print("  ✅")

    sprites = [cell(im, cols, rows, f"r1c{c+1}") for c in range(3)]
    # ⚠️ 세 자세가 **한 배율**을 쓰도록 가장 큰 것에 맞춘 공통 변을 먼저 구한다.
    #    칸마다 따로 정사각을 잡으면 방향을 바꿀 때 크기가 튄다(주인공 때 겪었다).
    SIDE = max(max(s.size) for s in sprites)
    sheet = Image.new("RGBA", (C * 3, C * 3), (0, 0, 0, 0))
    for row, sp in enumerate(sprites):
        idle = dotize(to_square_feet_bottom(sp, SIDE), C, colors)
        for c, f in enumerate([idle, step_frame(idle, 0, bob, sway), step_frame(idle, 1, bob, sway)]):
            sheet.alpha_composite(f, (c * C, row * C))
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, "WEBP", lossless=True)
    print(f"     → {out}  {sheet.width}x{sheet.height} (공통 변 {SIDE}px)")
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="3자세 이미지들이 든 폴더")
    ap.add_argument("--out", required=True, help="시트를 쓸 폴더 (예: assets/art/npc_sheet)")
    ap.add_argument("--cell", type=int, default=64)
    ap.add_argument("--colors", type=int, default=22)
    ap.add_argument("--bob", type=int, default=1)
    ap.add_argument("--sway", type=int, default=1)
    ap.add_argument("--bgthresh", type=int, default=45)
    a = ap.parse_args()

    src, out = Path(a.src), Path(a.out)
    if src.resolve() == out.resolve():
        sys.exit("❌ --src와 --out이 같다. 원본을 덮어쓰면 되돌릴 수 없다.")
    files = sorted(f for f in src.iterdir()
                   if f.suffix.lower() in (".png", ".webp", ".jpg", ".jpeg"))
    if not files:
        sys.exit(f"❌ {src} 에 이미지가 없다.")

    ok, bad, unknown = [], [], []
    for f in files:
        aid = f.stem
        print(f"\n▶ {f.name}  (원형 {aid})")
        if aid not in ARCHETYPES:
            unknown.append(aid)
            print(f"  ⚠️ 알려진 원형이 아니다. 문서 §1의 이름을 쓸 것: {', '.join(ARCHETYPES)}")
        (ok if convert(f, out / f"{aid}.webp", a.cell, a.colors, a.bob, a.sway, a.bgthresh)
         else bad).append(aid)

    print(f"\n{'='*54}")
    print(f"변환 {len(ok)}장 성공 · {len(bad)}장 실패" + (f" · 이름 미상 {len(unknown)}개" if unknown else ""))
    if ok:
        print(f"\n⚠️ 게임에 실으려면 assets/manifest.json 의 \"npc_sheet\" 에 넣을 것:")
        print("   " + json.dumps(sorted(ok), ensure_ascii=False))
    missing = [x for x in ARCHETYPES if x not in ok]
    if missing:
        print(f"\n📌 아직 없는 원형 {len(missing)}개 — 이들은 절차적 스프라이트로 폴백한다(정상):")
        print("   " + ", ".join(missing))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
