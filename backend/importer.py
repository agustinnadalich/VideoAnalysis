
from sqlalchemy.orm import Session
from db import SessionLocal
from models import Club, Team, Player, Match, Event
from normalizer import normalize_excel_to_json
from datetime import datetime, date, time
import math


def clean_extra_data(data):
    def convert(v):
        if isinstance(v, (date, time)):
            return v.isoformat()
        return v
    return {k: convert(v) for k, v in data.items() if v is not None}


def import_match_from_excel(excel_path: str, profile: dict):
    print(f"📥 Normalizando archivo: {excel_path}")
    data = normalize_excel_to_json(excel_path, profile)

    if not data or "match" not in data or "events" not in data:
        print("❌ Error: archivo no contiene información válida")
        return

    match_info = data["match"]
    events = data["events"]

    db: Session = SessionLocal()
    try:
        # Crear o buscar club
        club = db.query(Club).filter_by(name=match_info["team"]).first()
        if not club:
            club = Club(name=match_info["team"])
            db.add(club)
            db.commit()
            print(f"✅ Club creado: {club.name}")

        # Crear o buscar equipo
        team = db.query(Team).filter_by(name=match_info["team"], club_id=club.id).first()
        if not team:
            team = Team(name=match_info["team"], club_id=club.id, category="Senior", season=str(match_info["date"][:4]))
            db.add(team)
            db.commit()
            print(f"✅ Equipo creado: {team.name}")

        # Crear partido
        match_date = datetime.strptime(match_info["date"], "%Y-%m-%d").date()
        match = Match(
            team_id=team.id,
            opponent_name=match_info["opponent"],
            date=match_date,
            location=match_info.get("location", "Desconocido"),
            video_url=""
        )
        db.add(match)
        db.commit()
        print(f"✅ Partido creado: vs {match.opponent_name} en {match.location}")

        # Insertar jugadores y eventos
        player_cache = {}

        for ev in events:
            raw_player = ev.get("player", "")
            player_name = str(raw_player).strip() if raw_player else "Desconocido"

            if player_name not in player_cache:
                player = db.query(Player).filter_by(full_name=player_name).first()
                if not player:
                    player = Player(full_name=player_name)
                    db.add(player)
                    db.commit()
                player_cache[player_name] = player
            else:
                player = player_cache[player_name]

            raw_time = ev.get("timestamp_sec")
            x = ev.get("x")
            x = None if x is None or (isinstance(x, float) and math.isnan(x)) else x
            y = ev.get("y")
            y = None if y is None or (isinstance(y, float) and math.isnan(y)) else y

            event = Event(
                match_id=match.id,
                player_id=player.id,
                event_type=str(ev.get("event_type")),
                timestamp_sec=int(raw_time) if raw_time and not math.isnan(raw_time) else 0,
                x=x,
                y=y,
                tag=ev.get("tag"),
                phase=ev.get("phase"),
                origin=ev.get("origin"),
                outcome=ev.get("outcome"),
                notes=ev.get("notes"),
                extra_data=clean_extra_data(ev.get("extra_data", {}))
            )
            db.add(event)

        db.commit()
        print("✅ Eventos insertados correctamente.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error al importar: {e}")
    finally:
        db.close()

# Ejemplo de uso directo
if __name__ == "__main__":
    profile = {
        "events_sheet": "MATRIZ",
        "meta_sheet": "MATCHES",
        "col_event_type": "CATEGORY",
        "col_player": "PLAYER",
        "col_time": "SECOND",
        "col_x": "COORDINATE_X",
        "col_y": "COORDINATE_Y",
        "team": "Pescara Rugby"
    }

    import_match_from_excel("uploads/SERIE_B_PRATO_match_2.xlsx", profile)



