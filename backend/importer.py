
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
            video_url=match_info.get("video_url", ""),
            competition=match_info.get("competition"),
            round=match_info.get("round"),
            field=match_info.get("field"),
            rain=match_info.get("rain"),
            muddy=match_info.get("muddy"),
            wind_1p=match_info.get("wind_1p"),
            wind_2p=match_info.get("wind_2p"),
            referee=match_info.get("referee"),
            result=match_info.get("result")
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


def import_match_from_json(data: dict):
    db = SessionLocal()
    try:
        match_data = data.get("match")
        events_data = data.get("events")

        if not match_data or not events_data:
            raise ValueError("Faltan datos de partido o eventos")

        team_name = match_data.get("team", "Equipo Desconocido")

        # Crear o buscar club
        club = db.query(Club).filter_by(name=team_name).first()
        if not club:
            club = Club(name=team_name)
            db.add(club)
            db.commit()

        # Crear o buscar equipo
        team = db.query(Team).filter_by(name=team_name, club_id=club.id).first()
        if not team:
            season = str(match_data.get("date", "")).split("-")[0]
            team = Team(name=team_name, club_id=club.id, category="Senior", season=season)
            db.add(team)
            db.commit()

        # Crear partido
        match_date = match_data.get("date")
        if isinstance(match_date, str):
            match_date = datetime.strptime(match_date, "%Y-%m-%d").date()

        match = Match(
            team_id=team.id,
            opponent_name=match_data.get("opponent"),
            date=match_date,
            location=match_data.get("location"),
            competition=match_data.get("competition"),
            round=match_data.get("round"),
            field=match_data.get("field"),
            rain=match_data.get("rain"),
            muddy=match_data.get("muddy"),
            wind_1p=match_data.get("wind_1p"),
            wind_2p=match_data.get("wind_2p"),
            referee=match_data.get("referee"),
            video_url=match_data.get("video"),
            result=match_data.get("result")
        )
        db.add(match)
        db.commit()

        player_cache = {}

        for ev in events_data:
            player_name = str(ev.get("player", "Desconocido")).strip()

            if player_name not in player_cache:
                player = db.query(Player).filter_by(full_name=player_name).first()
                if not player:
                    player = Player(full_name=player_name)
                    db.add(player)
                    db.commit()
                player_cache[player_name] = player
            else:
                player = player_cache[player_name]

            # Sanear valores
            x = ev.get("x")
            x = None if x is None or (isinstance(x, float) and math.isnan(x)) else x
            y = ev.get("y")
            y = None if y is None or (isinstance(y, float) and math.isnan(y)) else y
            ts = ev.get("timestamp_sec")
            ts = int(ts) if ts is not None and not math.isnan(ts) else 0

            event = Event(
                match_id=match.id,
                player_id=player.id,
                event_type=ev.get("event_type"),
                timestamp_sec=ts,
                x=x,
                y=y,
                extra_data=clean_extra_data(ev.get("extra_data", {})),
                tag=ev.get("tag"),
                phase=ev.get("phase"),
                origin=ev.get("origin"),
                outcome=ev.get("outcome"),
                notes=ev.get("notes")
            )
            db.add(event)

        db.commit()

    except Exception as e:
        db.rollback()
        raise e
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



