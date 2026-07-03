/* ═══════════════════════════════════════════════════════════
   NBA MYSTERY PLAYER — Game Logic
   ═══════════════════════════════════════════════════════════ */

// ── Constants ──────────────────────────────────────────────
const MAX_GUESSES = 8;
const STORAGE_KEY = 'nbaMysteryPlayer';
const COLUMNS = ['Team', 'Conf', 'Div', 'Pos', 'Ht', 'Age', '#'];

// ── Mode ───────────────────────────────────────────────────
let PLAYERS = PLAYERS_CURRENT;
let currentMode = 'current'; // 'current' | '2013'

function switchMode(mode) {
  if (mode === currentMode) return;
  currentMode = mode;
  PLAYERS = mode === '2013' ? PLAYERS_2013 : PLAYERS_CURRENT;

  // Toggle body class for theming
  document.body.classList.toggle('mode--2013', mode === '2013');

  // Update subtitle
  const subtitle = document.querySelector('.header__subtitle');
  if (subtitle) {
    subtitle.textContent = mode === '2013'
      ? '2012-13 Season · 吾皇登基'
      : 'Current Season · 群雄逐鹿';
  }

  // Toggle active button
  document.getElementById('modeCurrent')?.classList.toggle('mode-tab--active', mode === 'current');
  document.getElementById('mode2013')?.classList.toggle('mode-tab--active', mode === '2013');

  resetGame();
  console.log(`Switched to ${mode === '2013' ? '👑 吾皇登基 (2012-13)' : '🗽 群雄逐鹿 (current)'}`);
}

// ── State ──────────────────────────────────────────────────
let mysteryPlayer = null;
let guesses = [];
let gameOver = false;

// ── DOM Refs ───────────────────────────────────────────────
const dom = {
  searchInput: null,
  searchDropdown: null,
  guessBody: null,
  remainingEl: null,
  silhouetteBtn: null,
  silhouetteImg: null,
  silhouetteWrap: null,
  overlay: null,
  toast: null,
};

// ── Random Selection ───────────────────────────────────────
function getRandomIndex() {
  return Math.floor(Math.random() * PLAYERS.length);
}

// ── Init ───────────────────────────────────────────────────
function initGame() {
  cacheDom();
  loadState();

  if (!mysteryPlayer) {
    const idx = getRandomIndex();
    mysteryPlayer = PLAYERS[idx];
    guesses = [];
    gameOver = false;
    saveState();
    clearTable();
    updateRemaining();
  }

  renderExistingGuesses();
  updateRemaining();
  bindEvents();

  if (gameOver) {
    dom.searchInput.disabled = true;
    dom.searchInput.placeholder = 'Game over';
  }

  console.log(`Mystery player: ${mysteryPlayer.name} (#${mysteryPlayer.id})`);

  // Preload silhouette image in background
  preloadSilhouette();
}

function cacheDom() {
  dom.searchInput = document.getElementById('searchInput');
  dom.searchDropdown = document.getElementById('searchDropdown');
  dom.guessBody = document.getElementById('guessBody');
  dom.remainingEl = document.getElementById('remaining');
  dom.silhouetteBtn = document.getElementById('silhouetteBtn');
  dom.silhouetteImg = document.getElementById('silhouetteImg');
  dom.silhouetteWrap = document.getElementById('silhouetteWrap');
  dom.overlay = document.getElementById('overlay');
  dom.toast = document.getElementById('toast');
}

// ── State Persistence ──────────────────────────────────────
function saveState() {
  const state = {
    date: new Date().toISOString().slice(0, 10),
    mysteryId: mysteryPlayer ? mysteryPlayer.id : null,
    guesses: guesses,
    gameOver: gameOver,
    mode: currentMode,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem(STORAGE_KEY + '_date', state.date);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const state = JSON.parse(raw);
      guesses = state.guesses || [];
      gameOver = state.gameOver || false;
      currentMode = state.mode || 'current';
      PLAYERS = currentMode === '2013' ? PLAYERS_2013 : PLAYERS_CURRENT;

      // Restore mode UI
      document.body.classList.toggle('mode--2013', currentMode === '2013');
      document.getElementById('modeCurrent')?.classList.toggle('mode-tab--active', currentMode === 'current');
      document.getElementById('mode2013')?.classList.toggle('mode-tab--active', currentMode === '2013');

      if (state.mysteryId !== null && state.mysteryId !== undefined) {
        mysteryPlayer = PLAYERS.find(p => p.id === state.mysteryId) || null;
      }
    }
  } catch (e) {
    guesses = [];
    gameOver = false;
  }
}

// ── Search / Autocomplete ──────────────────────────────────
let activeIndex = -1;
let searchResults = [];

