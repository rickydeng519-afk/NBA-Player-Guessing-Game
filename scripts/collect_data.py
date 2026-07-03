"""
NBA Player Data Collection Script
Fetches active NBA players with full attributes from stats.nba.com via nba_api.
Outputs a JavaScript file with the PLAYERS array.
"""
import json
import time
import sys
from datetime import datetime
from nba_api.stats.endpoints import commonallplayers, commonplayerinfo
from nba_api.stats.static import teams

# ── Conference/Division Mapping ──────────────────────────────────────────
TEAM_META = {
    # Eastern Conference
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
    # Western Conference
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

# ── Position Mapping ─────────────────────────────────────────────────────
def parse_position(pos_str):
    """Convert API position string to array of short codes."""
    mapping = {"Guard": "G", "Forward": "F", "Center": "C"}
    parts = pos_str.split("-")
    return [mapping.get(p, p) for p in parts]

def height_to_inches(ht_str):
    """Convert '6-9' to total inches (81)."""
    try:
        feet, inches = ht_str.split("-")
        return int(feet) * 12 + int(inches)
    except:
        return 0

def calc_age(birthdate_str):
    """Calculate age from ISO birthdate string."""
    try:
        birth = datetime.strptime(birthdate_str[:10], "%Y-%m-%d")
        today = datetime.now()
        age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        return age
    except:
        return 0

# ── Main Collection ──────────────────────────────────────────────────────
def collect_players():
    print("Fetching active player list...")
    all_players = commonallplayers.CommonAllPlayers(league_id="00")
    df = all_players.get_data_frames()[0]
    active = df[df["ROSTERSTATUS"] == 1]
    total = len(active)
    print(f"Found {total} active roster players")

    players = []
    errors = []
    start_time = time.time()

    for i, row in active.iterrows():
        pid = row["PERSON_ID"]
        name = row["DISPLAY_FIRST_LAST"]
        team_abbr = row["TEAM_ABBREVIATION"]

        try:
            # Get detailed info
            info = commonplayerinfo.CommonPlayerInfo(player_id=int(pid))
            info_df = info.get_data_frames()[0]
            r = info_df.iloc[0]

            # Parse attributes
            pos = parse_position(r["POSITION"])
            ht = r["HEIGHT"]
            ht_inches = height_to_inches(ht)
            age = calc_age(r["BIRTHDATE"])
            jersey = str(r["JERSEY"])
            actual_team = r["TEAM_ABBREVIATION"]

            # Get conference/division
            team_meta = TEAM_META.get(actual_team, {"conf": "Unknown", "div": "Unknown"})

            player = {
                "id": len(players),
                "name": name,
                "team": actual_team,
                "conf": team_meta["conf"],
                "div": team_meta["div"],
                "pos": pos,
                "ht": ht,
                "htInches": ht_inches,
                "age": age,
                "jersey": jersey,
                "formerTeams": [],  # placeholder - to be filled later
            }
            players.append(player)

            # Progress
            elapsed = time.time() - start_time
            rate = (i + 1) / max(elapsed, 1)
            eta = (total - i - 1) / max(rate, 0.01)
            pct = (i + 1) / total * 100
            print(f"\r[{pct:.0f}%] {i+1}/{total}: {name} ({actual_team}) [ETA: {eta:.0f}s]   ", end="")

            time.sleep(0.6)  # Rate limiting

        except Exception as e:
            errors.append({"name": name, "id": pid, "error": str(e)})
            print(f"\n  ERROR on {name}: {e}")
            time.sleep(1)

    print(f"\n\nDone! Collected {len(players)} players, {len(errors)} errors")
    if errors:
        print("Errors:", json.dumps(errors[:5], indent=2))

    return players

def export_js(players, filepath):
    """Export players array as a JavaScript file."""
    lines = ["// Auto-generated NBA player data", f"// Generated: {datetime.now().isoformat()}",
             f"// Total players: {len(players)}", "", "const PLAYERS = ["]

    for p in players:
        pos_str = json.dumps(p["pos"])
        former_str = json.dumps(p["formerTeams"])
        line = (
            f'  {{id:{p["id"]},name:{json.dumps(p["name"])},team:"{p["team"]}",'
            f'conf:"{p["conf"]}",div:"{p["div"]}",pos:{pos_str},'
            f'ht:"{p["ht"]}",htInches:{p["htInches"]},age:{p["age"]},'
            f'jersey:{json.dumps(p["jersey"])},formerTeams:{former_str}}}'
        )
        lines.append(line)

    lines.append("];")
    lines.append("")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(",\n".join(l.replace(",", ",\n", 1) if i > 0 and i < len(lines) - 2 else l
                          for i, l in enumerate(lines)).replace(
            '"},\n  {', '"},\n  {'))

    # Simpler approach:
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("// Auto-generated NBA player data\n")
        f.write(f"// Generated: {datetime.now().isoformat()}\n")
        f.write(f"// Total players: {len(players)}\n\n")
        f.write("const PLAYERS = [\n")
        for i, p in enumerate(players):
            pos_str = json.dumps(p["pos"])
            former_str = json.dumps(p["formerTeams"])
            comma = "," if i < len(players) - 1 else ""
            f.write(
                f'  {{"id":{p["id"]},"name":{json.dumps(p["name"])},"team":"{p["team"]}",'
                f'"conf":"{p["conf"]}","div":"{p["div"]}","pos":{pos_str},'
                f'"ht":"{p["ht"]}","htInches":{p["htInches"]},"age":{p["age"]},'
                f'"jersey":{json.dumps(p["jersey"])},"formerTeams":{former_str}}}{comma}\n'
            )
        f.write("];\n")

    print(f"Exported to {filepath}")

if __name__ == "__main__":
    players = collect_players()
    output_path = sys.argv[1] if len(sys.argv) > 1 else "../data/players.js"
    export_js(players, output_path)
