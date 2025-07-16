"""
Enricher Module - VideoAnalysis
Enriquece eventos de rugby con cálculos de Game_Time, detección de períodos y grupos de tiempo.
"""

import pandas as pd

# Helper: convierte segundos a MM:SS
def seconds_to_mmss(seconds):
    try:
        seconds = int(seconds)
        minutes = seconds // 60
        secs = seconds % 60
        result = f"{minutes:02d}:{secs:02d}"
        return result
    except Exception as e:
        return "00:00"

# Helper: asigna Time Group basado en game_time_sec y duración real de los tiempos
def assign_time_group(game_time_sec, first_half_duration=2400):
    """
    Asigna grupos de tiempo basándose en la duración real de los tiempos.
    Divide cada tiempo en dos mitades para crear 4 grupos principales con nombres consistentes.
    """
    # Calcular puntos de división
    first_half_mid = first_half_duration / 2  # Mitad del primer tiempo
    second_half_mid = first_half_duration + (first_half_duration / 2)  # Mitad del segundo tiempo
    
    if game_time_sec < first_half_mid:
        return "Primer cuarto"
    elif game_time_sec < first_half_duration:
        return "Segundo cuarto"
    elif game_time_sec < second_half_mid:
        return "Tercer cuarto"
    else:
        return "Cuarto cuarto"

# Procesa los eventos PENALTY
def process_penalty_events(event):
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

# Procesa los eventos LINEOUT
def process_lineout_events(event):
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

# Procesa los eventos TACKLE
def process_tackle_events(event):
    if event.get('event_type', '').upper() == 'TACKLE':
        if 'extra_data' not in event:
            event['extra_data'] = {}
            
        player = str(event.get('extra_data', {}).get('PLAYER', '')).strip() if event.get('extra_data', {}).get('PLAYER') else None
        player_2 = str(event.get('extra_data', {}).get('PLAYER_2', '')).strip() if event.get('extra_data', {}).get('PLAYER_2') else None

        players = [p for p in [player, player_2] if p and p.lower() != 'nan']
        event['extra_data']['PLAYER'] = players[0] if len(players) == 1 else (players if players else None)

        event['extra_data']['Team_Tackle_Count'] = 1
    return event

# Limpia evento removiendo valores inválidos
def clean_row(row):
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

# NUEVA FUNCIÓN: Calcula Game_Time desde cero de forma simple
def calculate_game_time_from_zero(events, match_info=None, profile=None):
    """
    Calcula Game_Time desde cero de forma simple y clara.
    Game_Time es el tiempo acumulado de juego desde el inicio del partido.
    """
    print(f"🎯 CALCULANDO GAME_TIME DESDE CERO PARA {len(events)} EVENTOS")
    
    events_df = pd.DataFrame(events)
    
    # Buscar eventos de referencia automáticamente
    kick_off_1_ts = None
    end_1_ts = None
    kick_off_2_ts = None
    end_2_ts = None
    
    print(f"🔍 BUSCANDO EVENTOS DE REFERENCIA...")
    
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
            print(f"  ✅ KICK OFF P1: {timestamp}s")
        elif category == 'END' and periods == 1:
            end_1_ts = timestamp
            print(f"  ✅ END P1: {timestamp}s")
        elif category in ['KICK OFF', 'KICK-OFF'] and periods == 2:
            kick_off_2_ts = timestamp
            print(f"  ✅ KICK OFF P2: {timestamp}s")
        elif category == 'END' and periods == 2:
            end_2_ts = timestamp
            print(f"  ✅ END P2: {timestamp}s")
    
    print(f"🎯 REFERENCIAS ENCONTRADAS:")
    print(f"  kick_off_1_ts: {kick_off_1_ts}")
    print(f"  end_1_ts: {end_1_ts}")
    print(f"  kick_off_2_ts: {kick_off_2_ts}")
    print(f"  end_2_ts: {end_2_ts}")
    
    # Calcular duración del primer tiempo
    first_half_duration = 0
    if kick_off_1_ts is not None and end_1_ts is not None:
        first_half_duration = end_1_ts - kick_off_1_ts
        print(f"⏱️ DURACIÓN P1 (kick_off→end): {first_half_duration}s")
    elif kick_off_1_ts is not None and kick_off_2_ts is not None:
        first_half_duration = kick_off_2_ts - kick_off_1_ts
        print(f"⏱️ DURACIÓN P1 (kick_off→kick_off): {first_half_duration}s")
    else:
        first_half_duration = 2400  # 40 minutos por defecto
        print(f"⏱️ DURACIÓN P1 (por defecto): {first_half_duration}s")
    
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
            
        print(f"🎯 EVENTO {i+1}: {category} (ts={timestamp}, period={detected_period}) → Game_Time={game_time_str}")
        
        enriched_events.append(event_dict)
    
    return enriched_events

# Función principal de enriquecimiento - SIMPLIFICADA
def enrich_events(events, match_info, profile=None):
    """
    Función principal de enriquecimiento simplificada.
    """
    print(f"📊 INICIANDO ENRIQUECIMIENTO DE {len(events)} EVENTOS")
    
    # Usar nueva función simplificada para Game_Time
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
    
    print(f"✅ ENRIQUECIMIENTO COMPLETADO")
    return enriched
