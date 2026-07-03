"""
Fix missing players — find active players not in players.js and add them.
"""
import json
import time
import sys
import os
from datetime import datetime
from nba_api.stats.endpoints import commonallplayers, commonplayerinfo

# ── Same mappings as collect_data.py ──────────────────────────────────────
TEAM_META = {
    "ATL": {"conf": "East", "div": "Southeast"},
    "BOS": {"conf": "East", "div": "Atlantic"},
    "BKN": {"conf": "East", "div": "Atlantic"},
    "CHA": {"conf": "East", "div": "Southeast"},
    "CHI": {"conf": "East", "div": "Central"},
    "CLE": {"conf": "East", "div": "Central"},
    "DET": {"conf": "East", "div": "Central"},
    "IND": {"conf": "East", "div": "Central"},
    "MIA": {"conf": "East", "div": "Southeast"},
    "MIL": {"conf": "East", "div": "Central"},
    "NYK": {"conf": "East", "div": "Atlantic"},
    "ORL": {"conf": "East", "div": "Southeast"},
    "PHI": {"conf": "East", "div": "Atlantic"},
    "TOR": {"conf": "East", "div": "Atlantic"},
    "WAS": {"conf": "East", "div": "Southeast"},
    "DAL": {"conf": "West", "div": "Southwest"},
    "DEN": {"conf": "West", "div": "Northwest"},
    "GSW": {"conf": "West", "div": "Pacific"},
    "HOU": {"conf": "West", "div": "Southwest"},
    "LAC": {"conf": "West", "div": "Pacific"},
    "LAL": {"conf": "West", "div": "Pacific"},
    "MEM": {"conf": "West", "div": "Southwest"},
    "MIN": {"conf": "West", "div": "Northwest"},
    "NOP": {"conf": "West", "div": "Southwest"},
    "OKC": {"conf": "West", "div": "Northwest"},
    "PHX": {"conf": "West", "div": "Pacific"},
    "POR": {"conf": "West", "div": "Northwest"},
    "SAC": {"conf": "West", "div": "Pacific"},
    "SAS": {"conf": "West", "div": "Southwest"},
    "UTA": {"conf": "West", "div": "Northwest"},
}

def parse_position(pos_str):
    mapping = {"Guard": "G", "Forward": "F", "Center": "C"}
    parts = pos_str.split("-")
    return [mapping.get(p, p) for p in parts]

def height_to_inches(ht_str):
    try:
        feet, inches = ht_str.split("-")
        return int(feet) * 12 + int(inches)
    except:
        return 0

def calc_age(birthdate_str):
    try:
        birth = datetime.strptime(birthdate_str[:10], "%Y-%m-%d")
        today = datetime.now()
        age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        return age
    except:
        return 0

def load_existing_players(filepath):
    """Load current players.js and extract player IDs and NBA IDs."""
    with open(filepath, 'r') as f:
        content = f.read()
    start = content.index('[')
    end = content.rindex(']')
    players = json.loads(content[start:end+1])
    ids = {p.get('nbaId') for p in players if p.get('nbaId')}
    return players, ids

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(base_dir)
    players_path = os.path.join(project_dir, 'data', 'players.js')

    # Load existing
    existing_players, existing_nba_ids = load_existing_players(players_path)
    print(f"Loaded {len(existing_players)} existing players")

    # Fetch all active players
    print("Fetching active player list from NBA API...")
    all_players = commonallplayers.CommonAllPlayers(league_id="00")
    df = all_players.get_data_frames()[0]
    active = df[df["ROSTERSTATUS"] == 1]
    print(f"API reports {len(active)} active players")

    # Find missing
    missing = active[~active["PERSON_ID"].isin(existing_nba_ids)]
    print(f"Missing from data: {len(missing)} players")

    if len(missing) == 0:
        print("No missing players — data is complete!")
        return

    print("\nMissing players:")
    for _, row in missing.iterrows():
        print(f"  {row['DISPLAY_FIRST_LAST']} ({row['TEAM_ABBREVIATION']}) — NBA ID: {row['PERSON_ID']}")

    # Fetch details for missing players
    next_id = len(existing_players)
    new_players = []
    errors = []

    for i, (_, row) in enumerate(missing.iterrows()):
        pid = row["PERSON_ID"]
        name = row["DISPLAY_FIRST_LAST"]
        team_abbr = row["TEAM_ABBREVIATION"]

        try:
            info = commonplayerinfo.CommonPlayerInfo(player_id=int(pid))
            info_df = info.get_data_frames()[0]
            r = info_df.iloc[0]

            pos = parse_position(r["POSITION"])
            ht = r["HEIGHT"]
            ht_inches = height_to_inches(ht)
            age = calc_age(r["BIRTHDATE"])
            jersey = str(r["JERSEY"])
            actual_team = r["TEAM_ABBREVIATION"]
            team_meta = TEAM_META.get(actual_team, {"conf": "Unknown", "div": "Unknown"})

            player = {
                "id": next_id,
                "name": name,
                "team": actual_team,
                "conf": team_meta["conf"],
                "div": team_meta["div"],
                "pos": pos,
                "ht": ht,
                "htInches": ht_inches,
                "age": age,
                "jersey": jersey,
                "formerTeams": [],
                "nbaId": int(pid),
            }
            new_players.append(player)
            next_id += 1
            print(f"  [{i+1}/{len(missing)}] ✅ {name} ({actual_team})")
            time.sleep(0.6)

        except Exception as e:
            errors.append({"name": name, "id": pid, "error": str(e)})
            print(f"  [{i+1}/{len(missing)}] ❌ {name}: {e}")
            time.sleep(1)

    if errors:
        print(f"\n{len(errors)} errors during fetch: {errors}")

    # Append to existing players
    all_players_list = existing_players + new_players
    # Re-index IDs
    for i, p in enumerate(all_players_list):
        p["id"] = i

    # Export
    with open(players_path, 'w', encoding='utf-8') as f:
        f.write("// Auto-generated NBA player data\n")
        f.write(f"// Generated: {datetime.now().isoformat()}\n")
        f.write(f"// Total players: {len(all_players_list)}\n\n")
        f.write("const PLAYERS = [\n")
        for i, p in enumerate(all_players_list):
            pos_str = json.dumps(p["pos"])
            former_str = json.dumps(p.get("formerTeams", []))
            comma = "," if i < len(all_players_list) - 1 else ""
            f.write(
                f'  {{"id":{p["id"]},"name":{json.dumps(p["name"])},"team":"{p["team"]}",'
                f'"conf":"{p["conf"]}","div":"{p["div"]}","pos":{pos_str},'
                f'"ht":"{p["ht"]}","htInches":{p["htInches"]},"age":{p["age"]},'
                f'"jersey":{json.dumps(p["jersey"])},"formerTeams":{former_str},"nbaId":{p["nbaId"]}}}{comma}\n'
            )
        f.write("];\n")

    print(f"\nDone! {len(all_players_list)} total players ({len(new_players)} new)")

    # Also run former teams merge for new players
    print("\n⚠️  Remember to re-run former teams merge for new players!")

if __name__ == "__main__":
    main()
