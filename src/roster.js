/* ═══════════════════════════════════════════════════════════════
   ROSTER RUSH — name all players from a team in 2 minutes
   ═══════════════════════════════════════════════════════════════ */

const ROSTER_TIME = 120; // 2 minutes

const TEAM_NAMES = {
  'ATL': 'Atlanta Hawks',      'BOS': 'Boston Celtics',
  'BKN': 'Brooklyn Nets',      'CHA': 'Charlotte Hornets',
  'CHI': 'Chicago Bulls',      'CLE': 'Cleveland Cavaliers',
  'DAL': 'Dallas Mavericks',   'DEN': 'Denver Nuggets',
  'DET': 'Detroit Pistons',    'GSW': 'Golden State Warriors',
  'HOU': 'Houston Rockets',    'IND': 'Indiana Pacers',
  'LAC': 'LA Clippers',        'LAL': 'Los Angeles Lakers',
  'MEM': 'Memphis Grizzlies',  'MIA': 'Miami Heat',
  'MIL': 'Milwaukee Bucks',    'MIN': 'Minnesota Timberwolves',
  'NOP': 'New Orleans Pelicans','NYK': 'New York Knicks',
  'OKC': 'Oklahoma City Thunder','ORL': 'Orlando Magic',
  'PHI': 'Philadelphia 76ers', 'PHX': 'Phoenix Suns',
  'POR': 'Portland Trail Blazers','SAC': 'Sacramento Kings',
  'SAS': 'San Antonio Spurs',  'TOR': 'Toronto Raptors',
  'UTA': 'Utah Jazz',          'WAS': 'Washington Wizards',
};

const rosterState = {
  team: null,
  teamPlayers: [],
  guessed: [],
  score: 0,
  playing: false,
  timerInterval: null,
  timeLeft: ROSTER_TIME,
};

function showRosterUI() {
  document.body.classList.add('mode--roster');
  document.getElementById('rosterContainer').style.display = '';
  document.getElementById('searchWrapper').style.display = 'none';
  document.getElementById('silhouetteWrap').style.display = 'none';
  document.querySelector('.guess-table').style.display = 'none';
  document.querySelector('.status-bar').style.display = 'none';
  document.getElementById('statsPanel').style.display = 'none';
}

function hideRosterUI() {
  clearRosterTimer();
  rosterState.playing = false;

  // Reset roster UI to initial state so switching back shows the start screen
  document.getElementById('rosterStartBtn').style.display = '';
  document.getElementById('rosterResult').style.display = 'none';
  document.getElementById('rosterSearchWrap').style.display = 'none';
  document.getElementById('rosterList').innerHTML = '';
  document.getElementById('rosterTimer').classList.remove('roster__timer--warning', 'roster__timer--danger');
  document.getElementById('rosterTimer').textContent = '2:00';
  document.getElementById('rosterGiveUpBtn').style.display = 'none';

  // If the user was mid-game, record whatever score they had before abandoning
  if (rosterState.score > 0) {
    saveRosterBest();
    rosterState.score = 0;
    rosterState.guessed = [];
  }

  document.body.classList.remove('mode--roster');
  document.getElementById('rosterContainer').style.display = 'none';
  document.getElementById('searchWrapper').style.display = '';
  document.getElementById('silhouetteWrap').style.display = '';
  document.querySelector('.guess-table').style.display = '';
  document.querySelector('.status-bar').style.display = '';
  document.getElementById('statsPanel').style.display = '';
}

function clearRosterTimer() {
  if (rosterState.timerInterval) {
    clearInterval(rosterState.timerInterval);
    rosterState.timerInterval = null;
  }
}

