"""
Enricher Module - VideoAnalysis
Enriquece eventos de rugby con cálculos de Game_Time, detección de períodos y grupos de tiempo.
"""

import pandas as pd

def seconds_to_mmss(seconds):
    """Convierte segundos a formato MM:SS"""
    try:
        seconds = int(seconds)
        minutes = seconds // 60
        secs = seconds % 60
        return f"{minutes:02d}:{secs:02d}"
    except Exception:
        return "00:00"

def assign_time_group(game_time_sec, first_half_duration=2400):
    """
    Asigna grupos de tiempo basándose en la duración real de los tiempos.
    Divide cada tiempo en dos mitades para crear 4 grupos principales con nombres consistentes.
    """
    first_half_mid = first_half_duration / 2
    second_half_mid = first_half_duration + (first_half_duration / 2)
    
    if game_time_sec < first_half_mid:
        return "Primer cuarto"
    elif game_time_sec < first_half_duration:
        return "Segundo cuarto"
    elif game_time_sec < second_half_mid:
        return "Tercer cuarto"
    else:
        return "Cuarto cuarto"

def process_penalty_events(event):
    """Procesa eventos PENALTY para extraer tarjetas"""
    if event.get('event_type', '').upper() == 'PENALTY':
        descriptor = str(event.get('extra_data', {}).get('DESCRIPTOR', '')).strip().upper()
        player = str(event.get('extra_data', {}).get('PLAYER', '')).strip()

        if descriptor == 'NEUTRAL':
            event['extra_data']['YELLOW-CARD'] = player
        elif descriptor == 'NEGATIVE':
            event['extra_data']['RED-CARD'] = player
        else:
            event['extra_data']['YELLOW-CARD'] = None
            event['extra_data']['RED-CARD'] = None
    else:
        event['extra_data']['YELLOW-CARD'] = None
        event['extra_data']['RED-CARD'] = None
    return event

def process_lineout_events(event):
    """Procesa eventos LINEOUT para extraer lanzador y receptor"""
    if 'extra_data' not in event:
        event['extra_data'] = {}
        
    player = str(event.get('extra_data', {}).get('PLAYER', '')).strip()
    player_2 = str(event.get('extra_data', {}).get('PLAYER_2', '')).strip()

    if player.startswith('T-'):
        thrower = player[2:]
        receiver = player_2
    elif player_2.startswith('T-'):
        thrower = player_2[2:]
        receiver = player
    else:
        thrower = None
        receiver = None

    event['extra_data']['LINE_THROWER'] = thrower
    event['extra_data']['LINE_RECEIVER'] = receiver

    players = [thrower, receiver]
    players = [p for p in players if p and p.lower() != 'nan']
    event['extra_data']['PLAYER'] = players if players else None

    return event

def process_tackle_events(event):
    """Procesa eventos TACKLE para contar tackles"""
    if event.get('event_type', '').upper() == 'TACKLE':
        if 'extra_data' not in event:
            event['extra_data'] = {}
            
        player = str(event.get('extra_data', {}).get('PLAYER', '')).strip() if event.get('extra_data', {}).get('PLAYER') else None
        player_2 = str(event.get('extra_data', {}).get('PLAYER_2', '')).strip() if event.get('extra_data', {}).get('PLAYER_2') else None

        players = [p for p in [player, player_2] if p and p.lower() != 'nan']
        event['extra_data']['PLAYER'] = players[0] if len(players) == 1 else (players if players else None)
        event['extra_data']['Team_Tackle_Count'] = 1
    return event

def clean_row(row):
    """Limpia evento removiendo valores inválidos"""
    cleaned = {}
    for k, v in row.items():
        if k == 'extra_data':
            if isinstance(v, dict):
                cleaned_extra = {}
                for ek, ev in v.items():
                    if ev is not None and ev != 'undefined':
                        if isinstance(ev, float) and pd.isna(ev):
                            continue
                        if isinstance(ev, list) and len(ev) == 0:
                            continue
                        cleaned_extra[ek] = ev
                cleaned[k] = cleaned_extra
            else:
                cleaned[k] = v
        else:
            if v is not None and v != 'undefined' and (not isinstance(v, list) or len(v) > 0) and (not (isinstance(v, float) and pd.isna(v))):
                cleaned[k] = v
    return cleaned

