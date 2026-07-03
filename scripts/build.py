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
    <p class="header__subtitle">Guess the hidden player — endless mode</p>
    <div class="mode-tabs">
      <button id="modeCurrent" class="mode-tab mode-tab--active">🗽 群雄逐鹿</button>
      <button id="mode2013" class="mode-tab">👑 吾皇登基</button>
    </div>
    <button id="newGameBtn" class="header__new-game">🔄 New Game</button>
  </header>

  <!-- Search -->
  <div class="search-wrapper">
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
  <div class="silhouette">
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
// Active dataset reference
// ═══════════════════════════════════════════════════════════════
let PLAYERS = PLAYERS_CURRENT;

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
