#!/usr/bin/env python3
"""
Script completo para convertir XML a JSON enriquecido
Usa importer.py y enricher.py para procesar eventos igual que en base_de_datos
Pero genera JSONs en lugar de insertar en base de datos
"""
import sys
import os
import json
import xml.etree.ElementTree as ET
from datetime import datetime

# Agregar directorio backend al path para imports
sys.path.insert(0, '/app')

def parse_xml_events(xml_path, profile):
    """
    Extrae eventos del XML usando misma lógica que importer.py
    """
    tree = ET.parse(xml_path)
    root = tree.getroot()
    
    events = []
    
    for inst in root.findall(".//instance"):
        code_elem = inst.find("code")
        if code_elem is None:
            continue
        
        event_type = code_elem.text.strip() if code_elem.text else ""
        
        start_elem = inst.find("start")
        end_elem = inst.find("end")
        if start_elem is None or end_elem is None:
            continue
        
        try:
            start_sec = float(start_elem.text)
            end_sec = float(end_elem.text)
            duration = end_sec - start_sec
        except:
            continue
        
        # Extraer descriptores y jugadores
        extra_data = {}
        players = []
        x = None
        y = None
        
        for label in inst.findall("label"):
            group_elem = label.find("group")
            text_elem = label.find("text")
            
            if group_elem is not None and text_elem is not None:
                group = group_elem.text.strip() if group_elem.text else ""
                text = text_elem.text.strip() if text_elem.text else ""
                
                if group.upper() == "JUGADOR" and text:
                    players.append(text)
                elif group.upper() == "EQUIPO":
                    # Identificar si es PESCARA o RIVAL
                    extra_data["EQUIPO"] = text
                elif group.upper() == "X":
                    try:
                        x = float(text)
                    except:
                        pass
                elif group.upper() == "Y":
                    try:
                        y = float(text)
                    except:
                        pass
                else:
                    extra_data[group] = text
        
        event = {
            "event_type": event_type,
            "timestamp_sec": start_sec,
            "duration": duration,
            "players": players if players else None,
            "x": x,
            "y": y,
            "extra_data": extra_data
        }
        events.append(event)
    
    return events


def seconds_to_mmss(seconds):
    """Convierte segundos a formato MM:SS"""
    try:
        total_seconds = round(float(seconds))
        minutes = total_seconds // 60
        secs = total_seconds % 60
        return f"{minutes:02d}:{secs:02d}"
    except Exception:
        return "00:00"

def assign_time_group(game_time_sec, first_half_duration=2400.0):
    """Asigna grupos de tiempo"""
    first_half_mid = first_half_duration / 2
    second_half_mid = first_half_duration + (first_half_duration / 2)
    
    if game_time_sec < first_half_mid:
        return "0'- 20'"
    elif game_time_sec < first_half_duration:
        return "20'- 40'"
    elif game_time_sec < second_half_mid:
        return "40'- 60'"
    else:
        return "60'- 80'"