function bindEvents() {
  dom.searchInput.addEventListener('input', onSearchInput);
  dom.searchInput.addEventListener('keydown', onSearchKeydown);
  dom.searchInput.addEventListener('focus', onSearchInput);
  document.addEventListener('click', onDocumentClick);
  dom.silhouetteBtn.addEventListener('click', toggleSilhouette);
  document.getElementById('newGameBtn').addEventListener('click', resetGame);

  // Mode tabs
  document.getElementById('modeCurrent')?.addEventListener('click', () => switchMode('current'));
  document.getElementById('mode2013')?.addEventListener('click', () => switchMode('2013'));

  // Overlay buttons
  document.getElementById('shareBtn').addEventListener('click', copyShare);
  document.getElementById('playAgainBtn')?.addEventListener('click', resetGame);
}

function onSearchInput() {
  const query = dom.searchInput.value.trim().toLowerCase();
  activeIndex = -1;

  if (!query) {
    dom.searchDropdown.classList.remove('search__dropdown--open');
    searchResults = [];
    return;
  }

  // Filter players by name substring (case-insensitive, accent-insensitive)
  searchResults = PLAYERS
    .filter(p => normalizeStr(p.name).includes(normalizeStr(query)))
    .slice(0, 8);

  renderDropdown(searchResults);
}

function renderDropdown(results) {
  dom.searchDropdown.innerHTML = '';

  if (results.length === 0) {
    dom.searchDropdown.innerHTML =
      '<div class="search__no-results">No players found</div>';
  } else {
    results.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'search__item';
      div.innerHTML = `<span>${escapeHtml(p.name)}</span>
        <span class="search__item-team">${p.team} ${p.pos.join('-')}</span>`;
      div.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectPlayer(p);
      });
      dom.searchDropdown.appendChild(div);
    });
  }

  dom.searchDropdown.classList.add('search__dropdown--open');
}

