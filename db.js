const DB_LISTS_KEY = 'spellingQuest_wordLists';
const DB_MOB_KEY   = 'spellingQuest_mobIndex';

function _loadLists() {
  try {
    return JSON.parse(localStorage.getItem(DB_LISTS_KEY)) || [];
  } catch {
    return [];
  }
}

function _saveLists(lists) {
  localStorage.setItem(DB_LISTS_KEY, JSON.stringify(lists));
}

// Save a new word list. Returns the saved entry.
// If a list with the exact same words already exists, returns it without creating a duplicate.
function saveWordList(label, words) {
  const cleaned = words.map(w => w.trim().toLowerCase()).filter(Boolean);
  const key     = [...cleaned].sort().join('|');
  const lists   = _loadLists();

  const existing = lists.find(l => [...l.words].sort().join('|') === key);
  if (existing) return existing;

  const entry = { id: Date.now(), label: label.trim(), words: cleaned, dateAdded: Date.now() };
  lists.unshift(entry);
  _saveLists(lists);
  return entry;
}

// Returns all saved word lists, newest first.
// Deduplicates by sorted word-set on every read and persists the fix.
function getAllWordLists() {
  const lists = _loadLists();
  const seen = new Set();
  const deduped = lists.filter(l => {
    const key = [...l.words].sort().join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (deduped.length !== lists.length) _saveLists(deduped);
  return deduped;
}

// Returns one word list by id, or null.
function getWordListById(id) {
  return _loadLists().find(l => l.id === id) || null;
}

// Deletes a word list by id.
function deleteWordList(id) {
  _saveLists(_loadLists().filter(l => l.id !== id));
}

// ── Reading module ────────────────────────────────────────────

const DB_PASSAGES_KEY = 'pixelScholar_passages';

function _loadPassages() {
  try {
    return JSON.parse(localStorage.getItem(DB_PASSAGES_KEY)) || [];
  } catch {
    return [];
  }
}

// Save a custom passage. Returns the saved entry.
function savePassageSet(passage) {
  const passages = _loadPassages();
  passages.unshift(passage);
  localStorage.setItem(DB_PASSAGES_KEY, JSON.stringify(passages));
  return passage;
}

// Returns all saved custom passages, newest first.
function getAllPassageSets() {
  return _loadPassages();
}

// Deletes a custom passage by id.
function deletePassageSet(id) {
  const remaining = _loadPassages().filter(p => p.id !== id);
  localStorage.setItem(DB_PASSAGES_KEY, JSON.stringify(remaining));
}

// ── Mob cycling ───────────────────────────────────────────────

// Returns the current mob index (0–5).
function getMobIndex() {
  return parseInt(localStorage.getItem(DB_MOB_KEY) || '0', 10);
}

// Advances mob index and wraps at 6. Returns the NEW index.
function incrementMobIndex() {
  const next = (getMobIndex() + 1) % 6;
  localStorage.setItem(DB_MOB_KEY, String(next));
  return next;
}
