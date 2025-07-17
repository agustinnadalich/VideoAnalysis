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
        if 'extra_data' not in event:
            event['extra_data'] = {}
            
        # Intentar obtener descriptor desde extra_data
        descriptor = event.get('extra_data', {}).get('DESCRIPTOR', '')
        
        # También intentar obtener desde campos directos (por compatibilidad)
        if not descriptor:
            descriptor = event.get('DESCRIPTOR', '')
        
        descriptor = str(descriptor).strip().upper()
        
        # Soporte para XML: lista de jugadores
        players_list = event.get('players')
        if isinstance(players_list, list) and len(players_list) > 0:
            player = players_list[0]
        else:
            # Intentar obtener jugador desde extra_data['player'] (normalizado)
            player = event.get('extra_data', {}).get('player', '')
            if not player:
                # Fallback a PLAYER en extra_data
                player = event.get('extra_data', {}).get('PLAYER', '')
        
        player = str(player).strip() if player else ''

        # Procesar según el descriptor
        if descriptor == 'NEUTRAL':
            event['extra_data']['YELLOW-CARD'] = player
            event['extra_data']['RED-CARD'] = None
        elif descriptor == 'NEGATIVE':
            event['extra_data']['YELLOW-CARD'] = None
            event['extra_data']['RED-CARD'] = player
        else:
            event['extra_data']['YELLOW-CARD'] = None
            event['extra_data']['RED-CARD'] = None
    else:
        if 'extra_data' not in event:
            event['extra_data'] = {}
        event['extra_data']['YELLOW-CARD'] = None
        event['extra_data']['RED-CARD'] = None
    
    return event

def process_lineout_events(event):
    """Procesa eventos LINEOUT para extraer lanzador y receptor"""
    if 'extra_data' not in event:
        event['extra_data'] = {}

    # Soporte para XML: lista de jugadores en event['players']
    players_list = event.get('players')
    thrower = None
    receiver = None

    if isinstance(players_list, list) and len(players_list) >= 2:
        # Buscar lanzador (T-) y receptor
        thrower_candidates = [p for p in players_list if isinstance(p, str) and p.startswith('T-')]
        receiver_candidates = [p for p in players_list if isinstance(p, str) and not p.startswith('T-')]
        if thrower_candidates:
            thrower = thrower_candidates[0][2:]  # Sin el prefijo T-
        if receiver_candidates:
            receiver = receiver_candidates[0]
        # Guardar ambos en PLAYER sin el prefijo T-
        event['extra_data']['PLAYER'] = [thrower, receiver] if thrower and receiver else [p[2:] if p.startswith('T-') else p for p in players_list]
    else:
        # Soporte para Excel: campos PLAYER y PLAYER_2
        # Intentar obtener el jugador desde extra_data['player'] (normalizado)
        player = event.get('extra_data', {}).get('player', '')
        if not player:
            # Fallback a PLAYER en extra_data
            player = event.get('extra_data', {}).get('PLAYER', '')
        
        player_2 = event.get('extra_data', {}).get('PLAYER_2', '')
        
        # Convertir a string para procesar
        player = str(player).strip() if player else ''
        player_2 = str(player_2).strip() if player_2 else ''
        
        if player.startswith('T-'):
            thrower = player[2:]
            receiver = player_2
        elif player_2.startswith('T-'):
            thrower = player_2[2:]
            receiver = player
        else:
            # Si no hay prefijo T-, el primer jugador es el lanzador por defecto
            thrower = player if player and player.lower() != 'nan' else None
            receiver = player_2 if player_2 and player_2.lower() != 'nan' else None
        
        # Crear lista de jugadores válidos
        players = [p for p in [thrower, receiver] if p and p.lower() != 'nan']
        event['extra_data']['PLAYER'] = players if players else [thrower] if thrower else None

    # Actualizar campos específicos
    event['extra_data']['LINE_THROWER'] = thrower
    event['extra_data']['LINE_RECEIVER'] = receiver

    return event