function onSearchKeydown(e) {
  const items = dom.searchDropdown.querySelectorAll('.search__item');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex = Math.min(activeIndex + 1, items.length - 1);
    updateActiveItem(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex = Math.max(activeIndex - 1, 0);
    updateActiveItem(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (activeIndex >= 0 && searchResults[activeIndex]) {
      selectPlayer(searchResults[activeIndex]);
    }
  } else if (e.key === 'Escape') {
    dom.searchDropdown.classList.remove('search__dropdown--open');
    dom.searchInput.blur();
  }
}

function updateActiveItem(items) {
  items.forEach((item, i) => {
    item.classList.toggle('search__item--active', i === activeIndex);
  });
  if (activeIndex >= 0 && items[activeIndex]) {
    items[activeIndex].scrollIntoView({ block: 'nearest' });
  }
}

function onDocumentClick(e) {
  if (!dom.searchInput.contains(e.target) && !dom.searchDropdown.contains(e.target)) {
    dom.searchDropdown.classList.remove('search__dropdown--open');
  }
}

// ── Player Selection & Guessing ────────────────────────────
function selectPlayer(player) {
  if (gameOver) return;

  // Check duplicate
  if (guesses.some(g => g.id === player.id)) {
    showToast('Already guessed this player');
    return;
  }

  // Submit guess
  guesses.push(player);
  addGuessRow(player);

  dom.searchInput.value = '';
  dom.searchDropdown.classList.remove('search__dropdown--open');
  searchResults = [];
  activeIndex = -1;

  updateRemaining();
  saveState();

  // Check win
  if (player.id === mysteryPlayer.id) {
    endGame(true);
  } else if (guesses.length >= MAX_GUESSES) {
    endGame(false);
  }
}

// ── Comparison Engine ──────────────────────────────────────
function compareTeam(guess, answer) {
  if (guess.team === answer.team) return 'green';
  if (answer.formerTeams.includes(guess.team)) return 'yellow';
  return 'black';
}

function compareConf(guess, answer) {
  return guess.conf === answer.conf ? 'green' : 'black';
}

function compareDiv(guess, answer) {
  return guess.div === answer.div ? 'green' : 'black';
}

function comparePos(guess, answer) {
  const gSet = new Set(guess.pos);
  const aSet = new Set(answer.pos);
  if (gSet.size === aSet.size && [...gSet].every(x => aSet.has(x))) return 'green';
  if ([...gSet].some(x => aSet.has(x))) return 'yellow';
  return 'black';
}

function compareNumeric(guessVal, answerVal) {
  const diff = Math.abs(guessVal - answerVal);
  if (diff === 0) return { color: 'green', arrow: '' };
  if (diff <= 2) {
    const arrow = guessVal < answerVal ? '↑' : '↓';
    return { color: 'yellow', arrow };
  }
  const arrow = guessVal < answerVal ? '↑' : '↓';
  return { color: 'black', arrow };
}

function compareAll(guess, answer) {
  return {
    team: compareTeam(guess, answer),
    conf: compareConf(guess, answer),
    div: compareDiv(guess, answer),
    pos: comparePos(guess, answer),
    ht: compareNumeric(guess.htInches, answer.htInches),
    age: compareNumeric(guess.age, answer.age),
    jersey: compareJersey(guess.jersey, answer.jersey),
  };
}

function compareJersey(gJersey, aJersey) {
  // Normalize: "0", "00" → 0; non-numeric → -1
  const gNum = parseInt(gJersey, 10);
  const aNum = parseInt(aJersey, 10);
  const gIsNum = !isNaN(gNum);
  const aIsNum = !isNaN(aNum);

  // Both numeric: compare numerically
  if (gIsNum && aIsNum) {
    if (gNum === aNum) return { color: 'green', arrow: '' };
    const diff = Math.abs(gNum - aNum);
    if (diff <= 2) {
      return { color: 'yellow', arrow: gNum < aNum ? '↑' : '↓' };
    }
    return { color: 'black', arrow: gNum < aNum ? '↑' : '↓' };
  }

  // String comparison for non-numeric jerseys (e.g. "N/A")
  if (gJersey === aJersey) return { color: 'green', arrow: '' };
  return { color: 'black', arrow: '' };
}

// ── Render ─────────────────────────────────────────────────
function addGuessRow(player) {
  const result = compareAll(player, mysteryPlayer);
  const row = document.createElement('tr');
  row.className = 'guess-row';

  // Determine cell order matching headers
  const cells = [
    { key: 'team', display: player.team },
    { key: 'conf', display: player.conf },
    { key: 'div', display: player.div },
    { key: 'pos', display: player.pos.join('-') },
    { key: 'ht', display: player.ht },
    { key: 'age', display: String(player.age) },
    { key: 'jersey', display: player.jersey },
  ];

  cells.forEach(cell => {
    const td = document.createElement('td');
    const res = result[cell.key];

    if (cell.key === 'ht' || cell.key === 'age' || cell.key === 'jersey') {
      // Numeric columns: res is { color, arrow }
      td.className = `cell--${res.color}`;
      td.innerHTML = `${cell.display}<span class="cell-arrow">${res.arrow}</span>`;
    } else {
      // Text columns (team/conf/div/pos): res is a color string directly
      td.className = `cell--${res}`;
      td.textContent = cell.display;
    }
    row.appendChild(td);
  });

  dom.guessBody.appendChild(row);
}

function renderExistingGuesses() {
  dom.guessBody.innerHTML = '';
  guesses.forEach(g => addGuessRow(g));
}

function clearTable() {
  dom.guessBody.innerHTML = '';
}

function updateRemaining() {
  const remaining = MAX_GUESSES - guesses.length;
  dom.remainingEl.textContent = remaining;
  if (remaining <= 3) {
    dom.remainingEl.style.color = remaining <= 1 ? 'var(--danger)' : 'var(--yellow)';
  } else {
    dom.remainingEl.style.color = 'var(--text)';
  }
}

// ── Game End ───────────────────────────────────────────────
function endGame(won) {
  gameOver = true;
  saveState();
  dom.searchInput.disabled = true;
  dom.searchInput.placeholder = 'Game over';

  // Reveal player photo on win
  if (won) {
    revealPlayerImage();
  }

  setTimeout(() => {
    showOverlay(won);
  }, won ? 600 : 1000);
}

function revealPlayerImage() {
  if (mysteryPlayer && mysteryPlayer.nbaId) {
    dom.silhouetteImg.src = getHeadshotUrl(mysteryPlayer.nbaId);
    dom.silhouetteImg.onload = null;
    dom.silhouetteImg.onerror = null;
  }
  dom.silhouetteWrap.classList.add('silhouette__wrap--visible');
  dom.silhouetteImg.classList.add('silhouette__img--revealed');
  dom.silhouetteBtn.textContent = '🙈 Hide Silhouette';
}

function resetGame() {
  const idx = getRandomIndex();
  mysteryPlayer = PLAYERS[idx];
  guesses = [];
  gameOver = false;

  dom.searchInput.disabled = false;
  dom.searchInput.placeholder = '🔍  Type a player name...';
  dom.overlay.classList.remove('overlay--visible');

  // Reset silhouette
  dom.silhouetteWrap.classList.remove('silhouette__wrap--visible');
  dom.silhouetteImg.classList.remove('silhouette__img--revealed');
  dom.silhouetteImg.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  dom.silhouetteBtn.textContent = '👤 Reveal Silhouette';

  clearTable();
  updateRemaining();
  saveState();
  preloadSilhouette();

  console.log(`New mystery player: ${mysteryPlayer.name} (#${mysteryPlayer.id})`);
}

function showOverlay(won) {
  const titleEl = document.getElementById('overlayTitle');
  const subtitleEl = document.getElementById('overlaySubtitle');
  const answerEl = document.getElementById('overlayAnswer');
  const answerTeamEl = document.getElementById('overlayAnswerTeam');
  const shareGrid = document.getElementById('shareGrid');

  if (won) {
    titleEl.textContent = '🎉 You Got It!';
    subtitleEl.textContent = `Solved in ${guesses.length}/${MAX_GUESSES} guesses`;
  } else {
    titleEl.textContent = '😞 Game Over';
    subtitleEl.textContent = `The mystery player was:`;
  }

  answerEl.textContent = mysteryPlayer.name;
  answerTeamEl.textContent = `${mysteryPlayer.team} | ${mysteryPlayer.pos.join('-')} | ${mysteryPlayer.ht}`;
  shareGrid.textContent = generateShareGrid(won);

  dom.overlay.classList.add('overlay--visible');
}

function generateShareGrid(won) {
  const date = new Date().toISOString().slice(0, 10);
  const modeLabel = currentMode === '2013' ? '👑 吾皇登基 2012-13' : '🗽 群雄逐鹿';
  let text = `${modeLabel} ${date}\n`;

  guesses.forEach(g => {
    const result = compareAll(g, mysteryPlayer);
    const emojis = [
      result.team, result.conf, result.div, result.pos,
      result.ht.color, result.age.color, result.jersey.color,
    ].map(c => {
      if (c === 'green' || (c.color === 'green')) return '🟩';
      if (c === 'yellow' || (c.color === 'yellow')) return '🟨';
      return '⬛';
    }).join('');
    text += emojis + '\n';
  });

  if (won) {
    text += `Solved in ${guesses.length}/${MAX_GUESSES}!`;
  } else {
    text += `Failed after ${MAX_GUESSES} guesses`;
  }

  return text;
}

function copyShare() {
  const won = guesses.length > 0 && guesses[guesses.length - 1].id === mysteryPlayer.id;
  const text = generateShareGrid(won);
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy');
  });
}

