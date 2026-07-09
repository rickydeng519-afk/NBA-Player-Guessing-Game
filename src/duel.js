/* ═══════════════════════════════════════════════════════════════
   PLAYER DUEL MODE — compare per-game stats side-by-side
   ═══════════════════════════════════════════════════════════════ */

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

// ── Duel Event Bindings ─────────────────────────────────────
function bindDuelEvents() {
  // Card click listeners (replace inline onclick)
  const cardA = document.getElementById('duelCardA');
  const cardB = document.getElementById('duelCardB');
  if (cardA) cardA.addEventListener('click', () => handleDuelChoice('A'));
  if (cardB) cardB.addEventListener('click', () => handleDuelChoice('B'));

  // Start / Play Again buttons (replace inline onclick)
  const startBtn = document.getElementById('duelStartBtn');
  if (startBtn) startBtn.addEventListener('click', startDuel);

  // Play Again button in result section
  const resultPlayAgain = document.querySelector('#duelResult .duel__start-btn');
  if (resultPlayAgain) resultPlayAgain.addEventListener('click', startDuel);
}
