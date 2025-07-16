import pandas as pd
import json
import xml.etree.ElementTree as ET
import re
import os


def time_str_to_seconds(time_str):
    """Convierte tiempo en formato string a segundos"""
    if isinstance(time_str, (int, float)):
        return int(time_str)
    if not isinstance(time_str, str):
        return 0
    time_str = time_str.strip()
    if ":" in time_str:
        try:
            parts = list(map(int, time_str.split(":")))
            if len(parts) == 2:
                return parts[0] * 60 + parts[1]
            elif len(parts) == 3:
                return parts[0] * 3600 + parts[1] * 60 + parts[2]
        except ValueError:
            return 0
    # Extraer solo números si no hay formato de tiempo
    numbers = re.sub(r"\D", "", time_str)
    return int(numbers) if numbers else 0


def parse_coordinates(value):
    """Parsea coordenadas en formato 'x;y' o valores separados"""
    if not value or not isinstance(value, str):
        return None, None
    if ";" in value:
        parts = value.split(";")
        if len(parts) == 2:
            try:
                return float(parts[0]), float(parts[1])
            except ValueError:
                return None, None
    return None, None


def extract_descriptors(row, profile):
    """Extrae descriptores basándose en la configuración del perfil"""
    descriptors = {}
    time_mapping = profile.get("time_mapping", {})
    
    # Si el método es event_based, buscar descriptores
    if time_mapping.get("method") == "event_based":
        for key, config in time_mapping.items():
            if isinstance(config, dict) and "descriptor" in config:
                descriptor_col = config.get("descriptor")
                if descriptor_col and descriptor_col in row:
                    descriptor_value = row.get(descriptor_col)
                    if descriptor_value:
                        descriptors[key] = str(descriptor_value).strip()
    
    return descriptors


