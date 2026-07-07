/* ═══════════════════════════════════════════════════════════
   NBA MYSTERY PLAYER — Game Logic
   ═══════════════════════════════════════════════════════════ */

// ── Constants ──────────────────────────────────────────────
const MAX_GUESSES = 8;
const STORAGE_KEY = 'nbaMysteryPlayer';
const COLUMNS = ['Team', 'Conf', 'Div', 'Pos', 'Ht', 'Age', '#'];
const COMPARE_KEYS = ['team', 'conf', 'div', 'pos', 'ht', 'age', 'jersey'];
const STATS_KEY = STORAGE_KEY + '_stats';

// ── Stats ──────────────────────────────────────────────────
function emptyStats() {
  return { played: 0, wins: 0, totalGuesses: 0, streak: 0, maxStreak: 0 };
}

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Ensure all modes exist
      for (const m of ['daily', 'current', '2013']) {
        if (!data[m]) data[m] = emptyStats();
      }
      return data;
    }
  } catch (e) { /* ignore */ }
  return { daily: emptyStats(), current: emptyStats(), '2013': emptyStats() };
}

function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function recordGameResult(won) {
  const stats = loadStats();
  const s = stats[currentMode] || emptyStats();

  // Daily mode: only record once per day to prevent double-counting
  if (currentMode === 'daily') {
    const today = new Date().toISOString().slice(0, 10);
    if (s.lastPlayedDate === today) return;
    s.lastPlayedDate = today;
  }

  s.played++;
  if (won) {
    s.wins++;
    s.totalGuesses += guesses.length;
    s.streak++;
    if (s.streak > s.maxStreak) s.maxStreak = s.streak;
  } else {
    s.streak = 0;
  }
  stats[currentMode] = s;
  saveStats(stats);
  renderStats(stats);
}

function renderStats(stats) {
  const panel = document.getElementById('statsPanel');
  if (!panel) return;
  const allStats = stats || loadStats();

  // Totals across all modes
  const total = { played: 0, wins: 0, totalGuesses: 0, streak: 0, maxStreak: 0 };
  for (const m of ['daily', 'current', '2013']) {
    const s = allStats[m];
    total.played += s.played;
    total.wins += s.wins;
    total.totalGuesses += s.totalGuesses;
    total.maxStreak = Math.max(total.maxStreak, s.maxStreak);
  }
  // Current streak is the sum of all mode streaks
  total.streak = allStats.daily.streak + allStats.current.streak + allStats['2013'].streak;

  const winPct = total.played > 0 ? Math.round(total.wins / total.played * 100) : 0;
  const avgGuesses = total.wins > 0 ? (total.totalGuesses / total.wins).toFixed(1) : '-';

  // Build mode-specific mini stats
  const modeStats = [
    { key: 'daily', label: '📅', s: allStats.daily },
    { key: 'current', label: '🗽', s: allStats.current },
    { key: '2013', label: '👑', s: allStats['2013'] },
  ];

  panel.innerHTML = `
    <div class="stats__summary">
      <div class="stats__item">
        <span class="stats__value">${total.played}</span>
        <span class="stats__label">Games</span>
      </div>
      <div class="stats__item">
        <span class="stats__value">${winPct}%</span>
        <span class="stats__label">Win%</span>
      </div>
      <div class="stats__item">
        <span class="stats__value">${avgGuesses}</span>
        <span class="stats__label">Avg</span>
      </div>
      <div class="stats__item">
        <span class="stats__value">${total.maxStreak}</span>
        <span class="stats__label">Best</span>
      </div>
    </div>
    <div class="stats__modes">
      ${modeStats.map(m => `
        <span class="stats__mode ${m.key === currentMode ? 'stats__mode--active' : ''}"
              title="${m.key === 'daily' ? '每日挑战' : m.key === 'current' ? '群雄逐鹿' : '吾皇登基'}">
          ${m.label} ${m.s.wins}-${m.s.played - m.s.wins}
        </span>
      `).join('')}
    </div>
  `;
}

// ── Mode ───────────────────────────────────────────────────
let PLAYERS = PLAYERS_CURRENT;
let currentMode = 'daily'; // 'daily' | 'current' | '2013'

