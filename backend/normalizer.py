import pandas as pd
import json
import os
from typing import Dict
import numpy as np
import datetime

def normalize_excel_to_json(file_path: str, profile: Dict) -> Dict:
    """
    Convierte un archivo Excel a un JSON estandarizado (match + events) según un perfil de importación.
    """
    match_data = {}
    events = []

    try:
        # Leer hojas del Excel
        df_events = pd.read_excel(file_path, sheet_name=profile.get("events_sheet", "MATRIZ"))
        df_meta = pd.read_excel(file_path, sheet_name=profile.get("meta_sheet", "MATCHES"))

        # Extraer metadata del partido
        match_data = {
            "team": profile.get("team") or df_meta.iloc[0].get("TEAM", "Equipo Desconocido"),
            "opponent": profile.get("opponent") or df_meta.iloc[0].get("OPPONENT", "Rival Desconocido"),
            "date": profile.get("date") or str(df_meta.iloc[0].get("DATE", ""))[:10],
            "location": profile.get("location") or df_meta.iloc[0].get("FIELD", "Campo Desconocido"),
            "competition": df_meta.iloc[0].get("COMPETITION", None),
            "round": df_meta.iloc[0].get("ROUND", None),
            "game": df_meta.iloc[0].get("GAME", None),
            "rain": df_meta.iloc[0].get("RAIN", None),
            "muddy": df_meta.iloc[0].get("MUDDY", None),
            "wind_1p": df_meta.iloc[0].get("WIND_1P", None),
            "wind_2p": df_meta.iloc[0].get("WIND_2P", None),
            "result": df_meta.iloc[0].get("RESULT", None),
            "referee": df_meta.iloc[0].get("REFEREE", None),
            "result": df_meta.iloc[0].get("RESULT", None),
            "video": df_meta.iloc[0].get("VIDEO", None),
            "json": df_meta.iloc[0].get("JSON", None),
            "id_match": df_meta.iloc[0].get("ID_MATCH", None)
        }

        # Mapeo de columnas del perfil
        col_event_type = profile.get("col_event_type", "CATEGORY")
        col_player = profile.get("col_player", "PLAYER")
        col_time = profile.get("col_time", "SECOND")
        col_x = profile.get("col_x", "COORDINATE_X")
        col_y = profile.get("col_y", "COORDINATE_Y")

        # Preparar datos de eventos
        df_events = df_events.astype(object)
        data = df_events.where(pd.notnull(df_events), None).to_dict(orient="records")

        for row in data:
            event = {
                "event_type": row.get(col_event_type),
                "player": row.get(col_player),
                "timestamp_sec": row.get(col_time),
                "x": row.get(col_x),
                "y": row.get(col_y),
                "extra_data": {}
            }

            for col in df_events.columns:
                if col not in [col_event_type, col_player, col_time, col_x, col_y]:
                    val = row.get(col)
                    if pd.notna(val) and val != "undefined":
                        try:
                            val = convert_json_safe(val)
                        except TypeError:
                            val = str(val)
                        if isinstance(val, (datetime.time, datetime.date)):
                            val = val.isoformat()
                        elif isinstance(val, (np.integer, np.floating, np.bool_)):
                            val = val.item()

                        event["extra_data"][col] = val

            events.append(event)

        safe_match = convert_json_safe(match_data)

        # print(f"📦 Normalización OK: {len(events)} eventos generados")
        # print("📋 Metadata:", safe_match)
        if events:
            print("📋 Primer evento:", events[0])

        print("✔️ RESULT:", type(safe_match.get("result")), safe_match.get("result"))


        return {
            "match": safe_match,
            "events": events
        }

    except Exception as e:
        print("❌ Ocurrió un error al normalizar el archivo:")
        import traceback
        traceback.print_exc()
        return {}

def convert_json_safe(obj):
    def convert(v):
        if isinstance(v, (np.integer, int)):
            return int(v)
        elif isinstance(v, (np.floating, float)):
            return float(v)
        elif isinstance(v, (np.bool_, bool)):
            return bool(v)
        elif isinstance(v, (datetime.date, datetime.datetime)):
            return v.isoformat()
        elif isinstance(v, (np.ndarray, list, tuple)):
            return [convert(i) for i in v]
        return v

    if isinstance(obj, dict):
        return {k: convert(v) for k, v in obj.items()}
    return convert(obj)
