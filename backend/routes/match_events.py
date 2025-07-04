from flask import Blueprint, jsonify
from sqlalchemy.orm import Session
from db import SessionLocal
from models import Match, Event, Player, Team
import math
import pandas as pd

match_events_bp = Blueprint('match_events', __name__)


def calcular_tiempo_de_juego(df):
    def safe_second(val):
        if val is None or (isinstance(val, float) and math.isnan(val)):
            return 0
        return val

    kick_off_1 = safe_second(df[(df['event_type'] == 'KICK OFF') & (df['extra_data'].apply(lambda x: x.get('PERIODS') == 1))]['timestamp_sec'].min())
    fin_1 = safe_second(df[(df['event_type'] == 'END') & (df['extra_data'].apply(lambda x: x.get('PERIODS') == 1))]['timestamp_sec'].max())
    kick_off_2 = safe_second(df[(df['event_type'] == 'KICK OFF') & (df['extra_data'].apply(lambda x: x.get('PERIODS') == 2))]['timestamp_sec'].min())
    fin_2 = safe_second(df[(df['event_type'] == 'END') & (df['extra_data'].apply(lambda x: x.get('PERIODS') == 2))]['timestamp_sec'].max())

    def calcular(second):
        if second <= fin_1:
            return second - kick_off_1
        elif second >= kick_off_2:
            return (fin_1 - kick_off_1) + (second - kick_off_2)
        return None

    return calcular, kick_off_1, fin_1, kick_off_2, fin_2


def calcular_origen_tries(df):
    if 'POINTS' not in df.columns:
        df['POINTS'] = df['extra_data'].apply(lambda x: x.get('POINTS'))

    origin_categories = ["TURNOVER+", "SCRUM", "LINEOUT", "KICKOFF"]
    tries_events = df[df['POINTS'] == "TRY"]

    def get_origin_event(try_event):
        try_time = try_event['timestamp_sec']
        relevant_events = df[(df['event_type'].isin(origin_categories)) & (df['timestamp_sec'] < try_time)]
        return relevant_events.iloc[-1]['event_type'] if not relevant_events.empty else None

    df['TRY_ORIGIN'] = df.apply(lambda event: get_origin_event(event) if event.get('POINTS') == "TRY" else None, axis=1)
    return df


@match_events_bp.route('/matches/<int:match_id>/events', methods=['GET'])
def get_match_events(match_id):

    db: Session = SessionLocal()
    try:
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            Session.close()
            return jsonify({"error": "Match not found"}), 404
        
        match_info = {col.name.upper(): getattr(match, col.name) for col in Match.__table__.columns}
        match_info["TEAM"] = match.team.name if match.team else None
        match_info["OPPONENT"] = match.opponent_name
        match_info["DATE"] = match.date.isoformat() if match.date else None



        # Obtener todos los nombres de equipos de la base de datos
        teams = db.query(Team).all()
        team_names = [team.name for team in teams]
        # my_team variable removed as it was not used

        events = db.query(Event).filter_by(match_id=match.id).all()
        event_dicts = [ev.to_dict() for ev in events]

        # 1. Obtener todos los player_id presentes en los eventos
        player_ids = [ev.get("player_id") for ev in event_dicts if ev.get("player_id")]

        # 2. Consultar los nombres de los jugadores
        if player_ids:
            players = db.query(Player).filter(Player.id.in_(player_ids)).all()
            player_dict = {p.id: p.full_name for p in players}
        else:
            player_dict = {}

        # 3. Agregar el nombre del jugador a cada evento y si es rival o no
        for ev in event_dicts:
            pid = ev.get("player_id")
            ev["player_name"] = player_dict.get(pid) if pid else None
            extra_data = ev.get("extra_data", {})
            team_name = extra_data.get("TEAM")

            if team_name is None:
                ev["IS_OPPONENT"] = None
            elif team_name in team_names:
                ev["IS_OPPONENT"] = False
            else:
                ev["IS_OPPONENT"] = True

        # CREA EL DATAFRAME ANTES DE USARLO
        df = pd.DataFrame(event_dicts)

        calcular_juego, k1, f1, k2, f2 = calcular_tiempo_de_juego(df)
        time_groups = [
            {"label": "0'-20'", "start": 0, "end": 20 * 60},
            {"label": "20'-40'", "start": 20 * 60, "end": calcular_juego(f1)},
            {"label": "40'-60'", "start": calcular_juego(k2), "end": calcular_juego(k2) + 20 * 60},
            {"label": "60'-80'", "start": calcular_juego(k2) + 20 * 60, "end": calcular_juego(f2)}
        ]

        # Ahora puedes recorrer event_dicts y asignar los campos de tiempo
        for ev in event_dicts:
            sec = ev.get("timestamp_sec")

             # Nuevo campo para saber si es un evento del rival

            if sec is not None:
                mins, secs = divmod(int(sec), 60)
                ev['TIME(VIDEO)'] = f"{mins:02}:{secs:02}"

                game_time = calcular_juego(sec)
                if game_time is not None:
                    gm, gs = divmod(game_time, 60)
                    ev['Game_Time'] = f"{int(gm):02}:{int(gs):02}"
                    for group in time_groups:
                        if group['start'] <= game_time < group['end']:
                            ev['Time_Group'] = group['label']
                            break
                else:
                    ev['Game_Time'] = None
                    ev['Time_Group'] = None

        df = calcular_origen_tries(df)
        final_data = df.to_dict(orient='records')

        def clean_nan(obj):
            if isinstance(obj, dict):
                return {k: clean_nan(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_nan(v) for v in obj]
            elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
                return None
            else:
                return obj

        # Antes de jsonify:
        final_data = clean_nan(final_data)



        return jsonify({
            "match_info": match_info,
            "events": final_data
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
