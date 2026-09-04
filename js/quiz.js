// ==================== 診断回答画面（RPG会話形式） ====================
const Quiz = (() => {
  const STORAGE_KEY = 'isekai-shindan-quiz-v1';

  let questions, dialogue, onDone;
  let order = [], idx = 0, answers = new Map();
  let typeTimer = null;
  let charImgs = [];
  let activeCharIdx = 0;
  let bound = false;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function saveState() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ order, idx, answers: [...answers] }));
    } catch (e) { /* storage不可でも致命傷ではないので無視 */ }
  }

  function loadState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!Array.isArray(data.order) || typeof data.idx !== 'number' || !Array.isArray(data.answers)) return null;
      return data;
    } catch (e) { return null; }
  }

  function clearState() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
  }

  function init({ questionsData, dialogueData, onDone: cb }) {
    questions = questionsData;
    dialogue = dialogueData;
    onDone = cb;

    const saved = loadState();
    if (saved && saved.order.length === questions.items.length) {
      order = saved.order;
      idx = Math.min(saved.idx, order.length - 1);
      answers = new Map(saved.answers);
    } else {
      order = shuffle(questions.items.map(q => q.no));
      idx = 0;
      answers = new Map();
      saveState();
    }

    document.getElementById('quizProgressTotal').textContent = order.length;
    if (!bound) { bindEvents(); bound = true; }
    render();
  }

  function reset() {
    clearState();
    order = []; idx = 0; answers = new Map();
  }

  function bindEvents() {
    document.getElementById('stageBack').addEventListener('click', back);
    document.getElementById('btnDontKnow').addEventListener('click', () => handleSpecial('dontKnow'));
    document.getElementById('btnSkip').addEventListener('click', () => handleSpecial('skip'));
  }

  function currentNo() { return order[idx]; }
  function currentDialogue() { return dialogue.items.find(d => d.no === currentNo()); }

  function ensureCharImgs() {
    const box = document.getElementById('stageCharBox');
    if (box.children.length === 0) {
      for (let i = 0; i < 2; i++) {
        const img = document.createElement('img');
        img.className = 'stage-char';
        img.alt = '';
        box.appendChild(img);
        charImgs.push(img);
      }
    }
  }

  function setCharacter(imageKey) {
    ensureCharImgs();
    const nextIdx = 1 - activeCharIdx;
    const nextImg = charImgs[nextIdx];
    const curImg = charImgs[activeCharIdx];
    nextImg.onload = () => {
      nextImg.classList.add('show');
      curImg.classList.remove('show');
      activeCharIdx = nextIdx;
    };
    nextImg.src = `images/characters/${imageKey}.webp`;
  }

  function typeText(text) {
    clearInterval(typeTimer);
    const el = document.getElementById('dialogueText');
    let i = 0;
    el.textContent = '';
    function finish() {
      clearInterval(typeTimer);
      typeTimer = null;
      el.textContent = text;
    }
    el.onclick = finish;
    typeTimer = setInterval(() => {
      i++;
      el.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(typeTimer); typeTimer = null; }
    }, 26);
  }

  function updateMural() {
    const total = order.length;
    const completed = answers.size;
    const revealPct = total ? (completed / total) * 100 : 0;
    document.querySelector('.mural-reveal').style.clipPath = `inset(0 ${100 - revealPct}% 0 0)`;
    document.getElementById('quizProgressNum').textContent = completed;
  }

  function renderSlider(selectedRaw) {
    const dots = document.getElementById('sliderDots');
    dots.querySelectorAll('.slider-dot').forEach(d => d.remove());
    for (let v = 1; v <= 7; v++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider-dot' + (selectedRaw === v ? ' selected' : '');
      dot.setAttribute('aria-label', `${v} / 7`);
      dot.addEventListener('click', () => selectAnswer(v));
      dots.appendChild(dot);
    }
    const fillPct = selectedRaw ? ((selectedRaw - 1) / 6) * 100 : 0;
    document.getElementById('sliderFill').style.width = fillPct + '%';
  }

  function render() {
    const no = currentNo();
    const d = currentDialogue();
    document.getElementById('quizNo').textContent = idx + 1;
    document.getElementById('stageBack').disabled = idx === 0;
    setCharacter(d.speaker.imageKey);
    document.getElementById('dialogueName').textContent = d.speaker.name;
    typeText(d.dialogueLine);

    const existing = answers.get(no);
    renderSlider(existing && existing.type === 'answer' ? existing.raw : null);
    updateMural();
  }

  function selectAnswer(v) {
    const no = currentNo();
    answers.set(no, { type: 'answer', raw: v });
    renderSlider(v);
    saveState();
    updateMural();
    setTimeout(advance, 300);
  }

  function handleSpecial(type) {
    const no = currentNo();
    answers.set(no, { type });
    saveState();
    advance();
  }

  function advance() {
    if (idx < order.length - 1) {
      idx++;
      saveState();
      render();
    } else {
      const finalAnswers = new Map(answers);
      clearState();
      onDone(finalAnswers);
    }
  }

  function back() {
    if (idx > 0) {
      idx--;
      saveState();
      render();
    }
  }

  return { init, reset };
})();
