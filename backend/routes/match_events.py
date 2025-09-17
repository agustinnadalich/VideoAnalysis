from flask import Blueprint, jsonify
from sqlalchemy.orm import Session
from db import SessionLocal
from models import Match, Event, Player, Team, ImportProfile
import math
import pandas as pd
from enricher import enrich_events
import logging

print("🔍 DEBUG: match_events.py se está cargando")

match_events_bp = Blueprint("match_events", __name__)

@match_events_bp.route("/matches/<int:match_id>/info", methods=["GET"])
def get_match_info(match_id):
    try:
        with SessionLocal() as session:
            match = session.query(Match).filter(Match.id == match_id).first()
            if not match:
                return jsonify({"error": "Match not found"}), 404
            
            return jsonify({
                "id": match.id,
                "video_url": match.video_url,
                "VIDEO_URL": match.video_url,
                "opponent_name": match.opponent_name,
                "date": match.date.isoformat() if match.date else None,
                "kick_off_1_seconds": match.kick_off_1_seconds,
                "end_1_seconds": match.end_1_seconds,
                "kick_off_2_seconds": match.kick_off_2_seconds,
                "end_2_seconds": match.end_2_seconds
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@match_events_bp.route("/matches/<int:match_id>/events", methods=["GET"])
def get_match_events(match_id):
    logging.warning("🚨��🚨 LOGGING: get_match_events LLAMADA PARA match_id: %s", match_id)
    print("🚨🚨🚨 PRINT: get_match_events LLAMADA PARA match_id:", match_id)
    print("🚨🚨🚨 DEBUG: Inicio de get_match_events")
    
    try:
        with SessionLocal() as session:
            match = session.query(Match).filter(Match.id == match_id).first()
            if not match:
                return jsonify({"error": "Match not found"}), 404
            
            profile = None
            if match.import_profile_name:
                profile_record = session.query(ImportProfile).filter(ImportProfile.name == match.import_profile_name).first()
                if profile_record:
                    profile = profile_record.settings
                    logging.warning("🚨🚨🚨 LOGGING: Perfil encontrado: %s", match.import_profile_name)
                else:
                    logging.warning("🚨🚨🚨 LOGGING: Perfil no encontrado: %s", match.import_profile_name)
            
            if not profile and match.kick_off_1_seconds is not None:
                profile = {
                    "time_mapping": {
                        "method": "manual",
                        "manual_times": {
                            "kick_off_1": match.kick_off_1_seconds,
                            "end_1": match.end_1_seconds,
                            "kick_off_2": match.kick_off_2_seconds,
                            "end_2": match.end_2_seconds
                        },
                        "delays": {
                            "global_delay_seconds": match.global_delay_seconds or 0,
                            "event_delays": match.event_delays or {}
                        }
                    }
                }
                logging.warning("🚨🚨🚨 LOGGING: Usando tiempos manuales del match como perfil")
            
            events = session.query(Event).filter(Event.match_id == match_id).all()
            
            events_list = []
            for event in events:
                event_dict = {
                    "id": event.id,
                    "match_id": event.match_id,
                    "timestamp_sec": event.timestamp_sec,
                    "event_type": event.event_type,
                    "tag": event.tag,
                    "notes": event.notes,
                    "player_id": event.player_id,
                    "x": event.x,
                    "y": event.y,
                    "phase": event.phase,
                    "origin": event.origin,
                    "outcome": event.outcome,
                    "extra_data": event.extra_data
                }
                events_list.append(event_dict)
            
            if events_list:
                logging.warning("🚨🚨🚨 LOGGING: Aplicando enricher a %d eventos con perfil: %s", len(events_list), profile is not None)
                enriched_events = enrich_events(events_list, match_id, profile)
                # Priorizar clip_start para timestamp_sec si está disponible
                for event_dict in enriched_events:
                    if "clip_start" in event_dict.get("extra_data", {}):
                        event_dict["timestamp_sec"] = event_dict["extra_data"]["clip_start"]
                print("🚨🚨🚨 DEBUG: Ajustados timestamps con clip_start")
                return jsonify(enriched_events)
            else:
                return jsonify([])
                
    except Exception as e:
        logging.error("🚨🚨🚨 LOGGING: Error en get_match_events: %s", str(e))
        print("🚨🚨🚨 PRINT: Error en get_match_events:", str(e))
        return jsonify({"error": str(e)}), 500
