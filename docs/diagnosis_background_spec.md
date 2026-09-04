# 診断回答画面 共通背景イラスト仕様

## コンセプト
親しみやすい酒場風の冒険者ギルドホール。29体すべての質問キャラが、同じ場所に立っても違和感が出ない汎用的な室内空間とする。荘厳・大聖堂的な雰囲気ではなく、木造で温かみのある酒場然とした空間を目指す。

## 構図要素
- 木造中心の、こぢんまりとした酒場風の内装（石造り・尖頭アーチは使わない）
- 太い梁の低めの木造天井
- 手前左右に木製テーブル・椅子を配置（中央〜下部は空間を確保）
- テーブルの上に木製ジョッキ・エール（酒）
- 壁際や隅に積まれた酒樽・木箱
- 木製カウンター、コルクボード風の依頼掲示板（羊皮紙の貼り紙、文字は判読不可レベルでぼかす）
- 丸窓・格子窓から差し込む昼間の柔らかい光
- 暖炉やランタンの暖色の灯り
- 簡素なギルド紋章旗
- カラーパレット：暖色（琥珀・金）＋藍色を差し色程度に
- 画面下部〜中央下は広く空白気味に（キャラ立ち絵を後から合成するため）
- 人物・判読可能な文字要素は入れない

## NovelAI生成プロンプト

**Positive:**
```
cozy fantasy adventurer's guild hall, tavern-like interior, empty room,
wooden beamed ceiling, warm wooden walls and furniture,
wooden tables and chairs along the left and right sides, empty seats,
wooden mugs of ale on tables, stacked wooden barrels and crates in corners,
wooden counter, cork quest board with blurred parchment notices,
small round windows and lattice windows, soft daylight streaming in,
warm fireplace glow, hanging lanterns, cheerful welcoming atmosphere,
small guild banner with emblem,
cel-shaded illustration, painterly fantasy background art,
no characters, no people, wide open empty floor space in lower center foreground,
warm golden and amber tones with soft indigo accents, bright and inviting
```

**Negative:**
```
person, character, text, readable text, signage, blurry, low quality,
dark, gloomy, low key lighting, cathedral, stone vaulted ceiling,
grand, imposing, night, modern elements, cluttered center
```

## 用途
- 診断回答画面（answer_screen_ui_spec.md v2）の全29問共通背景として使用
- キャラ立ち絵は本背景の上に個別合成（設問ごとに`game_dialogue_29.json`のimageKeyに対応する絵へ差し替え）

## 生成・実装仕様

- **生成サイズ**：1216×832px（横長）
- **アップスケール**：Upscaylで2倍→2432×1664px
- **画面への当てはめ方**：固定比率に事前クロップせず、`background-size: cover`的な扱いで実装側にて縦長スマホ画面に合わせて表示位置を調整する

## ステータス
✅ 完成・生成済み（歩夢が2025-09-04セッションでNovelAI生成完了。画像ファイルはClaude Code引き継ぎ時に別途添付が必要）
