import os
import math
import xml.etree.ElementTree as ET
from datetime import datetime, date, time
from sqlalchemy.orm import Session
from db import SessionLocal
from models import Club, Team, Player, Match, Event
from normalizer import normalize_excel_to_json

def clean_extra_data(data):
    def convert(v):
        if isinstance(v, (date, time)):
            return v.isoformat()
        return v
    return {k: convert(v) for k, v in data.items() if v is not None}

def create_or_get_player(db, player_name):
    """
    Devuelve un jugador existente o lo crea si no existe.
    """
    name = str(player_name).strip() if player_name else "Desconocido"
    player = db.query(Player).filter_by(full_name=name).first()
    if not player:
        player = Player(full_name=name)
        db.add(player)
        db.commit()
    return player

def import_match_from_xml(xml_path: str, profile: dict):
    """
    Importa un partido y sus eventos desde un archivo XML con la estructura de LongoMatch/Sportscode/Nacsport.
    Extrae: evento, categoría, tiempo, duración, descriptores, jugadores (array), coordenadas X/Y si existen.
    Si hay labels sin group, se listan en la preview para que el usuario los asigne manualmente.
    """
    if not os.path.exists(xml_path):
        print(f"❌ El archivo {xml_path} no existe.")
        return False

    print(f"🔍 Iniciando importación desde XML: {xml_path}")
    db = SessionLocal()
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        print(f"✅ XML parseado correctamente: {xml_path}")

        # Metadata básica (puede mejorarse con más info del XML)
        match_info = {
            "team": profile.get("team", "Desconocido"),
            "opponent_name": profile.get("opponent", "Rival"),
            "date": profile.get("date", "2023-01-01"),
        }
        print(f"🔍 Metadatos del partido extraídos: {match_info}")

        events = []
        labels_without_group = set()

        for inst in root.findall(".//instance"):
            event_type = inst.findtext("code", default="")
            start = inst.findtext("start", default="0")
            end = inst.findtext("end", default="0")
            try:
                timestamp_sec = float(start)
                duration = float(end) - float(start)
            except Exception:
                timestamp_sec = 0
                duration = 0

            # Descriptores y jugadores
            extra_data = {}
            players = []
            x = None
            y = None

            for label in inst.findall("label"):
                group = label.findtext("group")
                text = label.findtext("text")
                if group:
                    # Jugadores
                    if group.strip().upper() == "JUGADOR" and text:
                        players.append(text.strip())
                    # Coordenadas (si existen)
                    elif group.strip().upper() == "X":
                        try:
                            x = float(text)
                        except Exception:
                            pass
                    elif group.strip().upper() == "Y":
                        try:
                            y = float(text)
                        except Exception:
                            pass
                    else:
                        # Otros descriptores
                        extra_data[group.strip()] = text.strip() if text else ""
                else:
                    # Label sin group: pedir al usuario en la preview
                    if text:
                        labels_without_group.add(text.strip())

            event = {
                "event_type": event_type.strip(),
                "timestamp_sec": timestamp_sec,
                "duration": duration,
                "players": players if players else None,
                "x": x,
                "y": y,
                "extra_data": extra_data
            }
            events.append(event)

        print(f"✅ Eventos extraídos: {len(events)}")

        # Enriquecer eventos usando enricher
        from enricher import enrich_events
        try:
            events = enrich_events(events, match_info, profile)
            print(f"✅ Eventos enriquecidos correctamente.")
        except Exception as enrich_error:
            print(f"❌ Error en enriquecimiento de eventos: {enrich_error}")
            return False

        # Crear o buscar club/equipo/partido
        club = db.query(Club).filter_by(name=match_info["team"]).first()
        if not club:
            club = Club(name=match_info["team"])
            db.add(club)
            db.commit()
            print(f"✅ Club creado: {club.name}")

        team = db.query(Team).filter_by(name=match_info["team"], club_id=club.id).first()
        if not team:
            team = Team(name=match_info["team"], club_id=club.id, category="Senior", season=str(match_info["date"][:4]))
            db.add(team)
            db.commit()
            print(f"✅ Equipo creado: {team.name}")

        match_date = datetime.strptime(match_info["date"], "%Y-%m-%d").date()
        match = Match(
            team_id=team.id,
            opponent_name=match_info.get("opponent_name"),
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

        # Insertar eventos y jugadores
        for ev in events:
            # Si hay jugadores, crear todos
            player_ids = []
            if ev.get("players"):
                for pname in ev["players"]:
                    player = create_or_get_player(db, pname)
                    player_ids.append(player.id)
            # Usar el primer jugador como principal
            main_player_id = player_ids[0] if player_ids else None

            event = Event(
                match_id=match.id,
                player_id=main_player_id,
                event_type=str(ev.get("event_type")),
                timestamp_sec=ev.get("timestamp_sec", 0),
                x=ev.get("x"),
                y=ev.get("y"),
                extra_data=clean_extra_data(ev.get("extra_data", {}))
            )
            db.add(event)

        db.commit()
        print(f"✅ Eventos insertados correctamente. Total: {len(events)}")

        # Si hay labels sin group, devolverlos para la preview
        if labels_without_group:
            print(f"⚠️ Labels sin grupo detectados: {labels_without_group}")
            return {"labels_without_group": list(labels_without_group), "events": events, "match_info": match_info}

        return {"events": events, "match_info": match_info}

    except Exception as e:
        db.rollback()
        print(f"❌ Error al importar desde XML: {e}")
        return False
    finally:
        db.close()

def import_match_from_excel(excel_path: str, profile: dict):
    print(f"📥 Normalizando archivo: {excel_path}")
    data = normalize_excel_to_json(excel_path, profile)
    db = SessionLocal()

    if not data or "match" not in data or "events" not in data:
        print("❌ Error: archivo no contiene información válida")
        return

    match_info = data["match"]
    events = data["events"]

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
            player = create_or_get_player(db, ev.get("player"))
            raw_time = ev.get("timestamp_sec") or 0
            raw_time = int(raw_time) if not math.isnan(raw_time) else 0

            event = Event(
                match_id=match.id,
                player_id=player.id,
                event_type=str(ev.get("event_type")),  # 👈 Unificado
                timestamp_sec=raw_time,
                x=ev.get("x") if not (ev.get("x") is None or math.isnan(ev.get("x"))) else None,
                y=ev.get("y") if not (ev.get("y") is None or math.isnan(ev.get("y"))) else None,
                extra_data=clean_extra_data(ev.get("extra_data", {}))  # 👈 Aplicado
            )
            db.add(event)

        db.commit()
        print("✅ Eventos insertados correctamente.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error al importar: {e}")
    finally:
        db.close()

def import_match_from_json(data, profile):
    """
    Importa un partido y sus eventos desde un JSON previamente normalizado.
    """
    db = SessionLocal()
    try:
        print("🔄 Iniciando importación de datos a la base de datos...")
        match_info = data.get("match")
        events_data = data.get("events", [])

        if not match_info or not events_data:
            print("❌ Datos incompletos para importar.")
            return False

        print(f"📊 Importando partido: {match_info.get('team')} vs {match_info.get('opponent')}")
        print(f"📅 Fecha: {match_info.get('date')}")
        print(f"📈 Eventos a procesar: {len(events_data)}")

        # *** NUEVO: ENRIQUECER EVENTOS ANTES DE GUARDAR ***
        print("🔄 Enriqueciendo eventos...")
        from enricher import enrich_events
        enriched_events = enrich_events(events_data, match_info, profile)
        print(f"✅ Eventos enriquecidos: {len(enriched_events)}")

        # Crear o recuperar club y equipo principal
        club = db.query(Club).filter_by(name=match_info.get("team")).first()
        if not club:
            club = Club(name=match_info.get("team"))
            db.add(club)
            db.commit()
            print(f"✅ Club creado: {club.name}")
        else:
            print(f"✅ Club encontrado: {club.name}")

        team = db.query(Team).filter_by(name=match_info.get("team"), club_id=club.id).first()
        if not team:
            team = Team(name=match_info.get("team"), club_id=club.id, category="Senior", season=str(match_info.get("date")[:4]))
            db.add(team)
            db.commit()
            print(f"✅ Equipo creado: {team.name}")
        else:
            print(f"✅ Equipo encontrado: {team.name}")

        # Crear partido
        match_date = datetime.strptime(match_info.get("date"), "%Y-%m-%d").date()
        match = Match(
            team_id=team.id,
            opponent_name=match_info.get("opponent_name"),
            date=match_date,
            location=match_info.get("location"),
            competition=match_info.get("competition"),
            round=match_info.get("round"),
            result=match_info.get("result"),
            referee=match_info.get("referee"),
            video_url=match_info.get("video_url"),
            field=match_info.get("field"),
            rain=match_info.get("rain"),
            muddy=match_info.get("muddy"),
            wind_1p=match_info.get("wind_1p"),
            wind_2p=match_info.get("wind_2p")
        )
        db.add(match)
        db.commit()
        print(f"✅ Partido creado con ID: {match.id}")

        def is_valid_event(ev):
            required = ["event_type", "timestamp_sec"]
            return all(ev.get(k) is not None for k in required)

        valid_events = [ev for ev in enriched_events if is_valid_event(ev)]
        invalid_events = [ev for ev in enriched_events if not is_valid_event(ev)]

        print(f"📊 Eventos válidos: {len(valid_events)}")
        print(f"⚠️  Eventos inválidos: {len(invalid_events)}")

        if invalid_events:
            print("Eventos inválidos detectados (primeros 3):", invalid_events[:3])

        events_created = 0
        for ev in valid_events:
            # Manejar jugadores desde el campo 'players' (lista) o 'player' (string)
            player_names = ev.get("players") or []
            if not player_names and ev.get("player"):
                player_names = [ev.get("player")]
            
            # Usar el primer jugador como principal
            main_player = None
            if player_names:
                main_player = create_or_get_player(db, player_names[0])
            
            event = Event(
                match_id=match.id,
                player_id=main_player.id if main_player else None,
                event_type=str(ev.get("event_type")),
                timestamp_sec=ev.get("timestamp_sec") or 0,
                x=ev.get("x"),
                y=ev.get("y"),
                extra_data=clean_extra_data(ev.get("extra_data", {}))
            )
            db.add(event)
            events_created += 1

        db.commit()
        print(f"✅ Partido {match.id} importado con {events_created} eventos guardados en la base de datos.")
        return True

    except Exception as e:
        db.rollback()
        print("❌ Error en import_match_from_json:")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()
