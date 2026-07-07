#!/usr/bin/env python3
"""Build index.html by combining HTML structure, CSS, JS, and player data."""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)

# Read components
with open(os.path.join(PROJECT_DIR, 'src', 'styles.css'), 'r') as f:
    styles = f.read()

with open(os.path.join(PROJECT_DIR, 'src', 'game.js'), 'r') as f:
    game_js = f.read()

with open(os.path.join(PROJECT_DIR, 'data', 'players.js'), 'r') as f:
    players_data = f.read()

with open(os.path.join(PROJECT_DIR, 'data', 'players_2013.js'), 'r') as f:
    players_2013 = f.read()

# Build HTML
html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>NBA Mystery Player</title>
<meta name="description" content="Guess the hidden NBA player! A new mystery player every day.">
<meta name="theme-color" content="#1a1a1a">
<style>
{styles}
</style>
</head>
<body>

<div class="container">
  <!-- Header -->
  <header class="header">
    <h1 class="header__title">🏀 NBA Mystery Player</h1>
    <p class="header__subtitle">New mystery every day · 每日挑战</p>
    <div class="mode-tabs">
      <button id="modeDaily" class="mode-tab mode-tab--active">📅 每日挑战</button>
      <button id="modeCurrent" class="mode-tab">🗽 群雄逐鹿</button>
      <button id="mode2013" class="mode-tab">👑 吾皇登基</button>
      <button id="modeDuel" class="mode-tab">⚡ 数据对决</button>
      <button id="modeRoster" class="mode-tab">🧩 球队拼图</button>
    </div>
    <button id="newGameBtn" class="header__new-game" style="display:none">🔄 New Game</button>
  </header>

  <!-- Search -->
  <div class="search-wrapper" id="searchWrapper">
    <input
      type="text"
      id="searchInput"
      class="search__input"
      placeholder="🔍  Type a player name..."
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
    >
    <div id="searchDropdown" class="search__dropdown"></div>
  </div>

  <!-- Silhouette Hint -->
  <div class="silhouette" id="silhouetteWrap">
    <button id="silhouetteBtn" class="silhouette__btn">👤 Reveal Silhouette</button>
    <img id="silhouetteImg" class="silhouette__img"
         src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
         alt="Player silhouette">
  </div>

  <!-- Guess Table -->
  <table class="guess-table">
    <thead>
      <tr>
        <th>Team</th>
        <th>Conf</th>
        <th>Div</th>
        <th>Pos</th>
        <th>Ht</th>
        <th>Age</th>
        <th>#</th>
      </tr>
    </thead>
    <tbody id="guessBody">
      <!-- Guesses rendered here -->
    </tbody>
  </table>

  <!-- Status -->
  <div class="status-bar">
    <span>Guesses remaining:</span>
    <span class="status-bar__remaining" id="remaining">8</span>
    <span>/ 8</span>
  </div>

  <!-- Stats Panel -->
  <div id="statsPanel" class="stats-panel"></div>

  <!-- Player Duel -->
  <div id="duelContainer" class="duel" style="display:none">
    <div class="duel__header">
      <div class="duel__score">Score: <span id="duelScore">0</span></div>
      <div class="duel__combo">🔥 <span id="duelCombo">0</span></div>
      <div class="duel__lives" id="duelLives">❤️❤️❤️</div>
    </div>
    <div class="duel__best" id="duelBestScore">Best: 0</div>

    <div class="duel__question" id="duelQuestion" style="display:none"></div>

    <div class="duel__timer" id="duelTimerWrap" style="display:none">
      <div class="duel__timer-bar" id="duelTimerBar"></div>
    </div>

    <div class="duel__cards" id="duelCards" style="display:none">
      <div class="duel__card" id="duelCardA" onclick="handleDuelChoice('A')">
        <img class="duel__card-img" id="duelImgA"
             src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="">
        <div class="duel__card-name" id="duelNameA"></div>
        <div class="duel__card-team" id="duelTeamA"></div>
        <div class="duel__card-stat" id="duelStatA" style="display:none"></div>
      </div>
      <div class="duel__vs">VS</div>
      <div class="duel__card" id="duelCardB" onclick="handleDuelChoice('B')">
        <img class="duel__card-img" id="duelImgB"
             src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="">
        <div class="duel__card-name" id="duelNameB"></div>
        <div class="duel__card-team" id="duelTeamB"></div>
        <div class="duel__card-stat" id="duelStatB" style="display:none"></div>
      </div>
    </div>

    <button id="duelStartBtn" class="duel__start-btn" onclick="startDuel()">⚡ Start Duel</button>

    <div id="duelResult" class="duel__result" style="display:none">
      <div id="duelResultText" class="duel__result-text"></div>
      <div class="duel__final-stats">
        <div>Score: <span id="duelFinalScore">0</span></div>
        <div>Best Combo: <span id="duelFinalCombo">0</span></div>
      </div>
      <button class="duel__start-btn" onclick="startDuel()">🔄 Play Again</button>
    </div>
  </div>

  <!-- Roster Rush -->
  <div id="rosterContainer" class="roster" style="display:none">
    <div class="roster__header">
      <div class="roster__score">Score: <span id="rosterScore">0</span></div>
      <div class="roster__timer" id="rosterTimer">2:00</div>
      <div class="roster__best" id="rosterBest">Best: 0</div>
    </div>

    <div class="roster__team" id="rosterTeamDisplay"></div>
    <div class="roster__progress">Found: <span id="rosterFound">0</span> / <span id="rosterTotal">0</span></div>

    <div class="roster__search" id="rosterSearchWrap" style="display:none">
      <input type="text" id="rosterSearchInput" class="roster__search-input"
             placeholder="🔍 Type a player name..." autocomplete="off"
             autocorrect="off" autocapitalize="off" spellcheck="false">
      <div id="rosterDropdown" class="roster__dropdown"></div>
    </div>

    <div class="roster__list" id="rosterList"></div>

    <button id="rosterStartBtn" class="roster__start-btn" onclick="startRoster()">🧩 Start Roster Rush</button>

    <div id="rosterResult" class="roster__result" style="display:none">
      <div class="roster__result-text" id="rosterResultText"></div>
      <button class="roster__start-btn" onclick="startRoster()">🔄 Play Again</button>
    </div>
  </div>
</div>

<!-- Game Over Overlay -->
<div id="overlay" class="overlay">
  <div class="overlay__card">
    <div id="overlayTitle" class="overlay__title"></div>
    <div id="overlaySubtitle" class="overlay__subtitle"></div>
    <div id="overlayAnswer" class="overlay__answer"></div>
    <div id="overlayAnswerTeam" class="overlay__answer-team"></div>
    <div id="shareGrid" class="share__grid"></div>
    <button id="shareBtn" class="share__btn">📋 Copy Share</button>
    <button id="playAgainBtn" class="share__btn share__btn--play-again">▶ Play Again</button>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="toast"></div>

<script>
// ═══════════════════════════════════════════════════════════════
// PLAYER DATA — Current Season (auto-generated)
// ═══════════════════════════════════════════════════════════════
{players_data}

// ═══════════════════════════════════════════════════════════════
// PLAYER DATA — 2012-13 Season (auto-generated)
// ═══════════════════════════════════════════════════════════════
{players_2013}

// ═══════════════════════════════════════════════════════════════
// GAME LOGIC
// ═══════════════════════════════════════════════════════════════
{game_js}
</script>

</body>
</html>'''

output_path = os.path.join(PROJECT_DIR, 'index.html')
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(html)

size_kb = os.path.getsize(output_path) / 1024
print(f"Built index.html ({size_kb:.0f} KB)")