function startRoster() {
  clearRosterTimer();

  // Pick random team with >= 8 players
  const teams = [...new Set(PLAYERS_CURRENT.map(p => p.team))];
  const viable = teams.filter(t => {
    const count = PLAYERS_CURRENT.filter(p => p.team === t).length;
    return count >= 8;
  });
  if (viable.length === 0) return;
  const team = viable[Math.floor(Math.random() * viable.length)];
  const teamPlayers = PLAYERS_CURRENT.filter(p => p.team === team);

  rosterState.team = team;
  rosterState.teamPlayers = teamPlayers;
  rosterState.guessed = [];
  rosterState.score = 0;
  rosterState.playing = true;
  rosterState.timeLeft = ROSTER_TIME;

  // Reset UI
  document.getElementById('rosterStartBtn').style.display = 'none';
  document.getElementById('rosterResult').style.display = 'none';
  document.getElementById('rosterSearchWrap').style.display = '';
  document.getElementById('rosterGiveUpBtn').style.display = '';
  document.getElementById('rosterTeamDisplay').textContent = TEAM_NAMES[team] || team;
  document.getElementById('rosterScore').textContent = '0';
  document.getElementById('rosterFound').textContent = '0';
  document.getElementById('rosterTotal').textContent = teamPlayers.length;
  document.getElementById('rosterList').innerHTML = '';
  document.getElementById('rosterSearchInput').value = '';
  document.getElementById('rosterTimer').classList.remove('roster__timer--warning', 'roster__timer--danger');

  updateRosterTimerDisplay();
  startRosterTimer();

  // Focus search
  setTimeout(() => document.getElementById('rosterSearchInput').focus(), 100);
}

function updateRosterTimerDisplay() {
  const mins = Math.floor(rosterState.timeLeft / 60);
  const secs = rosterState.timeLeft % 60;
  const el = document.getElementById('rosterTimer');
  el.textContent = `${mins}:${String(secs).padStart(2, '0')}`;

  if (rosterState.timeLeft <= 30) el.classList.add('roster__timer--warning');
  if (rosterState.timeLeft <= 10) {
    el.classList.remove('roster__timer--warning');
    el.classList.add('roster__timer--danger');
  }
}

function startRosterTimer() {
  clearRosterTimer();
  rosterState.timerInterval = setInterval(() => {
    rosterState.timeLeft--;
    updateRosterTimerDisplay();
    if (rosterState.timeLeft <= 0) {
      clearRosterTimer();
      endRoster();
    }
  }, 1000);
}

function onRosterSearchInput() {
  const query = document.getElementById('rosterSearchInput').value.trim().toLowerCase();
  const dropdown = document.getElementById('rosterDropdown');
  if (!dropdown) return;

  if (!query || !rosterState.playing) {
    dropdown.classList.remove('roster__dropdown--open');
    return;
  }

  // Search ALL players (not just the target team), exclude already correctly guessed
  const guessedIds = new Set(rosterState.guessed.map(g => g.id));
  const results = PLAYERS_CURRENT
    .filter(p => !guessedIds.has(p.id))
    .filter(p => normalizeStr(p.name).includes(normalizeStr(query)))
    .slice(0, 8);

  dropdown.innerHTML = '';
  if (results.length === 0) {
    dropdown.innerHTML = '<div class="roster__no-results">No matching players</div>';
  } else {
    results.forEach(p => {
      const div = document.createElement('div');
      div.className = 'roster__dropdown-item';
      div.innerHTML = `<span>${escapeHtml(p.name)}</span><span class="search__item-team">${p.pos.join('-')}</span>`;
      div.addEventListener('mousedown', (e) => {
        e.preventDefault();
        submitRosterGuess(p);
      });
      dropdown.appendChild(div);
    });
  }
  dropdown.classList.add('roster__dropdown--open');
}

function onRosterKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const query = document.getElementById('rosterSearchInput').value.trim().toLowerCase();
    if (!query) return;
    const guessedIds = new Set(rosterState.guessed.map(g => g.id));
    const matches = PLAYERS_CURRENT
      .filter(p => !guessedIds.has(p.id))
      .filter(p => normalizeStr(p.name).includes(normalizeStr(query)));
    if (matches.length === 1) {
      submitRosterGuess(matches[0]);
    }
  } else if (e.key === 'Escape') {
    const dropdown = document.getElementById('rosterDropdown');
    if (dropdown) dropdown.classList.remove('roster__dropdown--open');
    document.getElementById('rosterSearchInput').blur();
  }
}

