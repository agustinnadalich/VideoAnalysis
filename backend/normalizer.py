import pandas as pd
import json
import xml.etree.ElementTree as ET
import re
import os
from datetime import datetime
import tempfile


def make_json_serializable(obj):
    """Convierte objetos no serializables a JSON a formatos serializables"""
    if pd.isna(obj):
        return None
    elif isinstance(obj, (pd.Timestamp, datetime)):
        return obj.isoformat()
    elif isinstance(obj, pd.Timedelta):
        return str(obj)
    elif hasattr(obj, 'time'):  # datetime.time objects
        return obj.strftime('%H:%M:%S')
    elif hasattr(obj, 'date'):  # datetime.date objects
        return obj.isoformat()
    elif isinstance(obj, (pd.Int64Dtype, pd.Float64Dtype)):
        return str(obj)
    elif isinstance(obj, str):
        return obj.strip()
    else:
        return str(obj) if obj is not None else None


def convert_dataframe_to_json_safe(df):
    """Convierte un DataFrame a un diccionario JSON-safe"""
    records = []
    for _, row in df.iterrows():
        record = {}
        for col, val in row.items():
            record[col] = make_json_serializable(val)
        records.append(record)
    return records


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

# ============================================================
# █ █▄ ▄█ █▀▄ ▄▀▄ █▀▄ ▀█▀ ▄▀▄ █▄ █ ▀█▀ ██▀ 
# █ █ ▀ █ █▀  ▀▄▀ █▀▄  █  █▀█ █ ▀█  █  █▄▄ : 
# Analizar cuidadosamente esta sección.
# Actualmente, los descriptores solo se extraen si el método es 'event_based'.
# Revisar si es necesario soportar otros métodos de extracción de descriptores
# según el perfil de importación y la fuente de datos.
# ============================================================

# def extract_descriptors(row, profile):
#     """Extrae descriptores basándose en la configuración del perfil"""
#     descriptors = {}
#     time_mapping = profile.get("time_mapping", {})
    
#     # Si el método es event_based, buscar descriptores
#     if time_mapping.get("method") == "event_based":
#         for key, config in time_mapping.items():
#             if isinstance(config, dict) and "descriptor" in config:
#                 descriptor_col = config.get("descriptor")
#                 if descriptor_col and descriptor_col in row:
#                     descriptor_value = row.get(descriptor_col)
#                     if descriptor_value:
#                         descriptors[key] = str(descriptor_value).strip()
    
#     return descriptors


def normalize_excel_to_json(filepath, profile, discard_categories=None):
    """Normaliza archivo Excel a formato JSON"""
    # Validar archivo
    if not os.path.exists(filepath):
        print(f"❌ El archivo {filepath} no existe.")
        return None

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
    discard_categories = set(discard_categories or [])
    time_mapping = profile.get("time_mapping", {})

    try:
        print(f"🔍 Intentando leer el archivo Excel: {filepath}")
        df = pd.read_excel(filepath, sheet_name=None)
        print(f"✅ Archivo Excel leído correctamente: {filepath}")

        # Guardar Excel original como JSON para análisis
        from datetime import datetime
        debug_dir = "/app/uploads/debug_excel"
        try:
            os.makedirs(debug_dir, exist_ok=True)
        except OSError:
            # Si no se puede crear el directorio, usar temporal
            debug_dir = tempfile.mkdtemp(prefix="debug_excel_")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        excel_filename = os.path.basename(filepath).replace('.xlsx', '').replace('.xls', '')
        debug_json_path = os.path.join(debug_dir, f"{excel_filename}_{timestamp}_original.json")
        debug_columns_path = os.path.join(debug_dir, f"{excel_filename}_{timestamp}_columns.json")

        excel_debug_data = {}
        excel_columns_info = {}

        for sheet_name, sheet_df in df.items():
            print(f"🔍 Procesando hoja: {sheet_name}")
            excel_debug_data[sheet_name] = convert_dataframe_to_json_safe(sheet_df)
            excel_columns_info[sheet_name] = list(sheet_df.columns)

        with open(debug_json_path, 'w', encoding='utf-8') as f:
            json.dump(excel_debug_data, f, ensure_ascii=False, indent=4)

        with open(debug_columns_path, 'w', encoding='utf-8') as f:
            json.dump(excel_columns_info, f, ensure_ascii=False, indent=4)

        print(f"🔍 DEBUG: Excel original guardado en {debug_json_path}")
        print(f"🔍 DEBUG: Información de columnas guardada en {debug_columns_path}")

        if events_sheet not in df:
            print(f"❌ La hoja de eventos '{events_sheet}' no existe en el archivo Excel.")
            available_sheets = list(df.keys())
            print(f"🔍 Hojas disponibles: {available_sheets}")
            return None

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
            print(f"❌ La columna de tipo de evento '{col_event_type}' no existe en la hoja de eventos.")
            available_columns = list(events_df.columns)
            print(f"🔍 Columnas disponibles: {available_columns}")
            return None

        events = []
        processed_count = 0
        for _, row in events_df.iterrows():
            processed_count += 1
            event = {
                "event_type": make_json_serializable(row.get(col_event_type, "")),
                "timestamp_sec": make_json_serializable(row.get(col_time, 0)),
                "duration": make_json_serializable(row.get(col_duration, 0)),
                "x": make_json_serializable(row.get(col_x)),
                "y": make_json_serializable(row.get(col_y)),
                "extra_data": {
                    "player": make_json_serializable(row.get(col_player, "")),
                    "team": make_json_serializable(row.get(col_team, ""))
                }
            }
            events.append(event)

        print(f"✅ Procesados {len(events)} eventos de {processed_count} filas")
        
        return {"match": match_info, "events": events}

    except Exception as e:
        print(f"❌ Error al procesar el archivo Excel: {e}")
        import traceback
        traceback.print_exc()
        return None


