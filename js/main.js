// ==================== 画面遷移・データ読込 ====================
let DATA = null;
let currentResultState = null; // { scores, specialKey }

function showScreen(id) {
  ['screen-intro', 'screen-quiz', 'screen-result'].forEach(s => {
    document.getElementById(s).hidden = (s !== id);
  });
  window.scrollTo(0, 0);
}

async function loadData() {
  const files = ['questions_29', 'bigfive_53', 'game_dialogue_29', 'factor_comments_53', 'diagnosis_story_55', 'personality_catchphrase_20'];
  const [questions, bigfive, dialogue, factorComments, diagnosisStory, catchphraseData] =
    await Promise.all(files.map(f => fetch(`data/${f}.json`).then(r => r.json())));
  return { questions, bigfive, dialogue, factorComments, diagnosisStory, catchphraseData };
}

function startQuiz() {
  showScreen('screen-quiz');
  Quiz.init({
    questionsData: DATA.questions,
    dialogueData: DATA.dialogue,
    onDone: handleQuizDone
  });
}

function handleQuizDone(answersMap) {
  const { scores, skipRate, dontKnowRate } = scoreAnswers(answersMap, DATA.questions);
  const specialKey = resolveSpecial(skipRate, dontKnowRate);
  history.replaceState(null, '', `${location.pathname}?${encodeResult(scores, specialKey)}`);
  const rendered = Result.render(DATA, { scores, specialKey, isShared: false });
  currentResultState = { scores, specialKey, ...rendered };
  showScreen('screen-result');
}

function restartQuiz() {
  Quiz.reset();
  currentResultState = null;
  history.replaceState(null, '', location.pathname);
  startQuiz();
}

async function shareResult() {
  if (!currentResultState) return;
  const { scores, specialKey, catchphrase, name, imageKey } = currentResultState;
  const url = `${location.origin}${location.pathname}?${encodeResult(scores, specialKey)}`;
  const text = `異世界転生診断、結果は「${catchphrase}」でした！`;

  let file = null;
  try {
    const blob = await ShareCard.build({ name, catchphrase, imageKey, scores, rankTable: DATA.bigfive.meta.rankTable });
    if (blob) file = new File([blob], 'isekai-shindan-result.png', { type: 'image/png' });
  } catch (e) { /* 画像生成に失敗してもテキスト共有にフォールバックする */ }

  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    // 画像(files)付きの共有は、送信先アプリによってurlフィールドが無視されることがあるため
    // テキスト側にもURLを埋め込んで、リンクが必ず残るようにする
    const textWithUrl = `${text}\n${url}`;
    try {
      await navigator.share({ title: '異世界転生診断', text: textWithUrl, files: [file] });
    } catch (e) { /* ユーザーによるキャンセル等は無視 */ }
    return;
  }
  if (navigator.share) {
    try { await navigator.share({ title: '異世界転生診断', text, url }); } catch (e) { /* 同上 */ }
    return;
  }
  // Web Share API非対応環境: 画像はダウンロード、Xは投稿画面を開く自己申告フォールバック
  if (file) {
    const dlUrl = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = 'isekai-shindan-result.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(dlUrl), 4000);
  }
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(intent, '_blank', 'noopener');
}

function wireEvents() {
  document.getElementById('btnStart').addEventListener('click', startQuiz);
  document.getElementById('btnRetry').addEventListener('click', restartQuiz);
  document.getElementById('btnTryMyself').addEventListener('click', restartQuiz);
  document.getElementById('btnShare').addEventListener('click', shareResult);
}

async function bootstrap() {
  DATA = await loadData();
  wireEvents();

  const shared = decodeResult(location.search);
  if (shared) {
    const rendered = Result.render(DATA, { scores: shared.scores, specialKey: shared.special, isShared: true });
    currentResultState = { scores: shared.scores, specialKey: shared.special, ...rendered };
    showScreen('screen-result');
  } else {
    showScreen('screen-intro');
  }
}

bootstrap();