def process_tackle_events(event):
    """Procesa eventos TACKLE para contar tackles"""
    if event.get('event_type', '').upper() == 'TACKLE':
        if 'extra_data' not in event:
            event['extra_data'] = {}
        # Soporte para XML: lista de jugadores
        players_list = event.get('players')
        if isinstance(players_list, list) and len(players_list) > 0:
            players = [p for p in players_list if p and p.lower() != 'nan']
        else:
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

def calculate_game_time_from_zero_backup(events, match_info=None, profile=None):
    """
    Calcula Game_Time desde cero de forma simple y clara.
    Game_Time es el tiempo acumulado de juego desde el inicio del partido.
    """
    print(f"DEBUG BACKUP: Procesando {len(events)} eventos")
    if events:
        print(f"DEBUG BACKUP: Primer evento: {events[0]}")
    
    events_df = pd.DataFrame(events)
    
    # Buscar eventos de referencia automáticamente
    kick_off_1_ts = None
    end_1_ts = None
    kick_off_2_ts = None
    end_2_ts = None
    
    # Detectar automáticamente los hitos basándose en el primer y segundo KICK OFF
    kick_off_events = []
    end_events = []
    
    for _, row in events_df.iterrows():
        category = row.get('event_type', '').upper()
        timestamp = float(row.get('timestamp_sec', row.get('SECOND', 0)))
        
        if category in ['KICK OFF', 'KICK-OFF']:
            kick_off_events.append(timestamp)
        elif category == 'END':
            end_events.append(timestamp)
    
    # Ordenar eventos por timestamp
    kick_off_events.sort()
    end_events.sort()
    
    # Asignar hitos basándose en la secuencia temporal
    if len(kick_off_events) >= 1:
        kick_off_1_ts = kick_off_events[0]
    if len(kick_off_events) >= 2:
        kick_off_2_ts = kick_off_events[1]
    
    # Encontrar el primer END después del primer KICK OFF
    if kick_off_1_ts is not None and end_events:
        for end_ts in end_events:
            if end_ts > kick_off_1_ts:
                end_1_ts = end_ts
                break
    
    # Encontrar el primer END después del segundo KICK OFF
    if kick_off_2_ts is not None and end_events:
        for end_ts in end_events:
            if end_ts > kick_off_2_ts:
                end_2_ts = end_ts
                break
    
    print(f"DEBUG BACKUP: Hitos detectados - kick_off_1: {kick_off_1_ts}, end_1: {end_1_ts}, kick_off_2: {kick_off_2_ts}, end_2: {end_2_ts}")
    
    # Calcular duración del primer tiempo
    first_half_duration = 2400  # 40 minutos por defecto
    if kick_off_1_ts is not None and end_1_ts is not None:
        first_half_duration = end_1_ts - kick_off_1_ts
    elif kick_off_1_ts is not None and kick_off_2_ts is not None:
        # Estimar basándose en el segundo kick off (descanso típico de 15 min)
        first_half_duration = kick_off_2_ts - kick_off_1_ts - 900  # Restar 15 min de descanso
    
    print(f"DEBUG BACKUP: Duración del primer tiempo: {first_half_duration}")
    
    # Procesar cada evento
    enriched_events = []
    
    for i, event in enumerate(events):
        event_dict = event.copy()
        
        # Inicializar extra_data si no existe
        if 'extra_data' not in event_dict:
            event_dict['extra_data'] = {}
        
        # Obtener datos del evento
        category = event_dict.get('event_type', '').upper()
        timestamp = float(event_dict.get('timestamp_sec', event_dict.get('SECOND', 0)))
        
        # Detectar período basándose en la secuencia temporal
        detected_period = 1
        if kick_off_2_ts is not None and timestamp >= kick_off_2_ts:
            detected_period = 2
        elif kick_off_1_ts is not None and timestamp >= kick_off_1_ts:
            detected_period = 1
        
        # Calcular Game_Time
        game_time_sec = 0
        
        if category in ['KICK OFF', 'KICK-OFF']:
            if timestamp == kick_off_1_ts:
                # Inicio del primer período
                game_time_sec = 0
            elif timestamp == kick_off_2_ts:
                # Inicio del segundo período
                game_time_sec = first_half_duration
            else:
                # Otros kick offs
                if detected_period == 1:
                    game_time_sec = max(0, timestamp - kick_off_1_ts) if kick_off_1_ts else timestamp
                else:
                    game_time_sec = first_half_duration + (timestamp - kick_off_2_ts) if kick_off_2_ts else first_half_duration
        elif category == 'END':
            if timestamp == end_1_ts:
                # Fin del primer período
                game_time_sec = first_half_duration
            elif timestamp == end_2_ts:
                # Fin del segundo período
                if kick_off_2_ts is not None and end_2_ts is not None:
                    second_half_duration = end_2_ts - kick_off_2_ts
                    game_time_sec = first_half_duration + second_half_duration
                else:
                    game_time_sec = first_half_duration + 2400  # Default
            else:
                # Otros ends
                if detected_period == 1:
                    game_time_sec = max(0, timestamp - kick_off_1_ts) if kick_off_1_ts else timestamp
                else:
                    game_time_sec = first_half_duration + (timestamp - kick_off_2_ts) if kick_off_2_ts else first_half_duration
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
        
        enriched_events.append(event_dict)
    
    return enriched_events