def enrich_events_simple(events, match_info, profile):
    """
    Versión simplificada del enricher que genera el formato esperado por el frontend
    """
    
    enriched = []
    event_id = 1
    
    # Calcular tiempos del partido
    kick_off_1 = profile.get("kick_off_1", 0)
    end_1 = profile.get("end_1", 2400)
    kick_off_2 = profile.get("kick_off_2", 2400)
    end_2 = profile.get("end_2", 4800)
    
    for ev in events:
        timestamp_sec = ev["timestamp_sec"]
        
        # Calcular Game_Time
        if timestamp_sec <= end_1:
            game_time_sec = timestamp_sec - kick_off_1
        elif timestamp_sec >= kick_off_2:
            game_time_sec = (end_1 - kick_off_1) + (timestamp_sec - kick_off_2)
        else:
            game_time_sec = None
        
        # Determinar período
        if timestamp_sec < end_1:
            period = 1
        else:
            period = 2
        
        # Identificar equipo (PESCARA vs RIVAL/OPPONENT)
        equipo_label = ev.get("extra_data", {}).get("EQUIPO", "")
        if "PESCARA" in equipo_label.upper():
            team = match_info["team"]
        elif "RIVAL" in equipo_label.upper():
            team = "OPPONENT"
        else:
            # Por defecto asumimos PESCARA si no está especificado
            team = match_info["team"]
        
        # Construir evento enriquecido
        enriched_event = {
            "ID": event_id,
            "CATEGORY": ev["event_type"],
            "SECOND": timestamp_sec,
            "MINUTE": timestamp_sec / 60.0,
            "TIME": f"{int(timestamp_sec // 60):02d}:{int(timestamp_sec % 60):02d}",
            "DURATION": ev.get("duration", 0),
            "GAME": 1,
            "TEAM": team,
            "OPPONENT": match_info["opponent"],
            "PERIODS": period,
            "COORDINATE_X": ev.get("x"),
            "COORDINATE_Y": ev.get("y"),
        }
        
        # Agregar Game_Time
        if game_time_sec is not None:
            enriched_event["Game_Time"] = seconds_to_mmss(game_time_sec)
            enriched_event["TIME(VIDEO)"] = seconds_to_mmss(timestamp_sec)
            
            # Time_Group (solo si hay game_time)
            first_half_duration = end_1 - kick_off_1
            enriched_event["Time_Group"] = assign_time_group(game_time_sec, first_half_duration)
        
        # Agregar jugadores
        if ev.get("players"):
            enriched_event["PLAYER"] = ev["players"][0] if len(ev["players"]) == 1 else ev["players"]
        
        # Mapear descriptores del extra_data
        extra = ev.get("extra_data", {})
        
        # Descriptores generales
        enriched_event["ADVANCE"] = extra.get("AVANCE")
        enriched_event["SECTOR"] = extra.get("SECTOR")
        enriched_event["SQUARE"] = extra.get("CUADRADO")
        
        # SCRUM
        enriched_event["SCRUM_RESULT"] = extra.get("RESULTADO-SCRUM") or extra.get("SCRUM")
        
        # LINEOUT
        enriched_event["LINE_RESULT"] = extra.get("RESULTADO-LINE")
        enriched_event["LINE_POSITION"] = extra.get("POSICION-LINE")
        enriched_event["LINE_QUANTITY"] = extra.get("CANTIDAD-LINE")
        enriched_event["LINE_THROWER"] = extra.get("TIRADOR-LINE")
        enriched_event["LINE_RECEIVER"] = extra.get("RECEPTOR-LINE") or extra.get("RECEPTOR")
        enriched_event["LINE_PLAY"] = extra.get("JUGADA")
        enriched_event["OPPONENT_JUMPER"] = extra.get("SALTADOR-RIVAL")
        
        # TACKLE
        enriched_event["TACKLE_FRAME"] = extra.get("ENCUADRE-TACKLE")
        
        # KICK
        enriched_event["KICK_TYPE"] = extra.get("PIE") or extra.get("TIPO-PIE")
        enriched_event["GOAL_KICK"] = extra.get("RESULTADO-PALOS")
        
        # PENALTY/INFRACTION
        enriched_event["INFRACTION_TYPE"] = extra.get("INFRACCION") or extra.get("TIPO-INFRACCION")
        enriched_event["YELLOW-CARD"] = extra.get("TARJETA-AMARILLA") or extra.get("AMARILLA")
        enriched_event["RED-CARD"] = extra.get("TARJETA-ROJA") or extra.get("ROJA")
        
        # TURNOVER
        for key in ["TIPO-PERDIDA/RECUPERACIÓN", "TIPO-PERDIDA/RECUPERACION", "TIPO-PERDIDA/RECUPERACIN"]:
            if key in extra:
                enriched_event["TURNOVER_TYPE"] = extra[key]
                break
        
        # POINTS
        points_type = extra.get("TIPO-PUNTOS")
        if points_type:
            enriched_event["POINTS"] = points_type
            # Calcular valor
            if points_type == "TRY":
                enriched_event["POINTS(VALUE)"] = 5
            elif points_type == "CONVERSION":
                enriched_event["POINTS(VALUE)"] = 2
            elif points_type in ["PENALTY-KICK", "DROP-GOAL"]:
                enriched_event["POINTS(VALUE)"] = 3
        
        # BREAK
        enriched_event["BREAK_TYPE"] = extra.get("TIPO-QUIEBRE")
        enriched_event["BREAK_CHANNEL"] = extra.get("CANAL-QUIEBRE")
        
        # RUCK
        enriched_event["RUCK_SPEED"] = extra.get("VELOCIDAD-RUCK")
        
        # TRY_ORIGIN se calculará después
        enriched_event["TRY_ORIGIN"] = None
        
        enriched.append(enriched_event)
        event_id += 1
    
    # Calcular TRY_ORIGIN
    origin_categories = ["TURNOVER+", "SCRUM", "LINEOUT", "KICK OFF"]
    
    for event in enriched:
        if event.get("POINTS") == "TRY":
            try_time = event["SECOND"]
            try_team = event["TEAM"]
            
            # Buscar evento de origen previo del mismo equipo
            relevant_events = [
                e for e in enriched 
                if e["CATEGORY"] in origin_categories 
                and e["SECOND"] < try_time
                and e["TEAM"] == try_team
            ]
            
            if relevant_events:
                event["TRY_ORIGIN"] = relevant_events[-1]["CATEGORY"]
    
    return enriched


