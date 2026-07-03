"""
Collect former teams for active NBA players.
Queries LeagueDashPlayerStats for past 10 seasons to build team history.
"""
import json
import time
from datetime import datetime
from nba_api.stats.endpoints import leaguedashplayerstats, commonallplayers

# Seasons to check (going back 10 years)
SEASONS = [
    '2024-25', '2023-24', '2022-23', '2021-22', '2020-21',
    '2019-20', '2018-19', '2017-18', '2016-17', '2015-16'
]

def collect_team_history():
    """Build player_id -> set of teams across all seasons."""
    history = {}  # player_id -> set of team abbreviations

    for season in SEASONS:
        try:
            print(f"Fetching {season}...", end=" ")
            stats = leaguedashplayerstats.LeagueDashPlayerStats(
                season=season,
                season_type_all_star='Regular Season',
                measure_type_detailed_defense='Base',
                per_mode_detailed='Totals'
            )
            df = stats.get_data_frames()[0]
            for _, row in df.iterrows():
                pid = int(row['PLAYER_ID'])
                team = row['TEAM_ABBREVIATION']
                if pid not in history:
                    history[pid] = set()
                history[pid].add(team)
            print(f"{len(df)} records")
            time.sleep(0.6)
        except Exception as e:
            print(f"ERROR: {e}")
            time.sleep(1)

    print(f"\nTotal players with history: {len(history)}")
    return history

def export_former_teams(history, filepath):
    """Export as JSON: {player_id: [team1, team2, ...]}"""
    # Convert sets to sorted lists
    export = {str(pid): sorted(list(teams)) for pid, teams in history.items()}
    with open(filepath, 'w') as f:
        json.dump(export, f)
    print(f"Exported to {filepath}")

if __name__ == '__main__':
    history = collect_team_history()
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output = os.path.join(script_dir, '..', 'data', 'former_teams.json')
    export_former_teams(history, output)

    # Stats
    multi_team = sum(1 for teams in history.values() if len(teams) > 1)
    print(f"Players with multiple teams: {multi_team}")
    print(f"Max teams: {max(len(t) for t in history.values())}")
