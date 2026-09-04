# 診断回答画面 進捗リビール画像 仕様

## コンセプト（最終版：エジプト壁画風）
横長の1枚に、ギルドホール壁上部の装飾として、エジプト壁画（レリーフ）風の意匠化された竜を配置。回答するごとに左から右へ（または右から左へ）少しずつ現れていく演出用アセット。結果キャラとは無関係のモチーフとし、ネタバレを避ける。

## 構図要素
- 竜は完全な横向き(側面)のシルエット。頭は画面の片端、尾は反対の片端に来るよう1体のみ配置（対称・複数体・頭が両端に出る構図はNG）
- 平面的・線画的なタッチ（陰影を強くつけず、輪郭線と幾何学的な模様で表現）
- 配色：金＋藍。エジプト壁画特有の、区切られたパネル風の装飾ラインを含む
- 構図は画面上部1/3程度にのみ配置、下部は無地の壁（クロップ前提の余白）
- 文字要素は入れない

## NovelAI生成プロンプト（最終版）

**Positive:**
```
ancient egyptian style wall relief mural, flat profile artwork,
single elongated dragon shown entirely in side profile facing right,
dragon head with horns and open jaw at the right end, tail curling at the left end,
clawed legs, folded wings, scaled body rendered as flat linework,
confined to the top third of the image, plain empty stone wall filling the lower two-thirds,
gold leaf linework on deep indigo background, hieroglyph-like decorative border lines,
flat 2D illustration, no shading depth, cel-shaded painterly touch,
no characters, no people, no text
```

**Negative:**
```
two heads, mirrored composition, symmetrical, multiple dragons, duplicated creature,
snake, plain serpent body, headless, no legs, no wings, no horns,
realistic 3D rendering, photo-realistic, deep shadows,
person, human, readable text, cluttered, low quality, blurry, disconnected fragments
```

## 生成・実装メモ

- 画面上部1/3のみに壁画を収める構図指定により、生成後に上部帯を横長ストリップとしてクロップして使用する
- 完成後、実装側（Claude Code）でクリップ幅を1/29刻みに計算し、`clip-path`または`width`アニメーションで回答ごとに表示範囲を広げる（左→右、または右→左は実装時に決定）

## ステータス
✅ 完成・生成済み（歩夢が2025-09-04セッションでNovelAI生成完了。画像ファイルはClaude Code引き継ぎ時に別途添付が必要）