// ── Silhouette ─────────────────────────────────────────────
function getHeadshotUrl(nbaId) {
  // 260x190 loads ~10x faster than 1040x760, sufficient for 200px display
  return `https://cdn.nba.com/headshots/nba/latest/260x190/${nbaId}.png`;
}

let silhouettePreloaded = false;

function preloadSilhouette() {
  silhouettePreloaded = false;
  if (mysteryPlayer && mysteryPlayer.nbaId) {
    const img = new Image();
    img.onload = () => { silhouettePreloaded = true; };
    img.onerror = () => { silhouettePreloaded = false; };
    img.src = getHeadshotUrl(mysteryPlayer.nbaId);
  }
}

function toggleSilhouette() {
  const isVisible = dom.silhouetteWrap.classList.contains('silhouette__wrap--visible');
  if (isVisible) {
    dom.silhouetteWrap.classList.remove('silhouette__wrap--visible');
    dom.silhouetteBtn.textContent = '👤 Reveal Silhouette';
  } else {
    if (mysteryPlayer && mysteryPlayer.nbaId) {
      const url = getHeadshotUrl(mysteryPlayer.nbaId);
      dom.silhouetteImg.src = url;

      // Handle load success
      dom.silhouetteImg.onload = () => {
        dom.silhouetteImg.style.display = '';
        dom.silhouetteBtn.textContent = '🙈 Hide Silhouette';
      };

      // Handle load failure
      dom.silhouetteImg.onerror = () => {
        dom.silhouetteWrap.classList.remove('silhouette__wrap--visible');
        showToast('Image failed to load. Check your network or try again.');
        dom.silhouetteBtn.textContent = '👤 Reveal Silhouette';
      };
    }
    dom.silhouetteWrap.classList.add('silhouette__wrap--visible');
    dom.silhouetteBtn.textContent = '⏳ Loading...';
  }
}

// ── Toast ──────────────────────────────────────────────────
let toastTimer = null;

function showToast(msg) {
  dom.toast.textContent = msg;
  dom.toast.classList.add('toast--visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.classList.remove('toast--visible');
  }, 2000);
}

// ── Utils ──────────────────────────────────────────────────
function normalizeStr(str) {
  // Strip diacritics so "Dončić" matches "Doncic"
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Bootstrap ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initGame);