function hashDate() {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function switchMode(mode) {
  if (mode === currentMode) return;

  // Leave previous mode
  if (currentMode === 'duel') hideDuelUI();

  currentMode = mode;

  // Duel mode — swap UI completely
  if (mode === 'duel') {
    showDuelUI();
    document.body.classList.remove('mode--2013', 'mode--daily');
    const subtitle = document.querySelector('.header__subtitle');
    if (subtitle) subtitle.textContent = 'Stat Showdown · 数据对决';
    document.getElementById('modeDaily')?.classList.remove('mode-tab--active');
    document.getElementById('modeCurrent')?.classList.remove('mode-tab--active');
    document.getElementById('mode2013')?.classList.remove('mode-tab--active');
    document.getElementById('modeDuel')?.classList.add('mode-tab--active');
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) newGameBtn.style.display = 'none';
    document.getElementById('duelBestScore').textContent =
      `Best: ${localStorage.getItem(STORAGE_KEY + '_duelBest') || '0'}`;
    return;
  }

  PLAYERS = mode === '2013' ? PLAYERS_2013 : PLAYERS_CURRENT;

  // Toggle body class for theming
  document.body.classList.toggle('mode--2013', mode === '2013');
  document.body.classList.toggle('mode--daily', mode === 'daily');

  // Update subtitle based on mode
  const subtitle = document.querySelector('.header__subtitle');
  const newGameBtn = document.getElementById('newGameBtn');
  if (subtitle) {
    if (mode === 'daily') {
      subtitle.textContent = 'New mystery every day · 每日挑战';
    } else if (mode === '2013') {
      subtitle.textContent = '2012-13 Season · 吾皇登基';
    } else {
      subtitle.textContent = 'Current Season · 群雄逐鹿';
    }
  }

  // Show/hide New Game button (hidden in daily mode)
  if (newGameBtn) {
    newGameBtn.style.display = mode === 'daily' ? 'none' : '';
  }

  // Toggle active buttons
  document.getElementById('modeDaily')?.classList.toggle('mode-tab--active', mode === 'daily');
  document.getElementById('modeCurrent')?.classList.toggle('mode-tab--active', mode === 'current');
  document.getElementById('mode2013')?.classList.toggle('mode-tab--active', mode === '2013');
  document.getElementById('modeDuel')?.classList.remove('mode-tab--active');

  resetGame();
  const labels = { daily: '📅 每日挑战', current: '🗽 群雄逐鹿', '2013': '👑 吾皇登基' };
  console.log(`Switched to ${labels[mode]}`);
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
  overlay: null,
  toast: null,
};

// ── Player Selection ──────────────────────────────────────
function getRandomIndex() {
  return Math.floor(Math.random() * PLAYERS.length);
}

function getDailyIndex() {
  return hashDate() % PLAYERS.length;
}

// ── Init ───────────────────────────────────────────────────
function initGame() {
  cacheDom();
  loadState();

  // Daily mode: check if date changed
  if (currentMode === 'daily') {
    const storedDate = localStorage.getItem(STORAGE_KEY + '_date');
    const today = new Date().toISOString().slice(0, 10);
    if (storedDate !== today) {
      // New day — reset with fresh daily player
      mysteryPlayer = null;
      guesses = [];
      gameOver = false;
    }
    // Hide New Game button in daily mode
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) newGameBtn.style.display = 'none';
  }

  if (!mysteryPlayer) {
    const idx = currentMode === 'daily' ? getDailyIndex() : getRandomIndex();
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

  console.log(`[${currentMode}] Mystery: ${mysteryPlayer.name} (#${mysteryPlayer.id})`);

  // Preload silhouette image in background
  preloadSilhouette();

  // Render stats
  renderStats();
}

function cacheDom() {
  dom.searchInput = document.getElementById('searchInput');
  dom.searchDropdown = document.getElementById('searchDropdown');
  dom.guessBody = document.getElementById('guessBody');
  dom.remainingEl = document.getElementById('remaining');
  dom.silhouetteBtn = document.getElementById('silhouetteBtn');
  dom.silhouetteImg = document.getElementById('silhouetteImg');
  dom.overlay = document.getElementById('overlay');
  dom.toast = document.getElementById('toast');
}