if __name__ == '__main__':
    # Configuración del partido
    match_info = {
        "team": "Pescara",
        "opponent": "Polisportiva L'Aquila",
        "date": "2024-11-02",
        "location": "L'Aquila",
        "video_url": "https://www.youtube.com/watch?v=xxGXH-Zc1i8",
    }
    
    profile = {
        "team": "Pescara",
        "opponent": "Polisportiva L'Aquila",
        "date": "2024-11-02",
        "kick_off_1": 0,
        "end_1": 2281,
        "kick_off_2": 2288,
        "end_2": 4474
    }
    
    xml_path = '/app/uploads/Polisportiva.xml'
    
    print("🔄 Paso 1: Parseando XML...")
    events = parse_xml_events(xml_path, profile)
    print(f"   ✅ Extraídos {len(events)} eventos del XML")
    
    print("🔄 Paso 2: Enriqueciendo eventos...")
    enriched_events = enrich_events_simple(events, match_info, profile)
    print(f"   ✅ Eventos enriquecidos con Game_Time, períodos, etc.")
    
    # Estadísticas
    events_with_players = [e for e in enriched_events if e.get('PLAYER')]
    opponent_events = [e for e in enriched_events if e.get('TEAM') == 'OPPONENT']
    try_origins = [e for e in enriched_events if e.get('TRY_ORIGIN')]
    
    print(f"\n📊 Estadísticas:")
    print(f"   - Total eventos: {len(enriched_events)}")
    print(f"   - Con jugador: {len(events_with_players)}")
    print(f"   - Del rival (OPPONENT): {len(opponent_events)}")
    print(f"   - Tries con origen: {len(try_origins)}")
    
    # Generar matches.json
    match_data = [{
        "MATCH_ID": 1,
        "TEAM": match_info["team"],
        "OPPONENT": match_info["opponent"],
        "DATE": match_info["date"],
        "LOCATION": match_info.get("location", ""),
        "VIDEO_URL": match_info.get("video_url", ""),
        "KICK_OFF_1": profile["kick_off_1"],
        "END_1": profile["end_1"],
        "KICK_OFF_2": profile["kick_off_2"],
        "END_2": profile["end_2"]
    }]
    
    # Guardar archivos
    print("\n💾 Guardando archivos JSON...")
    with open('/app/uploads/matrizPescara.json', 'w', encoding='utf-8') as f:
        json.dump(enriched_events, f, indent=2, ensure_ascii=False)
    
    with open('/app/uploads/matchesPescara.json', 'w', encoding='utf-8') as f:
        json.dump(match_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Archivos generados:")
    print(f"   - /app/uploads/matrizPescara.json")
    print(f"   - /app/uploads/matchesPescara.json")
    print(f"\n🎉 ¡Conversión completa!")