def normalize_xml_to_json(filepath, profile, discard_categories=None):
    """Normaliza archivo XML a formato JSON"""
    print(f"🔍 normalize_xml_to_json: Iniciando procesamiento de {filepath}")
    
    if not os.path.exists(filepath):
        print(f"❌ El archivo {filepath} no existe.")
        return None

    discard_categories = set(discard_categories or [])
    print(f"🔍 Categorías a descartar: {discard_categories}")

    try:
        print(f"🔍 Parseando archivo XML...")
        
        # Intentar leer el archivo con diferentes codificaciones
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            print(f"🔍 Error UTF-8, probando con latin-1...")
            try:
                with open(filepath, 'r', encoding='latin-1') as f:
                    content = f.read()
            except UnicodeDecodeError:
                print(f"🔍 Error latin-1, probando con cp1252...")
                with open(filepath, 'r', encoding='cp1252') as f:
                    content = f.read()
        
        # Limpiar caracteres problemáticos
        import re
        content = re.sub(r'[^\x00-\x7F]+', '', content)  # Remover caracteres no-ASCII
        content = content.replace('�', '')  # Remover caracteres de reemplazo
        
        # Crear archivo temporal limpio
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.xml', delete=False) as temp_file:
            temp_file.write(content)
            temp_filepath = temp_file.name
        
        try:
            tree = ET.parse(temp_filepath)
            root = tree.getroot()
            print(f"🔍 XML parseado correctamente. Root tag: {root.tag}")
        finally:
            # Limpiar archivo temporal
            os.unlink(temp_filepath)
        
        # Buscar elementos instance
        instances = root.findall(".//instance")
        print(f"🔍 Encontrados {len(instances)} elementos instance")
        
        events = []
        for i, inst in enumerate(instances):
            event_type = inst.findtext("code")
            print(f"🔍 Procesando evento {i+1}: {event_type}")
            
            # Filtrar categorías descartadas
            if not event_type or event_type in discard_categories:
                print(f"🔍 Evento descartado: {event_type}")
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
            labels = inst.findall("label")
            print(f"🔍 Procesando {len(labels)} labels para evento {event_type}")
            
            for lbl in labels:
                group = lbl.findtext("group")
                text = lbl.findtext("text")
                print(f"🔍 Label: group={group}, text={text}")
                
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

        print(f"🔍 Procesados {len(events)} eventos válidos")
        
        match_info = {
            "team": "Desconocido",
            "opponent": "Rival",
            "date": "2023-01-01"
        }

        result = {"match": match_info, "events": events}
        print(f"🔍 Resultado final: {len(events)} eventos, match_info: {match_info}")
        return result

    except Exception as e:
        print(f"❌ Error en normalización XML: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


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


