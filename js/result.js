// ==================== 結果ページ描画 ====================
// レイアウトは docs/results_page_mockup.html（歩夢が別チャットで作成したデザイン参考）に準拠する。
const Result = (() => {
  const FACTOR_CLASS = { openness: 'open', conscientiousness: 'cons', extraversion: 'extr', agreeableness: 'agree', sensitivity: 'sens' };
  const BAND_LABEL = { same: '同じくらい', higher: 'より高い', lower: 'より低い' };
  const SPECIAL_NAME = { special_hayaoshi: '早押しクソザコ転生者', special_nandemo: 'なんでもいいよが口癖の者' };
  const GACHA_URL = 'https://isekai-gacha.com/?utm_source=diagnosis&utm_medium=result_page&utm_campaign=personality_test';

  // 「職業名『固有名』」パターンは職業名を小さく添え、固有名を鉤括弧付きの見出しにする。
  // パターンがない素の名前は、mockup同様に鉤括弧で囲んで見出しにする。
  function charNameHtml(fullName) {
    const m = fullName.match(/^(.+?)「(.+)」$/);
    if (m) return `<span class="job-title">${m[1]}</span>「${m[2]}」`;
    return `「${fullName}」`;
  }

  function pctFor(v) { return ((v - 1) / 6) * 100; }

  function renderCharFactors(char, factorLabels, rankTable) {
    const el = document.getElementById('charFactorsBlock');
    el.innerHTML = FACTORS.map(f => {
      const v = char.scores[f];
      const rank = rankFor(v, rankTable);
      const flavor = char.flavors[f];
      return `<div class="gauge-row ${FACTOR_CLASS[f]}">
        <div class="g-top"><span class="g-label">${factorLabels[f]}</span><span class="g-rank">${rank}</span></div>
        <div class="g-track"><div class="g-fill" style="width:${pctFor(v)}%"></div></div>
        <p class="g-flavor">${flavor}</p>
      </div>`;
    }).join('');
  }

  function renderYours(scores, char, imageKey, factorComments, factorLabels, rankTable) {
    const el = document.getElementById('yoursFactorBlocks');
    const commentEntry = char ? factorComments.characters.find(c => c.imageKey === char.imageKey) : null;
    const portraitSrc = `images/characters/${imageKey}.webp`;
    el.innerHTML = FACTORS.map(f => {
      const v = scores[f];
      const rank = rankFor(v, rankTable);
      const cls = FACTOR_CLASS[f];
      let commentHtml = '';
      if (commentEntry) {
        const band = bandFor(v, char.scores[f]);
        const text = commentEntry.factorComments[f][band] || commentEntry.factorComments[f].same;
        commentHtml = `<div class="fb-comment">
          <div class="fb-avatar"><img src="${portraitSrc}" alt=""></div>
          <div class="fb-bubble">
            <span class="fb-badge">${BAND_LABEL[band]}</span>
            <p>${text}</p>
          </div>
        </div>`;
      }
      return `<div class="factor-block fb-${cls}">
        <div class="fb-top"><span class="fb-label">${factorLabels[f]}</span><span class="fb-rank">${rank}</span></div>
        <div class="g-track"><div class="g-fill" style="width:${pctFor(v)}%"></div></div>
        ${commentHtml}
      </div>`;
    }).join('');
  }

  function render(data, opts) {
    const { bigfive, factorComments, diagnosisStory, catchphraseData } = data;
    const { scores, specialKey, isShared } = opts;
    const factorLabels = bigfive.meta.factorLabels;
    const rankTable = bigfive.meta.rankTable;

    document.getElementById('resultSharedBanner').hidden = !isShared;

    const catchphrase = pickCatchphrase(scores, catchphraseData);
    document.getElementById('resultCatchphrase').textContent = catchphrase;

    const isSpecial = !!specialKey;
    const char = isSpecial ? null : matchCharacter(scores, bigfive);
    const imageKey = isSpecial ? specialKey : char.imageKey;
    const rarity = isSpecial ? null : char.rarity;
    const name = isSpecial ? SPECIAL_NAME[specialKey] : char.name;

    document.getElementById('resultPortraitImg').src = `images/characters/${imageKey}.webp`;
    document.getElementById('resultCharName').innerHTML = charNameHtml(name);

    const storyEntry = diagnosisStory.stories.find(s => s.imageKey === imageKey);
    document.getElementById('resultStory').textContent = storyEntry ? storyEntry.diagnosisStory : '';

    const charFactorsBlock = document.getElementById('charFactorsBlock');
    const rankNote = document.getElementById('rankNote');
    if (isSpecial) {
      charFactorsBlock.hidden = true;
      rankNote.hidden = true;
    } else {
      charFactorsBlock.hidden = false;
      rankNote.hidden = false;
      renderCharFactors(char, factorLabels, rankTable);
    }

    renderYours(scores, char, imageKey, factorComments, factorLabels, rankTable);

    document.getElementById('gachaCta').href = GACHA_URL;

    return { catchphrase, name, imageKey, rarity, char, isSpecial };
  }

  return { render };
})();