function submitRosterGuess(player) {
  if (!rosterState.playing) return;

  const isCorrect = player.team === rosterState.team;
  const input = document.getElementById('rosterSearchInput');
  const dropdown = document.getElementById('rosterDropdown');

  if (isCorrect) {
    rosterState.guessed.push(player);
    rosterState.score++;

    // Update display
    document.getElementById('rosterScore').textContent = rosterState.score;
    document.getElementById('rosterFound').textContent = rosterState.guessed.length;
    input.value = '';
    dropdown.classList.remove('roster__dropdown--open');

    // Add green tag to list
    const tag = document.createElement('span');
    tag.className = 'roster__player-tag';
    tag.textContent = player.name;
    document.getElementById('rosterList').appendChild(tag);

    // Check if all players found — early win
    if (rosterState.guessed.length >= rosterState.teamPlayers.length) {
      clearRosterTimer();
      setTimeout(() => endRoster(), 400);
    }

    input.focus();
  } else {
    // Wrong team — shake input + show toast
    input.classList.add('roster__search-input--wrong');
    input.value = '';
    dropdown.classList.remove('roster__dropdown--open');
    showToast(`❌ ${player.name} is not on the ${TEAM_NAMES[rosterState.team] || rosterState.team}`);
    setTimeout(() => input.classList.remove('roster__search-input--wrong'), 500);
    input.focus();
  }
}

function giveUpRoster() {
  if (!rosterState.playing) return;
  clearRosterTimer();
  endRoster();
}

function endRoster() {
  rosterState.playing = false;
  clearRosterTimer();

  document.getElementById('rosterSearchWrap').style.display = 'none';
  document.getElementById('rosterGiveUpBtn').style.display = 'none';
  document.getElementById('rosterResult').style.display = '';

  const total = rosterState.teamPlayers.length;
  const pct = total > 0 ? Math.round(rosterState.score / total * 100) : 0;

  let emoji = '🏆';
  if (pct < 75) emoji = '⭐';
  if (pct < 50) emoji = '💪';
  if (pct < 25) emoji = '📋';

  const teamName = TEAM_NAMES[rosterState.team] || rosterState.team;
  document.getElementById('rosterResultText').innerHTML =
    `${emoji} ${teamName}<br>You named <strong>${rosterState.score}</strong> of <strong>${total}</strong> players (${pct}%)`;

  saveRosterBest();
}

function saveRosterBest() {
  try {
    const key = STORAGE_KEY + '_rosterBest';
    const prev = parseInt(localStorage.getItem(key) || '0', 10);
    if (rosterState.score > prev) {
      localStorage.setItem(key, String(rosterState.score));
    }
    document.getElementById('rosterBest').textContent =
      `Best: ${Math.max(prev, rosterState.score)}`;
  } catch (e) { /* ignore */ }
}

// ── Roster Event Bindings ───────────────────────────────────
function bindRosterEvents() {
  // Search input events
  const input = document.getElementById('rosterSearchInput');
  if (input) {
    input.addEventListener('input', onRosterSearchInput);
    input.addEventListener('keydown', onRosterKeydown);
  }

  // Start / Play Again / Give Up buttons
  const startBtn = document.getElementById('rosterStartBtn');
  if (startBtn) startBtn.addEventListener('click', startRoster);

  const resultPlayAgain = document.querySelector('#rosterResult .roster__start-btn');
  if (resultPlayAgain) resultPlayAgain.addEventListener('click', startRoster);

  const giveUpBtn = document.getElementById('rosterGiveUpBtn');
  if (giveUpBtn) giveUpBtn.addEventListener('click', giveUpRoster);
}
