# 여기에 NPC 원형 그림을 넣으세요

> ✅ **2026-08-11에 12종 전부 들어왔습니다.** 아래는 다음에 또 받을 때를 위한 안내입니다.
>
> 📌 **대조표 한 장으로 줘도 됩니다 — 오히려 그게 낫습니다.**
> 12원형 × 3자세를 한 장에 몰아 뽑아야 화풍이 안 갈립니다(08-11에 실제로 그렇게 왔습니다).
> 라벨이 인쇄돼 있어도 되고, 배경이 투명이 아니어도 됩니다. 쪼개는 건 이쪽에서 합니다:
> ```bash
> python3 scripts/split_contact_sheet.py <대조표.png> --out art_inbox/npc/_split \
>         --names kid,bugkid,youth_f,youth_m,hunter,angler,miner,scholar,mystic,guard,merchant,elder
> ```
> ⚠️ 다만 **자세끼리는 떨어뜨려** 주세요. 소품(곡괭이·낚싯대)이 옆 자세와 겹치면 그만큼 잘려 나갑니다.

**파일 이름 = 원형 id** 입니다. 확장자는 png/webp/jpg 다 됩니다.

```
kid.png  bugkid.png  youth_f.png  youth_m.png  hunter.png  angler.png
miner.png  scholar.png  mystic.png  guard.png  merchant.png  elder.png
```

한 장씩 넣어도 됩니다. 없는 원형은 지금의 절차적 스프라이트로 그대로 나옵니다.
**초반만 보려면 `kid` · `bugkid` · `youth_m` · `scholar` · `elder` 5장이면 마을~초원이 덮입니다.**

## 그림 한 장에 자세 3개 (가로로, 서로 떨어뜨려서)

```
[ ① 정면 ]      [ ② 뒷모습 ]      [ ③ 오른쪽 옆모습 ]
```

- 배경 **완전 투명** · 그림자 그리지 말 것
- 옆모습은 **오른쪽만** (왼쪽은 게임이 뒤집어 씁니다)
- 걷는 자세는 **안 그려도 됩니다** — 변환기가 만듭니다
- 자세 사이를 **넉넉히 띄울 것** (붙어 있으면 자동 분할이 실패합니다)

프롬프트 12개: `outputs/production/2026-08-11_spirit-grove_npc-sheet-prompts.md`

## 넣은 뒤 (Claude에게 "npc 그림 넣었어" 하면 알아서 합니다)

```bash
python3 scripts/make_npc_sheet.py --src art_inbox/npc --out assets/art/npc_sheet
# → 로그의 "격자 감지: 1행 × 3열" 확인
# → assets/manifest.json 의 "npc_sheet" 배열에 원형 id 추가
python3 scripts/build.py && node scripts/npc_sheet_test.js dist/spirit_grove_3d.html
```