// ── State Persistence ──────────────────────────────────────
function saveState() {
  const today = new Date().toISOString().slice(0, 10);
  const state = {
    date: today,
    mysteryId: mysteryPlayer ? mysteryPlayer.id : null,
    guesses: guesses,
    gameOver: gameOver,
    mode: currentMode,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem(STORAGE_KEY + '_date', today);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const state = JSON.parse(raw);
      // Duel mode doesn't persist across refresh — fall back to daily
      currentMode = (state.mode === 'duel') ? 'daily' : (state.mode || 'daily');

      // Daily mode: clear if date changed
      if (currentMode === 'daily') {
        const today = new Date().toISOString().slice(0, 10);
        if (state.date !== today) {
          // New day — fresh start
          guesses = [];
          gameOver = false;
          localStorage.setItem(STORAGE_KEY + '_date', today);
          return;
        }
      }

      guesses = state.guesses || [];
      gameOver = state.gameOver || false;
      PLAYERS = currentMode === '2013' ? PLAYERS_2013 : PLAYERS_CURRENT;

      // Restore mode UI
      document.body.classList.toggle('mode--2013', currentMode === '2013');
      document.body.classList.toggle('mode--daily', currentMode === 'daily');
      document.getElementById('modeDaily')?.classList.toggle('mode-tab--active', currentMode === 'daily');
      document.getElementById('modeCurrent')?.classList.toggle('mode-tab--active', currentMode === 'current');
      document.getElementById('mode2013')?.classList.toggle('mode-tab--active', currentMode === '2013');

      // New Game button visibility
      const newGameBtn = document.getElementById('newGameBtn');
      if (newGameBtn) {
        newGameBtn.style.display = currentMode === 'daily' ? 'none' : '';
      }

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
  document.getElementById('modeDaily')?.addEventListener('click', () => switchMode('daily'));
  document.getElementById('modeCurrent')?.addEventListener('click', () => switchMode('current'));
  document.getElementById('mode2013')?.addEventListener('click', () => switchMode('2013'));
  document.getElementById('modeDuel')?.addEventListener('click', () => switchMode('duel'));

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
  if (guess.team === answer.team) return { color: 'green', arrow: '' };
  if (answer.formerTeams.includes(guess.team)) return { color: 'yellow', arrow: '' };
  return { color: 'black', arrow: '' };
}

function compareConf(guess, answer) {
  return { color: guess.conf === answer.conf ? 'green' : 'black', arrow: '' };
}

function compareDiv(guess, answer) {
  return { color: guess.div === answer.div ? 'green' : 'black', arrow: '' };
}

function comparePos(guess, answer) {
  const gSet = new Set(guess.pos);
  const aSet = new Set(answer.pos);
  if (gSet.size === aSet.size && [...gSet].every(x => aSet.has(x))) return { color: 'green', arrow: '' };
  if ([...gSet].some(x => aSet.has(x))) return { color: 'yellow', arrow: '' };
  return { color: 'black', arrow: '' };
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
    // All columns now uniformly return { color, arrow }
    td.className = `cell--${res.color}`;
    td.innerHTML = `${cell.display}<span class="cell-arrow">${res.arrow || ''}</span>`;
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
  recordGameResult(won);
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
  dom.silhouetteImg.classList.add('silhouette__img--visible', 'silhouette__img--revealed');
  dom.silhouetteBtn.textContent = '🙈 Hide Silhouette';
}

function resetGame() {
  // Daily mode: always reset to the same daily player
  const idx = currentMode === 'daily' ? getDailyIndex() : getRandomIndex();
  mysteryPlayer = PLAYERS[idx];
  guesses = [];
  gameOver = false;

  dom.searchInput.disabled = false;
  dom.searchInput.placeholder = '🔍  Type a player name...';
  dom.overlay.classList.remove('overlay--visible');

  // Reset silhouette
  dom.silhouetteImg.classList.remove('silhouette__img--visible', 'silhouette__img--revealed');
  dom.silhouetteImg.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  dom.silhouetteBtn.textContent = '👤 Reveal Silhouette';

  clearTable();
  updateRemaining();
  saveState();
  preloadSilhouette();

  console.log(`[${currentMode}] New mystery: ${mysteryPlayer.name} (#${mysteryPlayer.id})`);
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
  const labels = {
    daily: `📅 NBA Mystery Player ${date}`,
    current: '🗽 群雄逐鹿',
    '2013': '👑 吾皇登基 2012-13',
  };
  const modeLabel = labels[currentMode] || labels.daily;
  let text = `${modeLabel} ${currentMode !== 'daily' ? date : ''}\n`.trim() + '\n';
  if (currentMode === 'daily') {
    // Date is already in the label for daily mode
    text = `${modeLabel}\n`;
  }

  guesses.forEach(g => {
    const result = compareAll(g, mysteryPlayer);
    const emojis = COMPARE_KEYS.map(key => {
      const c = result[key].color;
      if (c === 'green') return '🟩';
      if (c === 'yellow') return '🟨';
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
  const isVisible = dom.silhouetteImg.classList.contains('silhouette__img--visible');
  if (isVisible) {
    dom.silhouetteImg.classList.remove('silhouette__img--visible');
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
        dom.silhouetteImg.classList.remove('silhouette__img--visible');
        showToast('Image failed to load. Check your network or try again.');
        dom.silhouetteBtn.textContent = '👤 Reveal Silhouette';
      };
    }
    dom.silhouetteImg.classList.add('silhouette__img--visible');
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

// ═══════════════════════════════════════════════════════════════
// PLAYER DUEL MODE — compare per-game stats
// ═══════════════════════════════════════════════════════════════

const DUEL_TIME = 15;
const DUEL_LIVES = 3;

const DUEL_QUESTIONS = [
  { key: 'pts',  label: 'Who scores more?',           format: v => `${v.toFixed(1)} PPG`,   icon: '🏀' },
  { key: 'reb',  label: 'Who grabs more rebounds?',    format: v => `${v.toFixed(1)} RPG`,   icon: '💪' },
  { key: 'ast',  label: 'Who dishes more assists?',    format: v => `${v.toFixed(1)} APG`,   icon: '🤝' },
  { key: 'stl',  label: 'Who gets more steals?',       format: v => `${v.toFixed(1)} SPG`,   icon: '🫳' },
  { key: 'blk',  label: 'Who blocks more shots?',       format: v => `${v.toFixed(1)} BPG`,   icon: '✋' },
  { key: 'tov',  label: 'Who turns the ball over MORE?', format: v => `${v.toFixed(1)} TOV`,  icon: '😬' },
  { key: 'fgPct',  label: 'Who has better FG%?',         format: v => `${(v*100).toFixed(1)}%`, icon: '🎯' },
  { key: 'fg3Pct', label: 'Who has better 3P%?',        format: v => `${(v*100).toFixed(1)}%`, icon: '🎯' },
  { key: 'ftPct',  label: 'Who has better FT%?',         format: v => `${(v*100).toFixed(1)}%`, icon: '🎯' },
  { key: 'ht',   label: 'Who is taller?',              format: v => `${Math.floor(v/12)}-${v%12}`, icon: '📏' },
  { key: 'age',  label: 'Who is older?',               format: v => `${v} yrs`,  icon: '🎂' },
];

const duelState = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  lives: DUEL_LIVES,
  playerA: null,
  playerB: null,
  question: null,
  playing: false,
  answered: false,
  timerInterval: null,
  barTimers: null,
  timeLeft: DUEL_TIME,
};

function getDuelPool() {
  return PLAYERS_CURRENT.filter(p => p.stats && p.stats.gp > 0 && p.stats.pts > 0);
}

function pickDuelPair() {
  const pool = getDuelPool();
  if (pool.length < 2) return [null, null];
  const a = pool[Math.floor(Math.random() * pool.length)];
  let b;
  do { b = pool[Math.floor(Math.random() * pool.length)]; } while (b.id === a.id);
  return [a, b];
}

function pickDuelQuestion(a, b) {
  const shuffled = [...DUEL_QUESTIONS].sort(() => Math.random() - 0.5);
  for (const q of shuffled) {
    const va = getDuelStat(a, q.key);
    const vb = getDuelStat(b, q.key);
    if (va !== vb) return q;
  }
  return shuffled[0];
}

function getDuelStat(player, key) {
  if (key === 'ht') return player.htInches;
  if (key === 'age') return player.age;
  return player.stats ? player.stats[key] : 0;
}

function showDuelUI() {
  document.body.classList.add('mode--duel');
  document.getElementById('duelContainer').style.display = '';
  document.getElementById('searchWrapper').style.display = 'none';
  document.getElementById('silhouetteWrap').style.display = 'none';
  document.querySelector('.guess-table').style.display = 'none';
  document.querySelector('.status-bar').style.display = 'none';
  document.getElementById('statsPanel').style.display = 'none';
}

function hideDuelUI() {
  document.body.classList.remove('mode--duel');
  document.getElementById('duelContainer').style.display = 'none';
  document.getElementById('searchWrapper').style.display = '';
  document.getElementById('silhouetteWrap').style.display = '';
  document.querySelector('.guess-table').style.display = '';
  document.querySelector('.status-bar').style.display = '';
  document.getElementById('statsPanel').style.display = '';
}

function startDuel() {
  const [a, b] = pickDuelPair();
  if (!a || !b) return;

  duelState.playerA = a;
  duelState.playerB = b;
  duelState.question = pickDuelQuestion(a, b);
  duelState.score = 0;
  duelState.combo = 0;
  duelState.maxCombo = 0;
  duelState.lives = DUEL_LIVES;
  duelState.playing = true;
  duelState.answered = false;

  document.getElementById('duelStartBtn').style.display = 'none';
  document.getElementById('duelResult').style.display = 'none';
  document.getElementById('duelCards').style.display = '';
  document.getElementById('duelQuestion').style.display = '';
  document.getElementById('duelTimerWrap').style.display = '';
  document.getElementById('duelCardA').classList.remove('duel__card--correct', 'duel__card--wrong', 'duel__card--picked');
  document.getElementById('duelCardB').classList.remove('duel__card--correct', 'duel__card--wrong', 'duel__card--picked');
  document.getElementById('duelStatA').style.display = 'none';
  document.getElementById('duelStatB').style.display = 'none';

  updateDuelUI();
  startDuelTimer();
}

function updateDuelUI() {
  const a = duelState.playerA;
  const b = duelState.playerB;
  if (!a || !b) return;

  document.getElementById('duelQuestion').textContent =
    `${duelState.question.icon} ${duelState.question.label}`;
  document.getElementById('duelScore').textContent = duelState.score;
  document.getElementById('duelCombo').textContent = duelState.combo;
  document.getElementById('duelLives').textContent =
    '❤️'.repeat(duelState.lives) + '🖤'.repeat(DUEL_LIVES - duelState.lives);

  // Card A
  document.getElementById('duelImgA').src = a.nbaId
    ? `https://cdn.nba.com/headshots/nba/latest/260x190/${a.nbaId}.png`
    : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  document.getElementById('duelNameA').textContent = a.name;
  document.getElementById('duelTeamA').textContent = `${a.team} | ${a.pos.join('-')}`;

  // Card B
  document.getElementById('duelImgB').src = b.nbaId
    ? `https://cdn.nba.com/headshots/nba/latest/260x190/${b.nbaId}.png`
    : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  document.getElementById('duelNameB').textContent = b.name;
  document.getElementById('duelTeamB').textContent = `${b.team} | ${b.pos.join('-')}`;
}

function startDuelTimer() {
  duelState.timeLeft = DUEL_TIME;
  duelState.answered = false;
  const bar = document.getElementById('duelTimerBar');
  bar.style.transition = 'none';
  bar.style.width = '100%';
  bar.classList.remove('duel__timer-bar--warning', 'duel__timer-bar--danger');

  // Force reflow
  bar.offsetHeight;

  bar.style.transition = `width ${DUEL_TIME}s linear`;
  bar.style.width = '0%';

  // Color changes at 5s and 3s
  if (duelState.barTimers) duelState.barTimers.forEach(clearTimeout);
  duelState.barTimers = [
    setTimeout(() => bar.classList.add('duel__timer-bar--warning'), (DUEL_TIME - 5) * 1000),
    setTimeout(() => bar.classList.add('duel__timer-bar--danger'), (DUEL_TIME - 3) * 1000),
  ];

  if (duelState.timerInterval) clearInterval(duelState.timerInterval);
  duelState.timerInterval = setInterval(() => {
    duelState.timeLeft--;
    if (duelState.timeLeft <= 0) {
      clearInterval(duelState.timerInterval);
      if (!duelState.answered) handleDuelTimeout();
    }
  }, 1000);
}

function handleDuelChoice(pickedSide) {
  if (!duelState.playing || duelState.answered) return;
  duelState.answered = true;
  clearInterval(duelState.timerInterval);
  if (duelState.barTimers) { duelState.barTimers.forEach(clearTimeout); duelState.barTimers = null; }

  const a = duelState.playerA;
  const b = duelState.playerB;
  const q = duelState.question;
  const valA = getDuelStat(a, q.key);
  const valB = getDuelStat(b, q.key);

  // Show stats
  document.getElementById('duelStatA').textContent = q.format(valA);
  document.getElementById('duelStatA').style.display = '';
  document.getElementById('duelStatB').textContent = q.format(valB);
  document.getElementById('duelStatB').style.display = '';

  const correctSide = valA > valB ? 'A' : 'B';
  const isCorrect = pickedSide === correctSide;

  // Highlight cards
  if (correctSide === 'A') {
    document.getElementById('duelCardA').classList.add('duel__card--correct');
  } else if (pickedSide === 'A') {
    document.getElementById('duelCardA').classList.add('duel__card--wrong');
  }
  if (correctSide === 'B') {
    document.getElementById('duelCardB').classList.add('duel__card--correct');
  } else if (pickedSide === 'B') {
    document.getElementById('duelCardB').classList.add('duel__card--wrong');
  }

  if (pickedSide === 'A') document.getElementById('duelCardA').classList.add('duel__card--picked');
  if (pickedSide === 'B') document.getElementById('duelCardB').classList.add('duel__card--picked');

  if (isCorrect) {
    duelState.score++;
    duelState.combo++;
    if (duelState.combo > duelState.maxCombo) duelState.maxCombo = duelState.combo;
    document.getElementById('duelResultText').textContent = '✅ Correct!';
  } else {
    duelState.combo = 0;
    duelState.lives--;
    document.getElementById('duelResultText').textContent = '❌ Wrong!';
  }

  updateDuelUI();

  // Next round or game over
  setTimeout(() => {
    if (duelState.lives <= 0) {
      endDuel();
    } else {
      nextDuelRound();
    }
  }, 1500);
}

function handleDuelTimeout() {
  if (!duelState.playing || duelState.answered) return;
  duelState.answered = true;
  if (duelState.barTimers) { duelState.barTimers.forEach(clearTimeout); duelState.barTimers = null; }

  const a = duelState.playerA;
  const b = duelState.playerB;
  const q = duelState.question;
  const valA = getDuelStat(a, q.key);
  const valB = getDuelStat(b, q.key);

  document.getElementById('duelStatA').textContent = q.format(valA);
  document.getElementById('duelStatA').style.display = '';
  document.getElementById('duelStatB').textContent = q.format(valB);
  document.getElementById('duelStatB').style.display = '';

  duelState.combo = 0;
  duelState.lives--;
  document.getElementById('duelResultText').textContent = '⏰ Time\'s up!';

  updateDuelUI();

  setTimeout(() => {
    if (duelState.lives <= 0) {
      endDuel();
    } else {
      nextDuelRound();
    }
  }, 1500);
}

function nextDuelRound() {
  const [a, b] = pickDuelPair();
  if (!a || !b) { endDuel(); return; }

  duelState.playerA = a;
  duelState.playerB = b;
  duelState.question = pickDuelQuestion(a, b);
  duelState.answered = false;

  document.getElementById('duelCardA').classList.remove('duel__card--correct', 'duel__card--wrong', 'duel__card--picked');
  document.getElementById('duelCardB').classList.remove('duel__card--correct', 'duel__card--wrong', 'duel__card--picked');
  document.getElementById('duelStatA').style.display = 'none';
  document.getElementById('duelStatB').style.display = 'none';
  document.getElementById('duelResultText').textContent = '';

  updateDuelUI();
  startDuelTimer();
}

function endDuel() {
  duelState.playing = false;
  clearInterval(duelState.timerInterval);
  if (duelState.barTimers) { duelState.barTimers.forEach(clearTimeout); duelState.barTimers = null; }

  document.getElementById('duelCards').style.display = 'none';
  document.getElementById('duelQuestion').style.display = 'none';
  document.getElementById('duelTimerWrap').style.display = 'none';
  document.getElementById('duelStartBtn').style.display = 'none';
  document.getElementById('duelResult').style.display = '';
  document.getElementById('duelFinalScore').textContent = duelState.score;
  document.getElementById('duelFinalCombo').textContent = duelState.maxCombo;

  // Save best score
  saveDuelBest();
}

function saveDuelBest() {
  try {
    const key = STORAGE_KEY + '_duelBest';
    const prev = parseInt(localStorage.getItem(key) || '0', 10);
    if (duelState.score > prev) {
      localStorage.setItem(key, String(duelState.score));
    }
    document.getElementById('duelBestScore').textContent =
      `Best: ${Math.max(prev, duelState.score)}`;
  } catch (e) { /* ignore */ }
}

/* ═══════════════════════════════════════════════════════════════
   MAKE DUEL FUNCTIONS GLOBAL (called from onclick in HTML)
   ═══════════════════════════════════════════════════════════════ */
window.startDuel = startDuel;
window.handleDuelChoice = handleDuelChoice;

// ── Bootstrap ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initGame);