def normalize_excel_to_json(filepath, profile, discard_categories=None):
    """Normaliza archivo Excel a formato JSON"""
    # Validar archivo
    if not os.path.exists(filepath):
        print(f"❌ El archivo {filepath} no existe.")
        return {}
    
    print(f"✅ Procesando {filepath} con perfil {profile.get('events_sheet', 'MATRIZ')}")
    
    # Configuración del perfil
    events_sheet = profile.get("events_sheet", "MATRIZ")
    meta_sheet = profile.get("meta_sheet")
    col_event_type = profile.get("col_event_type", "CATEGORY")
    col_player = profile.get("col_player", "PLAYER")
    col_time = profile.get("col_time", "SECOND")
    col_duration = profile.get("col_duration")
    col_x = profile.get("col_x", "COORDINATE_X")
    col_y = profile.get("col_y", "COORDINATE_Y")
    col_team = profile.get("col_team")
    # Las categorías a descartar ahora se pasan como parámetro
    discard_categories = set(discard_categories or [])
    time_mapping = profile.get("time_mapping", {})

    try:
        # Leer archivo Excel
        df = pd.read_excel(filepath, sheet_name=None)
        
        # 🔍 DEBUGGING: Guardar Excel original como JSON para análisis
        import json
        from datetime import datetime
        
        # Crear directorio de debug si no existe
        debug_dir = "/app/uploads/debug_excel"
        os.makedirs(debug_dir, exist_ok=True)
        
        # Nombre del archivo de debug basado en el timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        excel_filename = os.path.basename(filepath).replace('.xlsx', '').replace('.xls', '')
        debug_json_path = os.path.join(debug_dir, f"{excel_filename}_{timestamp}_original.json")
        debug_columns_path = os.path.join(debug_dir, f"{excel_filename}_{timestamp}_columns.json")
        
        # Convertir todas las hojas a JSON
        excel_debug_data = {}
        excel_columns_info = {}
        
        for sheet_name, sheet_df in df.items():
            print(f"🔍 DEBUG: Procesando hoja '{sheet_name}' con {len(sheet_df)} filas y {len(sheet_df.columns)} columnas")
            
            # Guardar información de columnas
            excel_columns_info[sheet_name] = {
                "columns": list(sheet_df.columns),
                "dtypes": {col: str(dtype) for col, dtype in sheet_df.dtypes.items()},
                "shape": sheet_df.shape,
                "null_counts": sheet_df.isnull().sum().to_dict()
            }
            
            # Convertir DataFrame a JSON serializable
            # Manejar valores NaN, fechas, time, etc.
            sheet_json = sheet_df.copy()
            
            # Convertir todos los tipos problemáticos a string
            for col in sheet_json.columns:
                if sheet_json[col].dtype == 'datetime64[ns]':
                    sheet_json[col] = sheet_json[col].astype(str)
                elif sheet_json[col].dtype == 'object':
                    # Convertir objetos time y otros tipos no serializables
                    sheet_json[col] = sheet_json[col].apply(lambda x: str(x) if x is not None else None)
            
            # Reemplazar NaN con None para JSON
            sheet_json = sheet_json.where(pd.notna(sheet_json), None)
            
            # Convertir a lista de diccionarios
            excel_debug_data[sheet_name] = sheet_json.to_dict(orient='records')
            
        # Guardar JSON original
        with open(debug_json_path, 'w', encoding='utf-8') as f:
            json.dump(excel_debug_data, f, indent=2, ensure_ascii=False)
        
        # Guardar información de columnas
        with open(debug_columns_path, 'w', encoding='utf-8') as f:
            json.dump(excel_columns_info, f, indent=2, ensure_ascii=False)
        
        print(f"🔍 DEBUG: Excel original guardado en {debug_json_path}")
        print(f"🔍 DEBUG: Información de columnas guardada en {debug_columns_path}")
        
        # Mostrar resumen de columnas de la hoja principal
        if events_sheet in excel_columns_info:
            main_sheet_info = excel_columns_info[events_sheet]
            print(f"🔍 DEBUG: Hoja principal '{events_sheet}' tiene {len(main_sheet_info['columns'])} columnas:")
            for i, col in enumerate(main_sheet_info['columns']):
                null_count = main_sheet_info['null_counts'].get(col, 0)
                dtype = main_sheet_info['dtypes'].get(col, 'unknown')
                print(f"  [{i+1:2d}] {col} ({dtype}) - {null_count} nulos")
        
        if events_sheet not in df:
            print(f"❌ Hoja '{events_sheet}' no encontrada. Hojas disponibles: {list(df.keys())}")
            # Intentar con la primera hoja disponible
            events_sheet = list(df.keys())[0]
            print(f"🔍 Usando hoja alternativa: {events_sheet}")
        
        events_df = df[events_sheet].copy()
        print(f"✅ Datos leídos: {len(events_df)} filas de la hoja '{events_sheet}'")

        # Extraer metadatos de la hoja MATCHES
        match_info = {}
        if meta_sheet and meta_sheet in df:
            meta = df[meta_sheet].iloc[0].to_dict()
            print(f"✅ Metadatos encontrados en hoja '{meta_sheet}': {list(meta.keys())}")
            
            # Mapear campos del Excel a campos del modelo Match
            match_info = {
                # Campos obligatorios
                "team": meta.get("TEAM") or meta.get("EQUIPO") or "",
                "opponent_name": meta.get("OPPONENT") or meta.get("RIVAL") or "",
                "date": str(meta.get("DATE", "2023-01-01"))[:10],
                
                # Campos opcionales
                "location": meta.get("LOCATION") or meta.get("LUGAR") or "",
                "competition": meta.get("COMPETITION") or meta.get("COMPETICION") or "",
                "round": meta.get("ROUND") or meta.get("FECHA") or "",
                "referee": meta.get("REFEREE") or meta.get("ARBITRO") or "",
                "video_url": meta.get("VIDEO_URL") or meta.get("VIDEO") or "",
                "result": meta.get("RESULT") or meta.get("RESULTADO") or "",
                "field": meta.get("FIELD") or meta.get("CANCHA") or "",
                "rain": meta.get("RAIN") or meta.get("LLUVIA") or "",
                "muddy": meta.get("MUDDY") or meta.get("BARRO") or "",
                "wind_1p": meta.get("WIND_1P") or meta.get("VIENTO_1T") or "",
                "wind_2p": meta.get("WIND_2P") or meta.get("VIENTO_2T") or "",
            }
            
            # Limpiar valores None y convertir a string
            match_info = {k: str(v) if v is not None and str(v).lower() not in ['nan', 'none', ''] else "" 
                         for k, v in match_info.items()}
            
            print(f"✅ Match info extraído: {match_info}")
        else:
            print(f"⚠️  Hoja '{meta_sheet}' no encontrada. Usando valores por defecto.")
            # Valores por defecto - todos los campos del modelo Match
            match_info = {
                "team": "",
                "opponent_name": "",
                "date": "2023-01-01",
                "location": "",
                "competition": "",
                "round": "",
                "referee": "",
                "video_url": "",
                "result": "",
                "field": "",
                "rain": "",
                "muddy": "",
                "wind_1p": "",
                "wind_2p": "",
            }

        # Procesar eventos
        if col_event_type not in events_df.columns:
            print(f"❌ Columna '{col_event_type}' no encontrada. Columnas disponibles: {list(events_df.columns)}")
            return {}
        
        events = []
        processed_count = 0
        for _, row in events_df.iterrows():
            processed_count += 1
            
            try:
                category = str(row.get(col_event_type, "")).strip()
                if not category or category in discard_categories:
                    continue

                time_sec = time_str_to_seconds(row.get(col_time))
                duration_sec = time_str_to_seconds(row.get(col_duration)) if col_duration else 4

                # Coordenadas
                if col_x in row and col_y in row:
                    x, y = row.get(col_x), row.get(col_y)
                else:
                    x, y = parse_coordinates(row.get(col_x)) if col_x in row else (None, None)

                # Equipo
                team = str(row.get(col_team)).strip() if col_team and col_team in row else None

                # Período - SOLO preservar PERIODS del Excel si existe
                # Toda la lógica de detección de períodos se maneja en enricher.py
                period = None
                if 'PERIODS' in row and pd.notna(row['PERIODS']) and row['PERIODS'] != '':
                    period = int(row['PERIODS'])
                    print(f"DEBUG normalizer: preservando PERIODS={period} del Excel para evento {category}")
                else:
                    print(f"DEBUG normalizer: sin PERIODS definido para evento {category} - se calculará en enricher")

                # Descriptores
                descriptors = extract_descriptors(row, profile)

                # Jugadores
                players = []
                if col_player and row.get(col_player):
                    players.append(str(row.get(col_player)).strip())
                if row.get("JUGADOR 2"):
                    players.append(str(row.get("JUGADOR 2")).strip())

                event = {
                    "event_type": category,
                    "timestamp_sec": time_sec,
                    "players": players or None,
                    "x": x,
                    "y": y,
                    "team": team,
                    "period": period,
                    "extra_data": {
                        "clip_start": max(0, time_sec - duration_sec / 2),
                        "clip_end": time_sec + duration_sec / 2,
                        **descriptors
                    }
                }

                # Agregar columnas adicionales a extra_data
                excluded_cols = [col_event_type, col_time, col_player, col_x, col_y, col_team, "JUGADOR 2"]
                if col_duration:
                    excluded_cols.append(col_duration)
                
                # Excluir columnas que interfieren con cálculos de tiempo
                time_calc_cols = ["kick_off_1", "end_1", "kick_off_2", "end_2", "Game_Time", "TIME(VIDEO)", "Time_Group"]
                excluded_cols.extend(time_calc_cols)
                
                # Preservar PERIODS explícitamente si existe
                if 'PERIODS' in row and pd.notna(row['PERIODS']) and row['PERIODS'] != '':
                    event["extra_data"]["PERIODS"] = row['PERIODS']
                
                for col, val in row.items():
                    if col not in excluded_cols:
                        event["extra_data"][col] = val

                events.append(event)
                
            except Exception as e:
                print(f"❌ Error procesando fila {processed_count}: {e}")
                continue

        print(f"✅ Procesados {len(events)} eventos de {processed_count} filas")

        # Debug: mostrar los primeros 3 eventos antes del enriquecimiento
        for i, event in enumerate(events[:3]):
            print(f"DEBUG normalizer - Evento {i}: SECOND={event.get('SECOND', 'NO EXISTE')}, event_type={event.get('event_type', 'NO EXISTE')}")

        # Debug: mostrar los primeros 3 eventos después del enriquecimiento
        for i, event in enumerate(events[:3]):
            print(f"DEBUG normalizer - Evento {i} después de enriquecimiento: SECOND={event.get('SECOND', 'NO EXISTE')}, TIME(VIDEO)={event.get('extra_data', {}).get('TIME(VIDEO)', 'NO EXISTE')}")

        # Mantener campos importantes en extra_data (no solo tiempo)
        for event in events:
            extra = event.get('extra_data', {})
            filtered = {}
            
            # Campos de tiempo (obligatorios)
            if 'TIME(VIDEO)' in extra:
                filtered['TIME(VIDEO)'] = extra['TIME(VIDEO)']
            if 'Game_Time' in extra:
                filtered['Game_Time'] = extra['Game_Time']
            if 'Time_Group' in extra:
                filtered['Time_Group'] = extra['Time_Group']
            
            # Campos importantes para análisis (preservar)
            important_fields = [
                'PERIODS', 'DESCRIPTOR', 'DETECTED_PERIOD',
                'PLAYER', 'PLAYER_2', 'COORDINATE_X', 'COORDINATE_Y', 
                'TEAM', 'OUTCOME', 'NOTES', 'OUTCOME_DESCRIPTOR',
                'YELLOW-CARD', 'RED-CARD', 'LINE_THROWER', 'LINE_RECEIVER',
                'Team_Tackle_Count', 'ORIGIN', 'END', 'PHASES'
            ]
            
            for field in important_fields:
                if field in extra:
                    filtered[field] = extra[field]
            
            # Preservar otros campos que no sean de cálculo interno
            excluded_calc_fields = ['clip_start', 'clip_end']
            for key, value in extra.items():
                if key not in filtered and key not in excluded_calc_fields:
                    filtered[key] = value
            
            event['extra_data'] = filtered

        # 🔍 DEBUG: Guardar resultado final normalizado para comparación
        debug_normalized_path = os.path.join(debug_dir, f"{excel_filename}_{timestamp}_normalized.json")
        
        result = {
            "match": match_info,
            "events": events
        }
        
        # Función para hacer JSON serializable
        def make_json_serializable(obj):
            if isinstance(obj, dict):
                return {k: make_json_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [make_json_serializable(item) for item in obj]
            elif hasattr(obj, '__dict__'):
                return str(obj)
            elif isinstance(obj, (int, float, str, bool, type(None))):
                return obj
            else:
                return str(obj)
        
        # Hacer el resultado JSON serializable
        json_safe_result = make_json_serializable(result)
        
        # Guardar resultado normalizado
        with open(debug_normalized_path, 'w', encoding='utf-8') as f:
            json.dump(json_safe_result, f, indent=2, ensure_ascii=False)
        
        print(f"🔍 DEBUG: Resultado normalizado guardado en {debug_normalized_path}")
        
        # Mostrar resumen de lo que se preservó vs lo que se perdió
        print(f"🔍 DEBUG: Resumen de normalización:")
        print(f"  - Eventos procesados: {len(events)}")
        print(f"  - Match info keys: {list(match_info.keys())}")
        if events:
            sample_event = events[0]
            print(f"  - Event keys: {list(sample_event.keys())}")
            print(f"  - Extra_data keys: {list(sample_event.get('extra_data', {}).keys())}")
        
        return json_safe_result

    except Exception as e:
        print(f"❌ Error en normalización: {str(e)}")
        return {}


def normalize_xml_to_json(filepath, profile, discard_categories=None):
    """Normaliza archivo XML a formato JSON"""
    if not os.path.exists(filepath):
        print(f"❌ El archivo {filepath} no existe.")
        return {}

    discard_categories = set(discard_categories or [])

    try:
        tree = ET.parse(filepath)
        root = tree.getroot()

        events = []
        for inst in root.findall(".//instance"):
            event_type = inst.findtext("code")
            
            # Filtrar categorías descartadas
            if not event_type or event_type in discard_categories:
                continue
                
            start = float(inst.findtext("start") or 0)
            end = float(inst.findtext("end") or 0)
            duration = end - start
            timestamp = start + duration / 2

            # Coordenadas
            pos_x = inst.findall("pos_x")
            if pos_x:
                x = float(pos_x[0].text)
                y = float(inst.findall("pos_y")[0].text)
            else:
                x = y = None

            # Descriptores
            descriptors = {}
            for lbl in inst.findall("label"):
                group = lbl.findtext("group")
                text = lbl.findtext("text")
                if text:
                    key = group if group else "MISC"
                    if key in descriptors:
                        if isinstance(descriptors[key], list):
                            descriptors[key].append(text)
                        else:
                            descriptors[key] = [descriptors[key], text]
                    else:
                        descriptors[key] = text

            event = {
                "event_type": event_type,
                "timestamp_sec": round(timestamp),
                "players": None,
                "x": x,
                "y": y,
                "team": None,
                "period": 1,
                "extra_data": {
                    "clip_start": start,
                    "clip_end": end,
                    **descriptors
                }
            }

            events.append(event)

        match_info = {
            "team": "Desconocido",
            "opponent": "Rival",
            "date": "2023-01-01"
        }

        return {"match": match_info, "events": events}

    except Exception as e:
        print(f"❌ Error en normalización XML: {str(e)}")
        return {}


def get_categories_from_excel(filepath, profile):
    """Extrae las categorías únicas presentes en el archivo Excel"""
    if not os.path.exists(filepath):
        print(f"❌ El archivo {filepath} no existe.")
        return []
    
    try:
        events_sheet = profile.get("events_sheet", "MATRIZ")
        col_event_type = profile.get("col_event_type", "CATEGORY")
        
        df = pd.read_excel(filepath, sheet_name=events_sheet)
        categories = df[col_event_type].dropna().unique().tolist()
        
        # Convertir a string y limpiar
        categories = [str(cat).strip() for cat in categories if str(cat).strip()]
        
        return sorted(categories)
        
    except Exception as e:
        print(f"❌ Error al extraer categorías: {str(e)}")
        return []


def get_categories_from_xml(filepath, profile):
    """Extrae las categorías únicas presentes en el archivo XML"""
    if not os.path.exists(filepath):
        print(f"❌ El archivo {filepath} no existe.")
        return []
    
    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
        
        categories = set()
        for inst in root.findall(".//instance"):
            event_type = inst.findtext("code")
            if event_type:
                categories.add(str(event_type).strip())
        
        return sorted(list(categories))
        
    except Exception as e:
        print(f"❌ Error al extraer categorías XML: {str(e)}")
        return []


def parse_discard_categories(discard_string):
    """Parsea un string de categorías separadas por ; y devuelve una lista limpia"""
    if not discard_string:
        return []
    
    categories = []
    for cat in discard_string.split(';'):
        cat = cat.strip()
        if cat:
            categories.append(cat)
    
    return categories