def calculate_game_time_from_zero(events, match_info=None, profile=None):
    """
    Calcula Game_Time desde cero de forma simple y clara.
    Game_Time es el tiempo acumulado de juego desde el inicio del partido.
    """
    events_df = pd.DataFrame(events)
    
    # Buscar eventos de referencia automáticamente
    kick_off_1_ts = None
    end_1_ts = None
    kick_off_2_ts = None
    end_2_ts = None
    
    for _, row in events_df.iterrows():
        category = row.get('event_type', '').upper()
        periods = None
        
        # Buscar PERIODS en extra_data o directamente en el evento
        if 'extra_data' in row and isinstance(row['extra_data'], dict):
            periods = row['extra_data'].get('PERIODS')
        if periods is None:
            periods = row.get('PERIODS')
        
        # Validar que periods no sea NaN
        if periods is not None and not (isinstance(periods, float) and pd.isna(periods)):
            periods = int(periods)
        else:
            periods = None
            
        timestamp = row.get('timestamp_sec', row.get('SECOND', 0))
        
        if category in ['KICK OFF', 'KICK-OFF'] and periods == 1:
            kick_off_1_ts = timestamp
        elif category == 'END' and periods == 1:
            end_1_ts = timestamp
        elif category in ['KICK OFF', 'KICK-OFF'] and periods == 2:
            kick_off_2_ts = timestamp
        elif category == 'END' and periods == 2:
            end_2_ts = timestamp
    
    # Calcular duración del primer tiempo
    first_half_duration = 2400  # 40 minutos por defecto
    if kick_off_1_ts is not None and end_1_ts is not None:
        first_half_duration = end_1_ts - kick_off_1_ts
    elif kick_off_1_ts is not None and kick_off_2_ts is not None:
        first_half_duration = kick_off_2_ts - kick_off_1_ts
    
    # Procesar cada evento
    enriched_events = []
    
    for i, event in enumerate(events):
        event_dict = event.copy()
        
        # Inicializar extra_data si no existe
        if 'extra_data' not in event_dict:
            event_dict['extra_data'] = {}
        
        # Obtener datos del evento
        category = event_dict.get('event_type', '').upper()
        timestamp = event_dict.get('timestamp_sec', event_dict.get('SECOND', 0))
        
        # Buscar PERIODS en extra_data o directamente en el evento
        periods = None
        if 'extra_data' in event_dict and isinstance(event_dict['extra_data'], dict):
            periods = event_dict['extra_data'].get('PERIODS')
        if periods is None:
            periods = event_dict.get('PERIODS')
        
        # Validar que periods no sea NaN
        if periods is not None and not (isinstance(periods, float) and pd.isna(periods)):
            periods = int(periods)
        else:
            periods = None
        
        # Detectar período si no está definido
        if periods is None:
            if kick_off_2_ts is not None and timestamp >= kick_off_2_ts:
                detected_period = 2
            elif kick_off_1_ts is not None and timestamp >= kick_off_1_ts:
                detected_period = 1
            else:
                detected_period = 1  # Por defecto
        else:
            detected_period = int(periods)
        
        # Calcular Game_Time
        game_time_sec = 0
        
        if category in ['KICK OFF', 'KICK-OFF'] and periods == 1:
            # Inicio del primer período
            game_time_sec = 0
        elif category == 'END' and periods == 1:
            # Fin del primer período
            game_time_sec = first_half_duration
        elif category in ['KICK OFF', 'KICK-OFF'] and periods == 2:
            # Inicio del segundo período
            game_time_sec = first_half_duration
        elif category == 'END' and periods == 2:
            # Fin del segundo período
            if kick_off_2_ts is not None and end_2_ts is not None:
                second_half_duration = end_2_ts - kick_off_2_ts
                game_time_sec = first_half_duration + second_half_duration
            else:
                game_time_sec = first_half_duration + 2400  # Default
        else:
            # Eventos normales
            if detected_period == 1:
                if kick_off_1_ts is not None:
                    game_time_sec = max(0, timestamp - kick_off_1_ts)
                else:
                    game_time_sec = timestamp
            else:  # detected_period == 2
                if kick_off_2_ts is not None:
                    second_half_elapsed = timestamp - kick_off_2_ts
                    game_time_sec = first_half_duration + second_half_elapsed
                else:
                    game_time_sec = first_half_duration + (timestamp - (kick_off_1_ts or 0))
        
        # Asegurar que no sea negativo
        game_time_sec = max(0, game_time_sec)
        
        # Formatear tiempos
        game_time_str = seconds_to_mmss(game_time_sec)
        video_time_str = seconds_to_mmss(timestamp)
        time_group = assign_time_group(game_time_sec, first_half_duration)
        
        # Agregar campos calculados
        event_dict['extra_data']['Game_Time'] = game_time_str
        event_dict['extra_data']['TIME(VIDEO)'] = video_time_str
        event_dict['extra_data']['Time_Group'] = time_group
        event_dict['extra_data']['DETECTED_PERIOD'] = detected_period
        
        # Preservar PERIODS original si existe
        if periods is not None:
            event_dict['extra_data']['PERIODS'] = periods
        
        enriched_events.append(event_dict)
    
    return enriched_events

def enrich_events(events, match_info, profile=None):
    """
    Función principal de enriquecimiento.
    Procesa eventos de rugby añadiendo Game_Time, períodos y grupos de tiempo.
    """
    # Calcular Game_Time desde cero
    enriched = calculate_game_time_from_zero(events, match_info, profile)
    
    # Procesar eventos especiales y limpiar
    for event_dict in enriched:
        # Procesar eventos específicos
        if event_dict.get('event_type') == 'PENALTY':
            event_dict = process_penalty_events(event_dict)
        elif event_dict.get('event_type') == 'LINEOUT':
            event_dict = process_lineout_events(event_dict)
        elif event_dict.get('event_type') == 'TACKLE':
            event_dict = process_tackle_events(event_dict)
        
        # Limpiar evento
        event_dict = clean_row(event_dict)
    
    return enriched
