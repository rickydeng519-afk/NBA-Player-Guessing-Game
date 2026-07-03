"""
Merge player data with former teams.
Reads players.js and former_teams.json, adds formerTeams to each player,
then writes the final players.js.
"""
import json
import os
import sys

def load_former_teams(filepath):
    """Load {player_id: [team1, team2, ...]} mapping."""
    with open(filepath, 'r') as f:
        return json.load(f)

def load_players_from_js(filepath):
    """Parse players from JS const PLAYERS = [...]; format."""
    with open(filepath, 'r') as f:
        content = f.read()

    # Extract the JSON array between '[' and '];'
    start = content.index('[')
    end = content.rindex(']')
    json_str = content[start:end+1]
    return json.loads(json_str)

def find_player_id_in_history(name, history, players_js_raw):
    """Try to find a player's ID in the history mapping."""
    # TODO: we need player IDs. The main script should save them.
    pass

def main():
    players_path = sys.argv[1] if len(sys.argv) > 1 else 'data/players.js'
    former_path = sys.argv[2] if len(sys.argv) > 2 else 'data/former_teams.json'
    output_path = players_path  # overwrite

    print(f"Loading former teams from {former_path}...")
    former_teams = load_former_teams(former_path)
    print(f"Loaded {len(former_teams)} players with team history")

    print(f"Loading players from {players_path}...")
    players = load_players_from_js(players_path)
    print(f"Loaded {len(players)} players")

    # We need to match players by name since the player IDs
    # from CommonAllPlayers differ from LeagueDashPlayerStats
    # Build a lookup: name -> set of historical teams
    name_to_teams = {}
    # Unfortunately, we can't reliably match by name alone
    # We saved player IDs from different endpoints
    # Let's rebuild - the main script needs to include API player IDs

    print("Note: merging requires matching player IDs between datasets.")
    print("Will implement after checking ID compatibility.")

if __name__ == '__main__':
    main()
