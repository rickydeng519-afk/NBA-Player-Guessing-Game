"""
Build former teams data for 2012-13 season players.
Uses a hardcoded lookup for the ~80 most notable players who changed teams.
For remaining players, formerTeams stays empty (mostly rookies or single-team career).
"""
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

# Key 2012-13 players with known former teams (teams played for BEFORE 2012-13)
# Format: 'Player Name': ['ABBR', ...]  (these are teams they played for BEFORE 2012-13)
KNOWN_FORMER = {
    # ── Miami Heat (2013 champions) ──
    'LeBron James': ['CLE'],
    'Chris Bosh': ['TOR'],
    'Ray Allen': ['MIL', 'SEA', 'BOS'],
    'Rashard Lewis': ['SEA', 'ORL', 'WAS'],
    'Shane Battier': ['MEM', 'HOU'],
    'Mike Miller': ['ORL', 'MEM', 'MIN'],

    # ── Boston Celtics ──
    'Kevin Garnett': ['MIN'],
    'Jason Terry': ['ATL', 'DAL'],

    # ── Los Angeles Lakers ──
    'Pau Gasol': ['MEM'],
    'Steve Nash': ['PHX', 'DAL'],
    'Dwight Howard': ['ORL'],
    'Metta World Peace': ['CHI', 'IND', 'SAC', 'HOU'],
    'Steve Blake': ['WAS', 'POR', 'MIL', 'DEN', 'LAC'],

    # ── Houston Rockets ──
    'James Harden': ['OKC'],
    'Jeremy Lin': ['GSW', 'NYK'],
    'Omer Asik': ['CHI'],

    # ── Dallas Mavericks ──
    'Vince Carter': ['TOR', 'BKN', 'ORL', 'PHX'],
    'Elton Brand': ['CHI', 'LAC', 'PHI'],
    'Shawn Marion': ['PHX', 'MIA', 'TOR'],
    'Chris Kaman': ['LAC', 'NOP'],

    # ── LA Clippers ──
    'Chris Paul': ['NOP'],
    'Chauncey Billups': ['BOS', 'TOR', 'DEN', 'MIN', 'DET', 'NYK'],
    'Grant Hill': ['DET', 'ORL', 'PHX'],
    'Jamal Crawford': ['CHI', 'NYK', 'GSW', 'ATL', 'POR'],
    'Lamar Odom': ['LAC', 'MIA', 'LAL', 'DAL'],
    'Matt Barnes': ['LAC', 'SAC', 'NYK', 'PHI', 'GSW', 'PHX', 'ORL', 'LAL'],

    # ── New York Knicks ──
    'Carmelo Anthony': ['DEN'],
    'Amar e Stoudemire': ['PHX'],
    'Tyson Chandler': ['CHI', 'NOP', 'CHA', 'DAL'],
    'Jason Kidd': ['DAL', 'PHX', 'BKN'],
    'Marcus Camby': ['TOR', 'NYK', 'DEN', 'LAC', 'POR', 'HOU'],
    'Kenyon Martin': ['BKN', 'DEN', 'LAC'],
    'Rasheed Wallace': ['WAS', 'POR', 'ATL', 'DET', 'BOS'],

    # ── Brooklyn Nets ──
    'Joe Johnson': ['BOS', 'PHX', 'ATL'],
    'Deron Williams': ['UTA'],
    'Gerald Wallace': ['SAC', 'CHA', 'POR'],

    # ── San Antonio Spurs ──
    'Stephen Jackson': ['BKN', 'IND', 'GSW', 'CHA', 'MIL'],
    'Boris Diaw': ['ATL', 'PHX', 'CHA'],

    # ── Denver Nuggets ──
    'Andre Iguodala': ['PHI'],
    'Andre Miller': ['CLE', 'LAC', 'PHI', 'POR'],
    'Corey Brewer': ['MIN', 'DAL'],

    # ── Memphis Grizzlies ──
    'Zach Randolph': ['POR', 'NYK', 'LAC'],
    'Tayshaun Prince': ['DET'],

    # ── Golden State Warriors ──
    'Richard Jefferson': ['BKN', 'MIL', 'SAS'],
    'Jarrett Jack': ['POR', 'IND', 'TOR', 'NOP'],
    'Carl Landry': ['HOU', 'SAC', 'NOP'],

    # ── Atlanta Hawks ──
    'Devin Harris': ['DAL', 'BKN', 'UTA'],
    'Kyle Korver': ['PHI', 'UTA', 'CHI'],

    # ── Chicago Bulls ──
    'Carlos Boozer': ['CLE', 'UTA'],
    'Richard Hamilton': ['WAS', 'DET'],
    'Kirk Hinrich': ['ATL', 'WAS'],
    'Nate Robinson': ['NYK', 'BOS', 'OKC', 'GSW'],

    # ── Indiana Pacers ──
    'David West': ['NOP'],
    'George Hill': ['SAS'],

    # ── Milwaukee Bucks ──
    'Monta Ellis': ['GSW'],
    'Samuel Dalembert': ['PHI', 'SAC', 'HOU'],

    # ── Toronto Raptors ──
    'Rudy Gay': ['MEM'],
    'Kyle Lowry': ['MEM', 'HOU'],

    # ── Detroit Pistons ──
    'Corey Maggette': ['ORL', 'LAC', 'GSW', 'MIL', 'CHA'],
    'Jose Calderon': ['TOR'],

    # ── Orlando Magic ──
    'Al Harrington': ['IND', 'ATL', 'GSW', 'NYK', 'DEN'],
    'Arron Afflalo': ['DET', 'DEN'],
    'Glen Davis': ['BOS'],

    # ── Charlotte Bobcats ──
    'Ben Gordon': ['CHI', 'DET'],

    # ── Washington Wizards ──
    'Trevor Ariza': ['NYK', 'ORL', 'LAL', 'HOU', 'NOP'],
    'Emeka Okafor': ['CHA', 'NOP'],

    # ── Utah Jazz ──
    'Mo Williams': ['MIL', 'CLE', 'LAC'],
    'Marvin Williams': ['ATL'],
    'Al Jefferson': ['BOS', 'MIN'],

    # ── Minnesota Timberwolves ──
    'Andrei Kirilenko': ['UTA'],

    # ── Phoenix Suns ──
    'Goran Dragic': ['HOU'],
    'Luis Scola': ['HOU'],

    # ── Portland Trail Blazers ──
    'Raymond Felton': ['CHA', 'NYK', 'DEN'],

    # ── Sacramento Kings ──
    'Chuck Hayes': ['HOU'],
}

