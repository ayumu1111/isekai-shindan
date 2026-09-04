import json, random
from collections import Counter

q = json.load(open('/home/claude/diagnosis/questions_29.json'))
d = json.load(open('/home/claude/diagnosis/bigfive_53.json'))
items, chars = q['items'], d['characters']
F = d['meta']['factors']

def score(answers):
    by = {f: [] for f in F}
    for a in answers:
        if a['type'] != 'answer': continue
        it = items[a['no']-1]
        by[it['factor']].append((8 - a['raw']) if it['reversed'] else a['raw'])
    return {f: (sum(v)/len(v) if v else None) for f, v in by.items()}

def nearest(sc):
    return min(chars, key=lambda c: sum((sc[f]-c['scores'][f])**2 for f in F))['name']

# --- 一貫回答での到達範囲 ---
print("■ 一貫して答えた場合の到達範囲")
for target in [1, 7]:
    ans = [{'no': i['no'], 'type': 'answer',
            'raw': (8 - target) if i['reversed'] else target} for i in items]
    sc = score(ans)
    print(f"   全因子を{target}に振る -> " + " ".join(f"{f[:4]}{sc[f]:.1f}" for f in F)
          + f"  => {nearest(sc)}")

# 単一因子だけ振り切る
print("\n■ 特定因子だけ振り切った場合")
for f0 in F:
    for target in [1, 7]:
        ans = []
        for i in items:
            base = target if i['factor'] == f0 else 4
            ans.append({'no': i['no'], 'type': 'answer',
                        'raw': (8 - base) if i['reversed'] else base})
        sc = score(ans)
        print(f"   {d['meta']['factorLabels'][f0]}を{target} -> "
              + " ".join(f"{f[:4]}{sc[f]:.1f}" for f in F) + f"  => {nearest(sc)}")

# --- 一貫した性格を持つ回答者のシミュレーション ---
# 「真の性格ベクトル」を1〜7から引き、各項目にノイズを乗せて回答させる
print("\n■ 一貫した性格を持つ回答者20万件（真値一様・項目ノイズSD1.0）")
random.seed(1)
hits = Counter()
for _ in range(200000):
    true = {f: random.uniform(1, 7) for f in F}
    ans = []
    for i in items:
        v = max(1, min(7, round(random.gauss(true[i['factor']], 1.0))))
        ans.append({'no': i['no'], 'type': 'answer',
                    'raw': (8 - v) if i['reversed'] else v})
    hits[nearest(score(ans))] += 1
unreach = [c['name'] for c in chars if hits[c['name']] == 0]
print(f"   到達不能: {len(unreach)}件 {unreach}")
print(f"   最多5件: {hits.most_common(5)}")
print(f"   最少5件: {hits.most_common()[-5:]}")

# --- 現実的な真値分布（平均4・SD1.2）でのシミュレーション ---
print("\n■ 現実的な母集団20万件（真値: 平均4/SD1.2、項目ノイズSD1.0）")
random.seed(2)
hits2 = Counter()
for _ in range(200000):
    true = {f: max(1, min(7, random.gauss(4, 1.2))) for f in F}
    ans = []
    for i in items:
        v = max(1, min(7, round(random.gauss(true[i['factor']], 1.0))))
        ans.append({'no': i['no'], 'type': 'answer',
                    'raw': (8 - v) if i['reversed'] else v})
    hits2[nearest(score(ans))] += 1
unreach2 = [c['name'] for c in chars if hits2[c['name']] == 0]
print(f"   到達不能: {len(unreach2)}件 {unreach2}")
print(f"   最多5件: {hits2.most_common(5)}")
print(f"   最少5件: {hits2.most_common()[-5:]}")
share = hits2.most_common(1)[0][1] / 200000 * 100
print(f"   最多キャラの占有率: {share:.1f}%")
