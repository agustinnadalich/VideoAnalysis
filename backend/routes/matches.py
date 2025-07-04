from flask import Blueprint, jsonify
from db import SessionLocal
from models import Match, Team

match_bp = Blueprint('match_bp', __name__)

@match_bp.route('/matches', methods=['GET'])
def get_matches():
    db = SessionLocal()
    try:
        matches = db.query(Match).all()
        result = []
        for m in matches:
            result.append({
                "id": m.id,
                "team": m.team.name if m.team else None,
                "opponent": m.opponent_name,
                "date": m.date.isoformat() if m.date else None,
                "location": m.location,
                "video_url": m.video_url,
                "competition": m.competition,
                "round": m.round,
                "field": m.field,
                "rain": m.rain,
                "muddy": m.muddy,
                "wind_1p": m.wind_1p,
                "wind_2p": m.wind_2p,
                "referee": m.referee,
                "result": m.result
            })
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

        result = {
            "id": match.id,
            "team": match.team.name if match.team else None,
            "opponent": match.opponent_name,
            "date": match.date.isoformat(),
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
            "result": match.result
        }

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

__all__ = ['match_bp']


