// ============================================================
//  Helpers
// ============================================================
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getWordsFromTextarea() {
  return document.getElementById('word-input').value
    .split('\n').map(w => w.trim().toLowerCase()).filter(Boolean);
}

// ============================================================
//  Screen navigation
// ============================================================
const SCREENS = ['parent-screen', 'game-screen', 'champion-screen', 'bonus-screen'];

function showScreen(id) {
  SCREENS.forEach(s =>
    document.getElementById(s).classList.toggle('hidden', s !== id)
  );
}

// ============================================================
//  History panel
// ============================================================
function renderHistory() {
  const lists = getAllWordLists();
  const el = document.getElementById('history-list');
  if (!lists.length) {
    el.innerHTML = '<p class="empty-state">No saved lists yet.<br>Enter your first word list above!</p>';
    return;
  }
  el.innerHTML = lists.map(l => `
    <div class="history-item">
      <div class="history-item-info">
        <span class="history-item-label">${escHtml(l.label)}</span>
        <span class="history-item-meta">
          ${l.words.length} word${l.words.length !== 1 ? 's' : ''}
          &middot; ${formatDate(l.dateAdded)}
        </span>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;">
        <button class="mc-button mc-button--small" onclick="loadList(${l.id})">Load</button>
        <button class="mc-button mc-button--small mc-button--red" onclick="deleteList(${l.id})">&#10005;</button>
      </div>
    </div>
  `).join('');
}

function deleteList(id) {
  deleteWordList(id);
  renderHistory();
}

