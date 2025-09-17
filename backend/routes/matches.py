from flask import Blueprint, jsonify, request
from db import SessionLocal
from models import Match, Team, Event

match_bp = Blueprint('match_bp', __name__)

@match_bp.route('/matches', methods=['GET'])
def get_matches():
    db = SessionLocal()
    try:
        matches = db.query(Match).all()
        result = []
        for m in matches:
            match_dict = m.to_dict()
            # Agregar campos adicionales
            match_dict["team"] = m.team.name if m.team else None
            match_dict["opponent"] = m.opponent_name
            result.append(match_dict)
        return jsonify(result)
    finally:
        db.close()


@match_bp.route('/matches/<int:id>', methods=['GET'])
def get_match(id):
    db = SessionLocal()
    try:
        match = db.query(Match).get(id)
        if not match:
            return jsonify({"error": "Partido no encontrado"}), 404

        result = match.to_dict()
        print(f"DEBUG: Resultado de to_dict(): {result}")
        print(f"DEBUG: global_delay_seconds en result: {result.get('global_delay_seconds')}")
        print(f"DEBUG: event_delays en result: {result.get('event_delays')}")
        # Agregar campos adicionales que no están en to_dict
        result["team"] = match.team.name if match.team else None
        result["opponent"] = match.opponent_name  # Para mantener compatibilidad
        result["field"] = match.field

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@match_bp.route('/matches/<int:id>/event-types', methods=['GET'])
def get_match_event_types(id):
    db = SessionLocal()
    try:
        match = db.query(Match).get(id)
        if not match:
            return jsonify({"error": "Partido no encontrado"}), 404

        # Obtener tipos de eventos únicos del partido
        from sqlalchemy import distinct
        event_types = db.query(distinct(Event.event_type)).filter(Event.match_id == id).all()
        
        # Convertir a lista de strings y filtrar valores None
        types_list = [et[0] for et in event_types if et[0] is not None]
        
        # Ordenar alfabéticamente
        types_list.sort()

        return jsonify({
            "match_id": id,
            "event_types": types_list
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@match_bp.route('/matches/<int:id>', methods=['PUT'])

@match_bp.route('/matches/<int:id>', methods=['PUT'])
def update_match(id):
    db = SessionLocal()
    try:
        match = db.query(Match).get(id)
        if not match:
            return jsonify({"error": "Partido no encontrado"}), 404

        data = request.get_json()
        print(f"DEBUG: Datos recibidos: {data}")
        print(f"DEBUG: Keys en data: {list(data.keys())}")
        
        # Actualizar campos de tiempos manuales si se proporcionan
        if 'kick_off_1_seconds' in data:
            match.kick_off_1_seconds = data['kick_off_1_seconds']
            print(f"DEBUG: Actualizando kick_off_1_seconds = {data['kick_off_1_seconds']}")
        if 'end_1_seconds' in data:
            match.end_1_seconds = data['end_1_seconds']
            print(f"DEBUG: Actualizando end_1_seconds = {data['end_1_seconds']}")
        if 'kick_off_2_seconds' in data:
            match.kick_off_2_seconds = data['kick_off_2_seconds']
            print(f"DEBUG: Actualizando kick_off_2_seconds = {data['kick_off_2_seconds']}")
        if 'end_2_seconds' in data:
            match.end_2_seconds = data['end_2_seconds']
            print(f"DEBUG: Actualizando end_2_seconds = {data['end_2_seconds']}")
        
        # Actualizar campos de delay si se proporcionan
        if 'global_delay_seconds' in data:
            match.global_delay_seconds = data['global_delay_seconds']
            print(f"DEBUG: Actualizando global_delay_seconds = {data['global_delay_seconds']}")
        if 'event_delays' in data:
            match.event_delays = data['event_delays']
            print(f"DEBUG: Actualizando event_delays = {data['event_delays']}")
        
        print(f"DEBUG: Valores después de actualización - global_delay: {match.global_delay_seconds}, event_delays: {match.event_delays}")
        
        db.commit()
        print(f"DEBUG: Commit realizado")
        
        # Devolver el partido actualizado
        result = {
            "id": match.id,
            "team": match.team.name if match.team else None,
            "opponent": match.opponent_name,
            "date": match.date.isoformat() if match.date is not None else None,
            "location": match.location,
            "video_url": match.video_url,
            "competition": match.competition,
            "round": match.round,
            "field": match.field,
            "rain": match.rain,
            "muddy": match.muddy,
            "wind_1p": match.wind_1p,
            "wind_2p": match.wind_2p,
            "referee": match.referee,
            "result": match.result,
            "kick_off_1_seconds": match.kick_off_1_seconds,
            "end_1_seconds": match.end_1_seconds,
            "kick_off_2_seconds": match.kick_off_2_seconds,
            "end_2_seconds": match.end_2_seconds,
            "global_delay_seconds": match.global_delay_seconds,
            "event_delays": match.event_delays
        }
        
        print(f"DEBUG: Resultado a devolver: {result}")
        return jsonify(result), 200
    except Exception as e:
        db.rollback()
        print(f"ERROR: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


__all__ = ['match_bp']