def calculate_game_time_from_zero(events, match_info=None, profile=None):
    """Calcula Game_Time usando configuración del perfil: manual, category_based o event_based."""
    # Validar que el perfil sea un diccionario válido
    print(f"DEBUG: Inicio de calculate_game_time_from_zero")
    print(f"DEBUG: Perfil recibido: {profile}")
    print(f"DEBUG: Primeros 5 eventos recibidos: {events[:5]}")

    if not profile or not isinstance(profile, dict):
        raise ValueError("El perfil proporcionado no es válido o está vacío.")

    # Obtener configuración de time_mapping
    method = 'event_based'
    time_mapping = {}
    if 'settings' in profile:
        settings = profile['settings']
        time_mapping = settings.get('time_mapping', {})
        method = time_mapping.get('method', method)
    else:
        # Si no hay 'settings', asumir que profile ya son los settings
        time_mapping = profile.get('time_mapping', {})
        method = time_mapping.get('method', method)

    # Los eventos ya están normalizados, usar nombres estándar
    col_time = 'timestamp_sec'
    col_event_type = 'event_type'

    print(f"DEBUG: Método de cálculo: {method}")
    print(f"DEBUG: Configuración de time_mapping: {time_mapping}")
    print(f"DEBUG: Columnas fijas - col_time: {col_time}, col_event_type: {col_event_type}")

    if method == 'manual':
        print(f"DEBUG: Configuración manual: {time_mapping.get('manual_times', {})}")

    print(f"DEBUG: Eventos recibidos: {events[:5]} (mostrando los primeros 5 eventos)")

    # Inicializar hitos con valores predeterminados
    kick_off_1_ts = None
    end_1_ts = None
    kick_off_2_ts = None
    end_2_ts = None

    # Inicializar timestamps para hitos
    if method == 'manual':
        manual = time_mapping.get('manual_times', {})
        kick_off_1_ts = manual.get('kick_off_1', 0)
        end_1_ts = manual.get('end_1', kick_off_1_ts)
        kick_off_2_ts = manual.get('kick_off_2', end_1_ts)
        end_2_ts = manual.get('end_2', kick_off_2_ts)
        print(f"DEBUG: Hitos manuales - kick_off_1_ts={kick_off_1_ts}, end_1_ts={end_1_ts}, kick_off_2_ts={kick_off_2_ts}, end_2_ts={end_2_ts}")
    else:
        # Detectar hitos según categoría o descriptor
        conf = {
            'kick_off_1': time_mapping.get('kick_off_1', {}),
            'end_1': time_mapping.get('end_1', {}),
            'kick_off_2': time_mapping.get('kick_off_2', {}),
            'end_2': time_mapping.get('end_2', {}),
        }
        print(f"DEBUG: Configuración para detección de hitos: {conf}")
        
        for ev in events:
            cat = ev.get(col_event_type, '').upper()
            extra = ev.get('extra_data', {})
            ts = ev.get(col_time, None)
            if ts is None:
                continue  # Ignorar eventos sin timestamp válido
            
            # Convertir timestamp a float al inicio
            try:
                ts = float(ts)
            except (ValueError, TypeError):
                print(f"WARNING: No se pudo convertir timestamp {ts} a float, saltando evento")
                continue
            
            for key, cfg in conf.items():
                if not cfg:
                    continue
                match_cat = cat == cfg.get('category', '').upper()
                if method == 'category_based' and match_cat:
                    if locals().get(f"{key}_ts") is None:
                        locals()[f"{key}_ts"] = ts
                        print(f"DEBUG: Detectado hito {key} en timestamp {ts} (category_based)")
                elif method == 'event_based' and match_cat:
                    desc = cfg.get('descriptor', '')
                    val = cfg.get('descriptor_value', '')
                    if desc and val and str(extra.get(desc, '')).upper() == val.upper():
                        if locals().get(f"{key}_ts") is None:
                            locals()[f"{key}_ts"] = ts
                            print(f"DEBUG: Detectado hito {key} en timestamp {ts} (event_based)")
        
        print(f"DEBUG: Hitos detectados después del bucle - kick_off_1_ts={kick_off_1_ts}, end_1_ts={end_1_ts}, kick_off_2_ts={kick_off_2_ts}, end_2_ts={end_2_ts}")

    # Validar que al menos kick_off_1_ts esté definido
    if kick_off_1_ts is None:
        print("WARNING: No se detectó kick_off_1_ts, usando fallback")
        # Fallback: usar el timestamp del primer evento como referencia
        first_event_ts = min(ev.get(col_time, 0) for ev in events if ev.get(col_time) is not None)
        kick_off_1_ts = float(first_event_ts) if first_event_ts is not None else 0
        print(f"DEBUG: Usando fallback kick_off_1_ts = {kick_off_1_ts}")
    else:
        kick_off_1_ts = float(kick_off_1_ts)
    
    # Asignar valores por defecto si no se detectaron otros hitos
    if end_1_ts is None:
        end_1_ts = kick_off_1_ts + 2400  # 40 minutos después
        print(f"DEBUG: Usando fallback end_1_ts = {end_1_ts}")
    else:
        end_1_ts = float(end_1_ts)
    
    if kick_off_2_ts is None:
        kick_off_2_ts = end_1_ts + 900  # 15 minutos de descanso
        print(f"DEBUG: Usando fallback kick_off_2_ts = {kick_off_2_ts}")
    else:
        kick_off_2_ts = float(kick_off_2_ts)
    
    if end_2_ts is None:
        end_2_ts = kick_off_2_ts + 2400  # 40 minutos después
        print(f"DEBUG: Usando fallback end_2_ts = {end_2_ts}")
    else:
        end_2_ts = float(end_2_ts)

    # Validar duración de los tiempos
    if kick_off_1_ts is not None and end_1_ts is not None:
        first_half_duration = end_1_ts - kick_off_1_ts
        print(f"DEBUG: Duración del primer tiempo calculada: {first_half_duration}")
    else:
        first_half_duration = 2400  # Valor por defecto
        print("DEBUG: Usando duración por defecto para el primer tiempo: 2400 segundos")

    # Validar hitos manuales
    if method == 'manual':
        if not all([kick_off_1_ts, end_1_ts, kick_off_2_ts, end_2_ts]):
            print(f"ERROR: Hitos manuales incompletos: kick_off_1_ts={kick_off_1_ts}, end_1_ts={end_1_ts}, kick_off_2_ts={kick_off_2_ts}, end_2_ts={end_2_ts}")
            raise ValueError("Los hitos manuales no están completamente definidos en el perfil.")
        print(f"DEBUG: Hitos manuales validados correctamente: kick_off_1={kick_off_1_ts}, end_1={end_1_ts}, kick_off_2={kick_off_2_ts}, end_2={end_2_ts}")

    # Validar eventos antes de procesar
    for ev in events:
        if col_time not in ev or ev[col_time] is None:
            print(f"WARNING: Evento sin timestamp válido: {ev}")
        if col_event_type not in ev or not ev[col_event_type]:
            print(f"WARNING: Evento sin tipo válido: {ev}")

    # Depuración de períodos detectados
    print(f"DEBUG: Períodos detectados: kick_off_1_ts={kick_off_1_ts}, end_1_ts={end_1_ts}, kick_off_2_ts={kick_off_2_ts}, end_2_ts={end_2_ts}")

    # Depuración de hitos manuales
    print(f"DEBUG: Hitos manuales - kick_off_1: {kick_off_1_ts}, end_1: {end_1_ts}, kick_off_2: {kick_off_2_ts}, end_2: {end_2_ts}")

    # Iterar eventos para asignar Game_Time, DETECTED_PERIOD y Time_Group
    enriched_events = []
    for ev in events:
        event_dict = ev.copy()

        # Inicializar extra_data si no existe
        if 'extra_data' not in event_dict:
            event_dict['extra_data'] = {}

        # Obtener datos del evento
        category = event_dict.get(col_event_type, '').upper()
        timestamp = event_dict.get(col_time, None)

        # Validar datos faltantes
        if timestamp is None or not category:
            event_dict['extra_data']['Game_Time'] = "00:00"
            event_dict['extra_data']['DETECTED_PERIOD'] = None
            event_dict['extra_data']['Time_Group'] = "Sin datos"
            enriched_events.append(event_dict)
            continue

        # Convertir timestamp a float para operaciones matemáticas
        try:
            timestamp = float(timestamp)
        except (ValueError, TypeError):
            event_dict['extra_data']['Game_Time'] = "00:00"
            event_dict['extra_data']['DETECTED_PERIOD'] = None
            event_dict['extra_data']['Time_Group'] = "Sin datos"
            enriched_events.append(event_dict)
            continue

        # Detectar período
        detected_period = 1
        if kick_off_2_ts is not None and timestamp >= kick_off_2_ts:
            detected_period = 2
        elif kick_off_1_ts is not None and timestamp >= kick_off_1_ts:
            detected_period = 1

        # Calcular Game_Time
        # Ya no necesitamos validar kick_off_1_ts porque tenemos fallback
        if detected_period == 1:
            game_time_sec = timestamp - kick_off_1_ts
        else:
            game_time_sec = first_half_duration + (timestamp - kick_off_2_ts)

        # Asignar Time_Group
        time_group = assign_time_group(game_time_sec, first_half_duration)

        # Enriquecer evento
        event_dict['extra_data']['Game_Time'] = seconds_to_mmss(game_time_sec)
        event_dict['extra_data']['DETECTED_PERIOD'] = detected_period
        event_dict['extra_data']['Time_Group'] = time_group

        # Convertir timestamp_sec a int para la base de datos
        event_dict['timestamp_sec'] = int(timestamp)

        # Limpiar evento
        event_dict = clean_row(event_dict)
        enriched_events.append(event_dict)

    return enriched_events


def enrich_events(events, match_info, profile=None):
    """
    Función principal de enriquecimiento.
    Procesa eventos de rugby añadiendo Game_Time, períodos y grupos de tiempo.
    """
    # Usar la función backup que funciona correctamente
    enriched = calculate_game_time_from_zero_backup(events, match_info, profile)
    
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