function loadList(id) {
  const list = getWordListById(id);
  if (!list) return;
  document.getElementById('list-label').value = list.label;
  document.getElementById('word-input').value  = list.words.join('\n');
  updateStartBtn();
  document.getElementById('word-input').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ============================================================
//  Save / load word lists to/from a local JSON file
// ============================================================
function exportWordLists() {
  const lists = getAllWordLists();
  const json  = JSON.stringify({ version: 1, lists }, null, 2);
  const blob  = new Blob([json], { type: 'application/json' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href = url;
  a.download = 'spelling-quest-wordlists.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data     = JSON.parse(e.target.result);
      const incoming = Array.isArray(data) ? data : (data.lists || []);
      const existing = getAllWordLists();
      const ids      = new Set(existing.map(l => l.id));
      const toAdd    = incoming.filter(l => !ids.has(l.id));
      const merged   = [...toAdd, ...existing];
      localStorage.setItem('spellingQuest_wordLists', JSON.stringify(merged));
      renderHistory();
      showImportStatus(`Loaded ${toAdd.length} list${toAdd.length !== 1 ? 's' : ''}!`);
    } catch {
      showImportStatus('Could not read that file.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function showImportStatus(msg) {
  const el = document.getElementById('import-status');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

// ============================================================
//  Game state
// ============================================================
let gs = {
  words: [], wordIndex: 0, attempts: 0, correctCount: 0, wrongWords: [], results: [],
};

let selectedDifficulty = 'easy';
let typedLetters       = [];
let awaitingInput      = false;

// ============================================================
//  Parent screen
// ============================================================
function updateStartBtn() {
  document.getElementById('start-btn').disabled = getWordsFromTextarea().length === 0;
}

function collapseNewList() {
  document.getElementById('new-list-body').classList.add('hidden');
  document.getElementById('new-list-arrow').innerHTML = '&#9654;';
}

function expandNewList() {
  document.getElementById('new-list-body').classList.remove('hidden');
  document.getElementById('new-list-arrow').innerHTML = '&#9660;';
}

function toggleNewList() {
  const hidden = document.getElementById('new-list-body').classList.contains('hidden');
  if (hidden) expandNewList(); else collapseNewList();
}

function startQuest() {
  const words = getWordsFromTextarea();
  if (!words.length) return;
  const label = document.getElementById('list-label').value.trim() || 'Untitled';
  saveWordList(label, words);
  renderHistory();
  collapseNewList();
  gs = { words, wordIndex: 0, attempts: 0, correctCount: 0, wrongWords: [], results: [], currentWrongAttempts: [] };
  showScreen('game-screen');
  ambientMobs.start();
  updateProgress();
  nextWord();
}

// ============================================================
//  Progress row (checks and X's)
// ============================================================
function updateProgress() {
  const row = document.getElementById('progress-row');
  if (!row) return;
  row.innerHTML = gs.words.map((_, i) => {
    if (i < gs.results.length) {
      const r = gs.results[i];
      return `<div class="progress-pip progress-pip--${r}">${r === 'correct' ? '&#10003;' : '&#10007;'}</div>`;
    }
    return `<div class="progress-pip progress-pip--pending"></div>`;
  }).join('');
}

// ============================================================
//  Game loop — fill-blank only, difficulty-driven
// ============================================================
function nextWord() {
  if (gs.wordIndex >= gs.words.length) { endSession(); return; }
  gs.attempts             = 0;
  gs.currentWrongAttempts = [];
  typedLetters            = [];
  awaitingInput           = true;
  hideFeedback();
  renderWord();
}

function renderWord() {
  const word = gs.words[gs.wordIndex];
  const area = document.getElementById('game-area');
  area.innerHTML = '';
  typedLetters  = [];
  awaitingInput = true;

  const { displayRow } = blankWord(word, selectedDifficulty);
  const isExtreme      = selectedDifficulty === 'extreme';

  // Extreme has no visual hint — always speak the word
  if (isExtreme) speech.speakWord(word);
  else           speech.speak(word);

  const badge  = {
    easy:    '&#127823; Easy',
    medium:  '&#128337; Medium',
    hard:    '&#128293; Hard',
    extreme: '&#9889; Extreme',
  }[selectedDifficulty];

  const prompt = isExtreme
    ? 'Listen carefully and spell the word!'
    : 'Fill in the missing letters!';

  area.innerHTML = `
    <p class="mechanic-badge difficulty-${selectedDifficulty}">${badge}</p>
    <p class="word-prompt">${prompt}</p>
    <div class="fill-blank-display">
      <div class="word-display-row">${displayRow}</div>
      ${letterSlotsHtml(word.length)}
    </div>
    ${attemptsHtml()}
    ${misspellingHistoryHtml()}
    <button class="mc-button speak-btn" onclick="speech.speakWord('${word}')">
      &#128266; Hear the Word Again
    </button>
  `;
  updateLetterSlots();
  focusKbInput();
}

// ============================================================
//  Blank-word — difficulty-aware
// ============================================================
function blankWord(word, difficulty) {
  const chars = word.split('');
  const len   = chars.length;

  if (difficulty === 'extreme') {
    // All blanks — word spoken aloud provides the only hint
    return {
      displayRow: chars.map(() => `<div class="word-char hint-blank">_</div>`).join(''),
    };
  }

  if (difficulty === 'hard') {
    // Show only the first 1–2 letters; blank everything else
    const show = len <= 5 ? 1 : 2;
    return {
      displayRow: chars.map((ch, i) =>
        i < show
          ? `<div class="word-char">${escHtml(ch.toUpperCase())}</div>`
          : `<div class="word-char hint-blank">_</div>`
      ).join(''),
    };
  }

  // Easy: always 1 blank. Medium: 2 (short words) or 3 (longer words).
  const blankCount = difficulty === 'easy' ? 1 : (len <= 4 ? 2 : 3);

  // Pick random positions, never the first letter
  const blanks = new Set();
  const pool   = chars.map((_, i) => i).filter(i => i > 0);
  const count  = Math.min(blankCount, pool.length);
  while (blanks.size < count && pool.length) {
    const idx = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    blanks.add(idx);
  }

  return {
    displayRow: chars.map((ch, i) =>
      blanks.has(i)
        ? `<div class="word-char hint-blank">_</div>`
        : `<div class="word-char">${escHtml(ch.toUpperCase())}</div>`
    ).join(''),
  };
}

// ============================================================
//  Letter-slot input system
// ============================================================
function letterSlotsHtml(length) {
  const slots = Array.from({ length }, () => `<div class="letter-slot"></div>`).join('');
  return `<div class="letter-slots" id="letter-slots">${slots}</div>`;
}

function updateLetterSlots() {
  const container = document.getElementById('letter-slots');
  if (!container) return;
  container.querySelectorAll('.letter-slot').forEach((slot, i) => {
    slot.textContent = typedLetters[i] ? typedLetters[i].toUpperCase() : '';
    slot.classList.toggle('slot-filled', i < typedLetters.length);
    slot.classList.toggle('slot-active', i === typedLetters.length);
  });
}

function addLetter(ch) {
  if (!awaitingInput) return;
  if (typedLetters.length >= gs.words[gs.wordIndex].length) return;
  typedLetters.push(ch);
  updateLetterSlots();
}

function removeLetter() {
  if (!awaitingInput) return;
  typedLetters.pop();
  updateLetterSlots();
}

// ============================================================
//  Attempt pips
// ============================================================
function attemptsHtml() {
  const pips = Array.from({ length: 3 }, (_, i) =>
    `<div class="attempt-pip${i >= (3 - gs.attempts) ? ' used' : ''}"></div>`
  ).join('');
  return `<div class="attempts-wrap">${pips}</div>`;
}

function misspellingHistoryHtml() {
  if (!gs.currentWrongAttempts.length) return '';
  const items = gs.currentWrongAttempts.map(a =>
    `<span class="misspell-item">${escHtml(a)}</span>`
  ).join('');
  return `<div class="misspell-history">${items}</div>`;
}

// ============================================================
//  Answer checking
// ============================================================
function checkAnswer() {
  if (!awaitingInput || typedLetters.length === 0) return;
  awaitingInput = false;
  const answer = typedLetters.join('').toLowerCase();
  const word   = gs.words[gs.wordIndex];
  if (answer === word) handleCorrect();
  else                 handleWrong();
}

function handleCorrect() {
  gs.correctCount++;
  gs.results.push('correct');
  gs.wordIndex++;
  updateProgress();
  rewards.triggerBlockBurst();
  showFeedback('correct', '&#10003; Correct!', () => nextWord());
}

function handleWrong() {
  gs.currentWrongAttempts.push(typedLetters.join('').toUpperCase());
  gs.attempts++;
  if (gs.attempts >= 3) {
    awaitingInput = false;
    const word = gs.words[gs.wordIndex];
    gs.wrongWords.push(word);
    gs.results.push('wrong');
    gs.wordIndex++;
    updateProgress();
    speech.speak('The word was ' + word);
    showFeedback('reveal', 'The word was:<br>' + word.toUpperCase(), () => nextWord());
  } else {
    awaitingInput = false;
    renderWord();           // re-render resets slots + pips
    awaitingInput = false;  // lock during "try again" flash
    showFeedback('wrong', '&#10007; Try again!', () => {
      hideFeedback();
      awaitingInput = true;
      focusKbInput();
    });
  }
}

// ============================================================
//  Feedback overlay
// ============================================================
function showFeedback(type, html, onDone) {
  const el  = document.getElementById('word-feedback');
  const cls = type === 'correct' ? 'feedback-correct'
            : type === 'reveal'  ? 'feedback-reveal'
            :                      'feedback-wrong';
  el.innerHTML = `<span class="${cls}">${html}</span>`;
  el.classList.remove('hidden', 'word-feedback--reveal');
  if (type === 'reveal') el.classList.add('word-feedback--reveal');
  setTimeout(() => {
    el.classList.add('hidden');
    el.classList.remove('word-feedback--reveal');
    onDone();
  }, type === 'reveal' ? 4500 : 1100);
}

function hideFeedback() {
  const el = document.getElementById('word-feedback');
  el.classList.add('hidden');
  el.classList.remove('word-feedback--reveal');
  el.innerHTML = '';
}

// ============================================================
//  Session end
// ============================================================
function endSession() {
  awaitingInput = false;
  const mobIndex = getMobIndex();
  incrementMobIndex();
  const missed   = gs.wrongWords;
  const perfect  = missed.length === 0;

  document.getElementById('champion-title').textContent    = perfect ? 'YOU DID IT!' : 'NICE TRY!';
  document.getElementById('champion-subtitle').textContent = perfect ? 'Spelling Champion!' : 'Keep Practicing!';
  document.getElementById('champion-score').innerHTML =
    `${gs.correctCount} out of ${gs.words.length} words correct!` +
    (missed.length
      ? `<br><br>Practice these:<br>${missed.map(w => w.toUpperCase()).join(', ')}`
      : '<br><br>Perfect score! BONUS ROUND unlocked!');
  document.getElementById('bonus-btn').classList.toggle('hidden', !perfect);
  document.getElementById('play-again-btn').classList.toggle('hidden', perfect);
  ambientMobs.stop();
  rewards.revealMob(mobIndex);
  showScreen('champion-screen');
}

// ============================================================
//  iOS keyboard helper
// ============================================================
function focusKbInput() {
  const el = document.getElementById('kb-input');
  if (el) el.focus();
}

// ============================================================
//  Global keyboard capture
// ============================================================
document.addEventListener('keydown', e => {
  if (document.getElementById('game-screen').classList.contains('hidden')) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    checkAnswer();
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    removeLetter();
  } else if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
    e.preventDefault();
    addLetter(e.key.toLowerCase());
  }
  const kbi = document.getElementById('kb-input');
  if (kbi) kbi.value = '';
});


// ============================================================
//  Boot
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  renderHistory();
  updateStartBtn();
  if (getAllWordLists().length > 0) collapseNewList();

  document.getElementById('word-input').addEventListener('input', updateStartBtn);
  document.getElementById('start-btn').addEventListener('click', startQuest);
  document.getElementById('game-screen').addEventListener('touchstart', () => {
    if (awaitingInput) focusKbInput();
  }, { passive: true });
  document.getElementById('quit-btn').addEventListener('click', () => {
    awaitingInput = false;
    ambientMobs.stop();
    showScreen('parent-screen');
  });

  // Difficulty toggle buttons
  document.querySelectorAll('[data-difficulty]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-difficulty]').forEach(b => b.classList.remove('mc-toggle--active'));
      btn.classList.add('mc-toggle--active');
      selectedDifficulty = btn.dataset.difficulty;
    });
  });

  // Voice toggle buttons
  document.querySelectorAll('[data-voice]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-voice]').forEach(b => b.classList.remove('mc-toggle--active'));
      btn.classList.add('mc-toggle--active');
      speech.setVoicePreference(btn.dataset.voice);
    });
  });

  document.getElementById('bonus-btn').addEventListener('click', () => {
    showScreen('bonus-screen');
    bonus.startGame(() => {
      document.getElementById('bonus-home-btn').classList.remove('hidden');
    });
  });

  const bonusHomeBtn = document.getElementById('bonus-home-btn');
  function onBonusHome() {
    bonusHomeBtn.classList.add('hidden');
    bonus.stopGame();
    showScreen('parent-screen');
  }
  bonusHomeBtn.addEventListener('click',    onBonusHome);
  bonusHomeBtn.addEventListener('touchend', (e) => { e.preventDefault(); onBonusHome(); });

  document.getElementById('export-btn').addEventListener('click', exportWordLists);
  document.getElementById('import-file').addEventListener('change', handleImportFile);

  document.getElementById('play-again-btn').addEventListener('click', () => {
    awaitingInput = false;
    showScreen('parent-screen');
  });

  document.getElementById('change-words-btn').addEventListener('click', () => {
    awaitingInput = false;
    showScreen('parent-screen');
  });
});
