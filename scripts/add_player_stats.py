"""
Add per-game stats to current players data.
Fetches stats from NBA API and matches by player ID.
"""
import json
import os
import sys
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

# Stats to collect from API → player field name
STAT_FIELDS = {
    'GP': 'gp',
    'PTS': 'pts',
    'REB': 'reb',
    'AST': 'ast',
    'STL': 'stl',
    'BLK': 'blk',
    'TOV': 'tov',
    'FG_PCT': 'fgPct',
    'FG3_PCT': 'fg3Pct',
    'FT_PCT': 'ftPct',
}

def fetch_stats():
    """Fetch per-game stats for 2025-26 season."""
    from nba_api.stats.endpoints import leaguedashplayerstats
    print("Fetching stats from NBA API (2025-26 season)...")
    df = leaguedashplayerstats.LeagueDashPlayerStats(
        season='2025-26',
        per_mode_detailed='PerGame'
    ).get_data_frames()[0]

    # Build lookup by PLAYER_ID
    stats_by_id = {}
    for _, row in df.iterrows():
        pid = int(row['PLAYER_ID'])
        stats_by_id[pid] = {field: round(row[api_field], 3) if 'PCT' in api_field else int(row[api_field])
                           for api_field, field in STAT_FIELDS.items()}

    print(f"  Fetched stats for {len(stats_by_id)} players")
    return stats_by_id


def load_players():
    filepath = os.path.join(PROJECT_DIR, 'data', 'players.js')
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    start = content.index('[')
    end = content.rindex(']')
    json_str = content[start:end + 1]
    return json.loads(json_str), content[:start], content[end+1:]


def main():
    stats_by_id = fetch_stats()

    players, prefix, suffix = load_players()
    print(f"Loaded {len(players)} current players")

    matched = 0
    missing = 0

    for p in players:
        nba_id = p.get('nbaId')
        if nba_id and nba_id in stats_by_id:
            p['stats'] = stats_by_id[nba_id]
            matched += 1
        else:
            # Player with no stats (didn't play, rookie not yet, etc.)
            p['stats'] = {'gp': 0, 'pts': 0, 'reb': 0, 'ast': 0, 'stl': 0,
                          'blk': 0, 'tov': 0, 'fgPct': 0, 'fg3Pct': 0, 'ftPct': 0}
            missing += 1
            if missing <= 10:
                print(f"  Missing stats: {p['name']} (ID: {nba_id})")

    print(f"Matched: {matched}, Missing: {missing}")

    # Write updated file
    output_path = os.path.join(PROJECT_DIR, 'data', 'players.js')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(prefix)
        f.write('[\n')
        for i, p in enumerate(players):
            comma = ',' if i < len(players) - 1 else ''
            json_line = json.dumps(p, ensure_ascii=False)
            f.write(f'  {json_line}{comma}\n')
        f.write(']\n')
        f.write(suffix)

    size_kb = os.path.getsize(output_path) / 1024
    print(f"\nExported: {output_path} ({size_kb:.0f} KB)")

    # Show sample stats
    stars = ['LeBron James', 'Stephen Curry', 'Giannis Antetokounmpo', 'Luka Doncic',
             'Kevin Durant', 'Nikola Jokic', 'Jayson Tatum']
    print("\nSample stats:")
    for p in players:
        if p['name'] in stars:
            s = p['stats']
            print(f"  {p['name']}: {s['pts']}pts {s['reb']}reb {s['ast']}ast "
                  f"({s['fgPct']:.1%} FG / {s['fg3Pct']:.1%} 3P / {s['ftPct']:.1%} FT)")


if __name__ == '__main__':
    main()
