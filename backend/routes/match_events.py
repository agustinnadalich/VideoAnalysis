from flask import Blueprint, jsonify, request
from sqlalchemy.orm import Session
from db import SessionLocal
from models import Match, Event, Player, Team, ImportProfile
import math
import pandas as pd
from enricher import enrich_events

print("🔍 DEBUG: match_events.py se está cargando")

match_events_bp = Blueprint('match_events', __name__)

@match_events_bp.route('/test', methods=['GET'])
def test_route():
    print("🚨🚨🚨 DEBUG: TEST ROUTE EJECUTADA")
    return jsonify({"message": "Test route working"})

@match_events_bp.route('/matches/<int:match_id>/events', methods=['GET'])
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
    print("🚨🚨🚨 DEBUG: get_match_events LLAMADA PARA match_id:", match_id)
    print("🚨🚨🚨 DEBUG: Inicio de get_match_events")
    db: Session = SessionLocal()
    try:
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            db.close()
            return jsonify({"error": "Match not found"}), 404
        
        print("🚨🚨🚨 DEBUG: Match encontrado:", match.id)
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

        # Inicializar perfil
        profile = None
        
        # Si el partido tiene tiempos manuales configurados, usarlos
        match_times = {}
        try:
            kick_off_1 = match.kick_off_1_seconds
            end_1 = match.end_1_seconds
            if kick_off_1 is not None and end_1 is not None:
                match_times = {
                    'kick_off_1': kick_off_1,
                    'end_1': end_1,
                    'kick_off_2': match.kick_off_2_seconds,
                    'end_2': match.end_2_seconds
                }
                print(f"🔍 Tiempos manuales encontrados: {match_times}")
                
                # Crear un perfil temporal con los tiempos del partido y delays
                profile = {
                    'time_mapping': {
                        'method': 'manual',
                        'manual_times': match_times,
                        'delays': {
                            'global_delay_seconds': match.global_delay_seconds or 0,
                            'event_delays': match.event_delays or {}
                        }
                    }
                }
                print(f"🔍 Creado perfil temporal con tiempos manuales y delays: {profile['time_mapping']['delays']}")
        except Exception as e:
            print(f"Error accediendo tiempos manuales: {e}")
            match_times = {}
        
        # Si no hay tiempos manuales, intentar usar perfil de importación
        if profile is None:
            if match.import_profile_name is not None:
                profile_record = db.query(ImportProfile).filter_by(name=match.import_profile_name).first()
                if profile_record:
                    profile = profile_record.settings
                    print(f"🔍 Usando perfil: {match.import_profile_name}")
                else:
                    print(f"⚠️ Perfil '{match.import_profile_name}' no encontrado, usando perfil por defecto")
            
            # Si no hay perfil específico, usar el perfil por defecto
            if profile is None:
                default_profile = db.query(ImportProfile).filter_by(name='Default').first()
                if default_profile:
                    profile = default_profile.settings
        
        # Usar el enricher para calcular tiempos correctamente
        if profile is not None:
            enriched_events = enrich_events(event_dicts, match_info, profile)
            event_dicts = enriched_events
            # Cuando se usa enricher, procesar TIME(VIDEO) directamente y evitar DataFrame
            for ev in event_dicts:
                sec = ev.get("timestamp_sec")
                if sec is not None:
                    mins, secs = divmod(int(sec), 60)
                    ev['TIME(VIDEO)'] = f"{mins:02}:{secs:02}"
            # Evitar DataFrame cuando se usa enricher
            final_data = event_dicts
        else:
            print("⚠️ No se encontró perfil, usando cálculo manual legacy")

        # CREA EL DATAFRAME ANTES DE USARLO
        df = pd.DataFrame(event_dicts)

        # Solo calcular time_groups si no se usó el enricher (para compatibilidad legacy)
        if profile is None:
            calcular_juego, k1, f1, k2, f2 = calcular_tiempo_de_juego(df)
            # Calcular valores seguros para time_groups
            k2_calc = calcular_juego(k2)
            k2_time = k2_calc if k2_calc is not None else 40 * 60
            f1_calc = calcular_juego(f1)
            f1_time = f1_calc if f1_calc is not None else 40 * 60
            f2_calc = calcular_juego(f2)
            f2_time = f2_calc if f2_calc is not None else 80 * 60
            
            time_groups = [
                {"label": "0'-20'", "start": 0, "end": 20 * 60},
                {"label": "20'-40'", "start": 20 * 60, "end": f1_time},
                {"label": "40'-60'", "start": k2_time, "end": k2_time + 20 * 60},
                {"label": "60'-80'", "start": k2_time + 20 * 60, "end": f2_time}
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
        else:
            # Si se usó el enricher, solo agregar TIME(VIDEO)
            for ev in event_dicts:
                sec = ev.get("timestamp_sec")
                if sec is not None:
                    mins, secs = divmod(int(sec), 60)
                    ev['TIME(VIDEO)'] = f"{mins:02}:{secs:02}"

        # Procesar DataFrame solo si se usó el método legacy
        if profile is None:
            df = calcular_origen_tries(df)
            final_data = df.to_dict(orient='records')
        else:
            # Cuando se usa enricher, final_data ya está listo
            pass

        # Si se usó el enricher, mover Game_Time/Time_Group/TIME(VIDEO) de extra_data al nivel superior
        print(f"DEBUG: profile is not None: {profile is not None}, final_data length: {len(final_data)}")
        if profile is not None:
            print("DEBUG: Moving Game_Time from extra_data to top level")
            for ev in final_data:
                # Mover Game_Time, Time_Group y TIME(VIDEO) de extra_data al nivel superior
                extra_data = ev.get('extra_data', {})
                if 'Game_Time' in extra_data:
                    print(f"DEBUG: Moving Game_Time {extra_data['Game_Time']} to top level")
                    ev['Game_Time'] = extra_data['Game_Time']
                if 'Time_Group' in extra_data:
                    ev['Time_Group'] = extra_data['Time_Group']
                if 'TIME(VIDEO)' in extra_data:
                    ev['TIME(VIDEO)'] = extra_data['TIME(VIDEO)']

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

        # DEBUG: Mostrar muestra de los datos finales
        print("🚨🚨🚨 DEBUG: final_data sample:", final_data[0] if final_data else "None")
        if final_data:
            print("🚨🚨🚨 DEBUG: Game_Time in final_data[0]:", final_data[0].get('Game_Time'))

        return jsonify({
            "match_info": match_info,
            "events": final_data
        })
    except Exception as e:
        print(f"ERROR en get_match_events: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@match_events_bp.route('/matches/<int:match_id>/info', methods=['GET'])
def get_match_info(match_id):
    try:
        with SessionLocal() as session:
            match = session.query(Match).filter(Match.id == match_id).first()
            if not match:
                return jsonify({"error": "Match not found"}), 404
            
            return jsonify({
                "id": match.id,
                "video_url": match.video_url,
                "VIDEO_URL": match.video_url,  # Para compatibilidad
                "opponent_name": match.opponent_name,
                "date": match.date.isoformat() if match.date else None,
                "kick_off_1_seconds": match.kick_off_1_seconds,
                "end_1_seconds": match.end_1_seconds,
                "kick_off_2_seconds": match.kick_off_2_seconds,
                "end_2_seconds": match.end_2_seconds
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@match_events_bp.route('/matches/<int:match_id>/info', methods=['PUT'])
def update_match_info(match_id):
    try:
        data = request.get_json()
        with SessionLocal() as session:
            match = session.query(Match).filter(Match.id == match_id).first()
            if not match:
                return jsonify({"error": "Match not found"}), 404
            
            if 'video_url' in data:
                match.video_url = data['video_url']
                session.commit()
            
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

@match_events_bp.route('/matches/<int:match_id>/update-video', methods=['POST'])
def update_match_video(match_id):
    try:
        data = request.get_json()
        video_url = data.get('video_url')
        
        with SessionLocal() as session:
            match = session.query(Match).filter(Match.id == match_id).first()
            if not match:
                return jsonify({"error": "Match not found"}), 404
            
            match.video_url = video_url
            session.commit()
            
            return jsonify({
                "success": True,
                "message": "Video URL updated successfully",
                "video_url": video_url
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
