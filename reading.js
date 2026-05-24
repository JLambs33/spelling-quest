// reading.js — Reading module IIFE
// Depends on: db.js (savePassageSet, getAllPassageSets, deletePassageSet, getMobIndex, incrementMobIndex)
//             speech.js (speech.speak)
//             rewards.js (rewards.triggerBlockBurst, rewards.revealMob)
//             game.js (showScreen, showFeedback, escHtml, currentModule)
//             reading-data.js (READING_LIBRARY)

const readingGame = (() => {

  // ── state ─────────────────────────────────────────────────────
  let selectedPassage = null;
  let qBlockUid = 0;

  let rs = {
    passage: null,
    questionIndex: 0,
    correctCount: 0,
    totalQuestions: 0,
    wrongQuestions: [],
    results: [],
  };

  // ── helpers ───────────────────────────────────────────────────

  function shuffleOptions(options, correctIdx) {
    const correctText = options[correctIdx];
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    return { options: shuffled, correctIndex: shuffled.indexOf(correctText) };
  }

  function typeBadge(type) {
    return { adventure: 'Adventure', lore: 'Lore', howto: 'How-To', sightword: 'Sight Words' }[type] || 'Custom';
  }

  // ── setup screen ──────────────────────────────────────────────

  function renderPassageList() {
    const level     = document.getElementById('reading-level-select').value;
    const container = document.getElementById('reading-passage-list');

    const builtIn = READING_LIBRARY.filter(p => p.level === level).map(p => ({ ...p, isBuiltIn: true }));
    const custom  = getAllPassageSets().filter(p => p.level === level).map(p => ({ ...p, isBuiltIn: false }));
    const all     = [...builtIn, ...custom];

    if (!all.length) {
      container.innerHTML = '<p class="empty-state">No passages at this level yet.</p>';
      document.getElementById('reading-start-btn').disabled = true;
      selectedPassage = null;
      return;
    }

    container.innerHTML = all.map(p => {
      const wc        = p.text.trim().split(/\s+/).length;
      const qc        = p.questions.length;
      const isSelected = selectedPassage && String(selectedPassage.id) === String(p.id);
      return `
        <div class="passage-list-item${isSelected ? ' passage-list-item--selected' : ''}"
             data-id="${escHtml(String(p.id))}" data-builtin="${p.isBuiltIn ? '1' : '0'}">
          <div class="passage-list-info">
            <span class="passage-list-title">${escHtml(p.title)}</span>
            <span class="passage-list-meta">
              <span class="passage-type-badge">${escHtml(typeBadge(p.type))}</span>
              &nbsp;${wc} words &middot; ${qc} question${qc !== 1 ? 's' : ''}
            </span>
          </div>
        </div>`;
    }).join('');
  }

  function selectPassage(id, isBuiltIn) {
    if (isBuiltIn) {
      selectedPassage = READING_LIBRARY.find(p => String(p.id) === String(id)) || null;
    } else {
      selectedPassage = getAllPassageSets().find(p => String(p.id) === String(id)) || null;
    }
    document.getElementById('reading-start-btn').disabled = !selectedPassage;
    renderPassageList();
  }

  function toggleNewPassage() {
    const body   = document.getElementById('new-passage-body');
    const arrow  = document.getElementById('new-passage-arrow');
    const hidden = body.classList.contains('hidden');
    body.classList.toggle('hidden', !hidden);
    arrow.innerHTML = hidden ? '&#9660;' : '&#9654;';
  }

  function questionBlockHtml(uid) {
    return `
      <div class="passage-question-block" data-uid="${uid}">
        <div class="passage-question-block-header">
          <span class="mc-label question-num-label"></span>
          <button class="mc-button mc-button--small mc-button--red remove-question-btn hidden"
                  data-uid="${uid}">&#10005;</button>
        </div>
        <input class="mc-input passage-q-input" type="text" maxlength="120"
               placeholder="What is the passage about?">
        <label class="mc-label">Answer Choices
          <span class="label-hint">(one per line &mdash; first = correct)</span>
        </label>
        <textarea class="mc-textarea passage-options-input" rows="4"
                  placeholder="correct answer&#10;wrong choice 2&#10;wrong choice 3&#10;wrong choice 4"></textarea>
      </div>`;
  }

  function updateQuestionLabels() {
    const blocks = document.querySelectorAll('#passage-questions-container .passage-question-block');
    const multi  = blocks.length > 1;
    blocks.forEach((b, i) => {
      b.querySelector('.question-num-label').textContent = multi ? `Question ${i + 1}` : 'Comprehension Question';
      b.querySelector('.remove-question-btn').classList.toggle('hidden', !multi);
    });
  }

  function addQuestionBlock() {
    document.getElementById('passage-questions-container')
      .insertAdjacentHTML('beforeend', questionBlockHtml(++qBlockUid));
    updateQuestionLabels();
  }

  function resetQuestionBlocks() {
    document.getElementById('passage-questions-container').innerHTML = '';
    addQuestionBlock();
  }

  function saveCustomPassage() {
    const title = document.getElementById('passage-title-input').value.trim();
    const text  = document.getElementById('passage-text-input').value.trim();
    const level = document.getElementById('reading-level-select').value;

    if (!title || !text) {
      alert('Please fill in the title and passage text.');
      return;
    }

    const blocks = document.querySelectorAll('#passage-questions-container .passage-question-block');
    const questions = [];
    for (const block of blocks) {
      const qText = block.querySelector('.passage-q-input').value.trim();
      const opts  = block.querySelector('.passage-options-input').value
                      .split('\n').map(l => l.trim()).filter(Boolean);
      if (!qText || opts.length < 2) {
        alert('Each question needs question text and at least 2 answer choices.');
        return;
      }
      while (opts.length < 4) opts.push('—');
      questions.push({ q: qText, options: opts.slice(0, 4), correct: 0 });
    }

    const entry = {
      id: Date.now(),
      level,
      type: 'custom',
      title,
      text,
      questions,
      dateAdded: Date.now(),
    };

    savePassageSet(entry);

    document.getElementById('passage-title-input').value = '';
    document.getElementById('passage-text-input').value  = '';
    resetQuestionBlocks();

    document.getElementById('new-passage-body').classList.add('hidden');
    document.getElementById('new-passage-arrow').innerHTML = '&#9654;';

    renderPassageList();
    renderReadingHistory();
  }

  function renderReadingHistory() {
    const el     = document.getElementById('reading-history-list');
    const custom = getAllPassageSets();
    if (!custom.length) {
      el.innerHTML = '<p class="empty-state">No saved passages yet.</p>';
      return;
    }
    el.innerHTML = custom.map(p => `
      <div class="history-item">
        <div class="history-item-info">
          <span class="history-item-label">${escHtml(p.title)}</span>
          <span class="history-item-meta">${escHtml(p.level)} &middot; ${p.text.trim().split(/\s+/).length} words</span>
        </div>
        <button class="mc-button mc-button--small mc-button--red"
                onclick="readingGame.deleteCustomPassage(${p.id})">&#10005;</button>
      </div>`).join('');
  }

  function deleteCustomPassage(id) {
    deletePassageSet(id);
    if (selectedPassage && String(selectedPassage.id) === String(id)) {
      selectedPassage = null;
      document.getElementById('reading-start-btn').disabled = true;
    }
    renderPassageList();
    renderReadingHistory();
  }

  function startSession() {
    if (!selectedPassage) return;

    rs = {
      passage: selectedPassage,
      questionIndex: 0,
      correctCount: 0,
      totalQuestions: selectedPassage.questions.length,
      wrongQuestions: [],
      results: [],
    };

    currentModule = 'reading';

    document.getElementById('change-words-btn').innerHTML = '&#8592; Change Passage';

    showScreen('reading-game-screen');
    ambientMobs.start('reading-mob-canvas');
    updateProgress();
    renderPassageView();
  }

  // ── game screen ───────────────────────────────────────────────

  function renderPassageView() {
    document.getElementById('reading-passage-title').textContent = rs.passage.title;

    const tokens = rs.passage.text.trim().split(/\s+/);
    document.getElementById('reading-word-tokens').innerHTML = tokens.map(token => {
      const word = token.replace(/[^a-zA-Z']/g, '');
      return `<button class="word-token" data-word="${escHtml(word)}">${escHtml(token)}</button>`;
    }).join(' ');

    document.getElementById('reading-passage-area').classList.remove('hidden');
    document.getElementById('reading-question-area').classList.add('hidden');
  }

  function onDoneReading() {
    document.getElementById('reading-passage-area').classList.add('hidden');
    document.getElementById('reading-question-area').classList.remove('hidden');
    showQuestion();
  }

  function showQuestion() {
    const q = rs.passage.questions[rs.questionIndex];
    if (!q) { endSession(); return; }

    const { options, correctIndex } = shuffleOptions(q.options, q.correct);

    const qTokens = q.q.trim().split(/\s+/);
    document.getElementById('reading-question-text').innerHTML = qTokens.map(token => {
      const word = token.replace(/[^a-zA-Z']/g, '');
      return `<button class="word-token" data-word="${escHtml(word)}">${escHtml(token)}</button>`;
    }).join(' ');

    document.getElementById('reading-options').innerHTML = options.map((opt, i) =>
      `<button class="reading-option" data-index="${i}" data-correct="${correctIndex}">${escHtml(opt)}</button>`
    ).join('');
  }

  function handleAnswer(selectedIndex, correctIndex) {
    const isCorrect = selectedIndex === correctIndex;
    const optBtns   = document.querySelectorAll('.reading-option');

    optBtns.forEach(btn => btn.disabled = true);
    optBtns[correctIndex].classList.add('reading-option--correct');

    if (isCorrect) {
      rs.correctCount++;
      rs.results.push('correct');
      rewards.triggerBlockBurst();
      showFeedback('correct', '&#10003; Correct!', advanceQuestion);
    } else {
      optBtns[selectedIndex].classList.add('reading-option--wrong');
      rs.wrongQuestions.push(rs.passage.questions[rs.questionIndex].q);
      rs.results.push('wrong');
      showFeedback('wrong', '&#10007; Not quite!', advanceQuestion);
    }

    updateProgress();
  }

  function advanceQuestion() {
    rs.questionIndex++;
    if (rs.questionIndex >= rs.passage.questions.length) {
      endSession();
    } else {
      showQuestion();
    }
  }

  function updateProgress() {
    const row = document.getElementById('reading-progress-row');
    if (!row) return;
    row.innerHTML = Array.from({ length: rs.totalQuestions }, (_, i) => {
      if (i < rs.results.length) {
        const r = rs.results[i];
        return `<div class="progress-pip progress-pip--${r}">${r === 'correct' ? '&#10003;' : '&#10007;'}</div>`;
      }
      return `<div class="progress-pip progress-pip--pending"></div>`;
    }).join('');
  }

  function endSession() {
    ambientMobs.stop();
    const perfect   = rs.wrongQuestions.length === 0;
    const mobIndex  = getMobIndex();
    incrementMobIndex();

    document.getElementById('champion-title').textContent    = perfect ? 'YOU DID IT!' : 'NICE TRY!';
    document.getElementById('champion-subtitle').textContent = perfect ? 'Reading Champion!' : 'Keep Reading!';
    document.getElementById('champion-score').innerHTML =
      `${rs.correctCount} out of ${rs.totalQuestions} questions correct!` +
      (rs.wrongQuestions.length
        ? '<br><br>Review these:<br>' + rs.wrongQuestions.map(q => escHtml(q)).join('<br>')
        : '<br><br>Perfect score! BONUS ROUND unlocked!');

    document.getElementById('bonus-btn').classList.toggle('hidden', !perfect);
    document.getElementById('play-again-btn').classList.toggle('hidden', perfect);

    rewards.revealMob(mobIndex);
    showScreen('champion-screen');
  }

  // ── init ──────────────────────────────────────────────────────

  function init() {
    document.getElementById('reading-level-select').addEventListener('change', () => {
      selectedPassage = null;
      document.getElementById('reading-start-btn').disabled = true;
      renderPassageList();
    });

    document.getElementById('reading-start-btn').addEventListener('click', startSession);

    document.getElementById('reading-passage-list').addEventListener('click', e => {
      const item = e.target.closest('.passage-list-item');
      if (!item) return;
      selectPassage(item.dataset.id, item.dataset.builtin === '1');
    });

    addQuestionBlock();

    document.getElementById('add-question-btn').addEventListener('click', addQuestionBlock);

    document.getElementById('passage-questions-container').addEventListener('click', e => {
      const btn = e.target.closest('.remove-question-btn');
      if (!btn) return;
      btn.closest('.passage-question-block').remove();
      updateQuestionLabels();
    });

    document.getElementById('save-passage-btn').addEventListener('click', saveCustomPassage);

    // Tap-to-hear — event delegation on token container
    document.getElementById('reading-word-tokens').addEventListener('click', e => {
      const btn = e.target.closest('.word-token');
      if (btn && btn.dataset.word) speech.speak(btn.dataset.word);
    });

    document.getElementById('done-reading-btn').addEventListener('click', onDoneReading);

    // Answer selection — event delegation on options container
    document.getElementById('reading-options').addEventListener('click', e => {
      const btn = e.target.closest('.reading-option');
      if (!btn || btn.disabled) return;
      handleAnswer(parseInt(btn.dataset.index, 10), parseInt(btn.dataset.correct, 10));
    });

    // Tap-to-hear words in question text
    document.getElementById('reading-question-text').addEventListener('click', e => {
      const btn = e.target.closest('.word-token');
      if (btn && btn.dataset.word) speech.speak(btn.dataset.word);
    });

    document.getElementById('reading-quit-btn').addEventListener('click', () => {
      ambientMobs.stop();
      showScreen('reading-screen');
    });

    renderPassageList();
    renderReadingHistory();
  }

  return { init, toggleNewPassage, deleteCustomPassage };

})();

document.addEventListener('DOMContentLoaded', () => readingGame.init());
