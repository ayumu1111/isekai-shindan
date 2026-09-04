// ==================== 採点・キャラ判定エンジン ====================
// verify2.py（企画資料 docs/verify2.py）のロジックをそのまま移植したもの。
// DOM に依存しない純粋関数のみで構成する。

const FACTORS = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'sensitivity'];
const SPECIAL_THRESHOLD = 0.5;

// answers: Map<no, {type: 'answer'|'skip'|'dontKnow', raw?: 1-7}>
function scoreAnswers(answers, questions) {
  const itemByNo = new Map(questions.items.map(q => [q.no, q]));
  const byFactor = {};
  FACTORS.forEach(f => { byFactor[f] = []; });

  let skipCount = 0, dontKnowCount = 0, total = 0;
  for (const [no, a] of answers) {
    const item = itemByNo.get(no);
    if (!item) continue;
    total++;
    if (a.type === 'skip') { skipCount++; continue; }
    if (a.type === 'dontKnow') { dontKnowCount++; continue; }
    const raw = item.reversed ? (8 - a.raw) : a.raw;
    byFactor[item.factor].push(raw);
  }

  const scores = {};
  for (const f of FACTORS) {
    const arr = byFactor[f];
    // 該当因子の回答が0件（全部スキップ/わからない）だった場合は中央値4で補完する
    scores[f] = arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 4;
  }

  return {
    scores,
    skipRate: total ? skipCount / total : 0,
    dontKnowRate: total ? dontKnowCount / total : 0
  };
}

function matchCharacter(scores, bigfive) {
  let best = null, bestDist = Infinity;
  for (const c of bigfive.characters) {
    let d = 0;
    for (const f of FACTORS) {
      const diff = scores[f] - c.scores[f];
      d += diff * diff;
    }
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best;
}

// skip率・わからない率がともに閾値超過の場合はskip優先（仕様通り）
function resolveSpecial(skipRate, dontKnowRate) {
  if (skipRate >= SPECIAL_THRESHOLD) return 'special_hayaoshi';
  if (dontKnowRate >= SPECIAL_THRESHOLD) return 'special_nandemo';
  return null;
}

function pickCatchphrase(scores, catchphraseData) {
  let maxF = FACTORS[0], minF = FACTORS[0];
  for (const f of FACTORS) {
    if (scores[f] > scores[maxF]) maxF = f;
    if (scores[f] < scores[minF]) minF = f;
  }
  if (maxF === minF) {
    // 全因子が完全同値という理論上のみのケース。先頭×末尾にフォールバックする
    maxF = FACTORS[0];
    minF = FACTORS[FACTORS.length - 1];
  }
  const found = catchphraseData.catchphrases.find(c => c.highest === maxF && c.lowest === minF);
  return found ? found.text : '名もなき転生者';
}

function bandFor(userScore, charScore) {
  const d = userScore - charScore;
  if (d > 0.75) return 'higher';
  if (d < -0.75) return 'lower';
  return 'same';
}

function rankFor(score, rankTable) {
  for (const r of rankTable) {
    if (score >= r.min) return r.rank;
  }
  return rankTable[rankTable.length - 1].rank;
}

// ==================== 結果の共有URL ====================
function encodeResult(scores, specialKey) {
  const parts = FACTORS.map(f => scores[f].toFixed(1));
  const params = new URLSearchParams();
  params.set('s', parts.join('-'));
  if (specialKey) params.set('sp', specialKey);
  return params.toString();
}

function decodeResult(search) {
  const params = new URLSearchParams(search);
  const s = params.get('s');
  if (!s) return null;
  const nums = s.split('-').map(Number);
  if (nums.length !== FACTORS.length || nums.some(n => Number.isNaN(n))) return null;
  const scores = {};
  FACTORS.forEach((f, i) => { scores[f] = Math.max(1, Math.min(7, nums[i])); });
  return { scores, special: params.get('sp') || null };
}