def load_2013_players():
    filepath = os.path.join(PROJECT_DIR, 'data', 'players_2013.js')
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    start = content.index('[')
    end = content.rindex(']')
    json_str = content[start:end + 1]
    return json.loads(json_str)


def main():
    print("=== Building 2012-13 Former Teams Data ===\n")

    players = load_2013_players()
    print(f"Loaded {len(players)} players from players_2013.js")

    matched = 0
    total_with_history = 0

    for p in players:
        name = p['name']
        if name in KNOWN_FORMER:
            p['formerTeams'] = KNOWN_FORMER[name]
            matched += 1
            if p['formerTeams']:
                total_with_history += 1
        else:
            p['formerTeams'] = []

    print(f"Matched: {matched}/{len(players)}")
    print(f"Players with ≥1 former team: {total_with_history}")

    # Write updated file
    output_path = os.path.join(PROJECT_DIR, 'data', 'players_2013.js')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("// Auto-generated NBA player data — 2012-13 Season\n")
        f.write(f"// Total players: {len(players)}\n")
        f.write(f"// Former teams: hand-curated for {matched} notable players\n\n")
        f.write("const PLAYERS_2013 = [\n")
        for i, p in enumerate(players):
            pos_str = json.dumps(p['pos'])
            former_str = json.dumps(p['formerTeams'])
            comma = "," if i < len(players) - 1 else ""
            f.write(
                f'  {{"id":{p["id"]},"name":{json.dumps(p["name"])},"team":"{p["team"]}",'
                f'"conf":"{p["conf"]}","div":"{p["div"]},"pos":{pos_str},'
                f'"ht":"{p["ht"]},"htInches":{p["htInches"]},"age":{p["age"]},'
                f'"jersey":{json.dumps(p["jersey"])},"formerTeams":{former_str},'
                f'"nbaId":{p["nbaId"]}}}{comma}\n'
            )
        f.write("];\n")

    print(f"\nExported to {output_path}")

    # Show examples
    print("\nPlayers with ≥2 former teams:")
    for p in players:
        if len(p['formerTeams']) >= 2:
            print(f"  {p['name']} ({p['team']}) ← {p['formerTeams']}")

    print(f"\nPlayers with exactly 1 former team:")
    count = 0
    for p in players:
        if len(p['formerTeams']) == 1:
            print(f"  {p['name']} ({p['team']}) ← {p['formerTeams']}")
            count += 1
    print(f"  Total: {count}")

    print("\nDone!")


if __name__ == '__main__':
    main()
