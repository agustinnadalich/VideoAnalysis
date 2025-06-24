
import pandas as pd
import json
import os
from typing import Dict

def normalize_excel_to_json(file_path: str, profile: Dict) -> Dict:
    """
    Convierte un archivo Excel a un JSON estandarizado (match + events) según un perfil de importación.
    """
    match_data = {}
    events = []

    try:
        df_events = pd.read_excel(file_path, sheet_name=profile.get("events_sheet", "MATRIZ"))
        df_meta = pd.read_excel(file_path, sheet_name=profile.get("meta_sheet", "MATCHES"))

        # Extraer metadatos del partido desde hoja MATCHES o del perfil
        match_data = {
            "team": profile.get("team") or df_meta.iloc[0].get("TEAM", "Equipo Desconocido"),
            "opponent": profile.get("opponent") or df_meta.iloc[0].get("OPPONENT", "Rival Desconocido"),
            "date": profile.get("date") or str(df_meta.iloc[0].get("DATE", ""))[:10],
            "location": profile.get("location") or df_meta.iloc[0].get("LOCATION", "Campo Desconocido"),
            "competition": df_meta.iloc[0].get("COMPETITION", None),
            "weather": df_meta.iloc[0].get("WEATHER", None)
        }

        # Mapear columnas claves desde el perfil
        col_event_type = profile.get("col_event_type", "CATEGORY")
        col_player = profile.get("col_player", "PLAYER")
        col_time = profile.get("col_time", "SECOND")
        col_x = profile.get("col_x", "COORDINATE_X")
        col_y = profile.get("col_y", "COORDINATE_Y")

        for _, row in df_events.iterrows():
            event = {
                "event_type": row.get(col_event_type),
                "player": row.get(col_player),
                "timestamp_sec": row.get(col_time),
                "x": row.get(col_x),
                "y": row.get(col_y),
                "extra_data": {}
            }

            # Agregar todos los descriptores no mapeados a extra_data
            for col in df_events.columns:
                if col not in [col_event_type, col_player, col_time, col_x, col_y]:
                    val = row.get(col)
                    if pd.notna(val) and val != "undefined":
                        event["extra_data"][col] = val

            events.append(event)

        return {
            "match": match_data,
            "events": events
        }

    except Exception as e:
        print(f"❌ Error normalizando archivo: {e}")
        return {}

if __name__ == "__main__":
    profile = {
        "events_sheet": "MATRIZ",
        "meta_sheet": "MATCHES",
        "col_event_type": "CATEGORY",
        "col_player": "PLAYER",
        "col_time": "SECOND",
        "col_x": "COORDINATE_X",
        "col_y": "COORDINATE_Y",
        "team": "Pescara Rugby"
    }

    file_path = "backend/uploads/SERIE_B_PRATO_match_2.xlsx"

    data = normalize_excel_to_json(file_path, profile)

    import json
    import datetime

    def default_serializer(obj):
        if isinstance(obj, (datetime.date, datetime.time)):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")

    print(json.dumps(data, indent=2, ensure_ascii=False, default=default_serializer))

