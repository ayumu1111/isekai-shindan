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
  currentResultState = { scores, specialKey };
  history.replaceState(null, '', `${location.pathname}?${encodeResult(scores, specialKey)}`);
  Result.render(DATA, { scores, specialKey, isShared: false });
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
  const url = `${location.origin}${location.pathname}?${encodeResult(currentResultState.scores, currentResultState.specialKey)}`;
  const catchphrase = document.getElementById('resultCatchphrase').textContent;
  const text = `異世界転生後の職業診断、結果は「${catchphrase}」でした！`;
  if (navigator.share) {
    try { await navigator.share({ title: '異世界転生後の職業診断', text, url }); } catch (e) { /* ユーザーによるキャンセル等は無視 */ }
  } else {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(intent, '_blank', 'noopener');
  }
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
    currentResultState = { scores: shared.scores, specialKey: shared.special };
    Result.render(DATA, { scores: shared.scores, specialKey: shared.special, isShared: true });
    showScreen('screen-result');
  } else {
    showScreen('screen-intro');
  }
}

bootstrap();
