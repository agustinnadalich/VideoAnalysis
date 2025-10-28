#!/usr/bin/env python3
"""
Script para convertir XML de LongoMatch al formato JSON que espera app.py
Genera matriz.json (eventos) y matches.json (info del partido)
"""
import xml.etree.ElementTree as ET
import json
from datetime import datetime

def parse_longomatch_to_json(xml_file_path, match_info):
    """
    Convierte XML de LongoMatch al formato JSON esperado por app.py
    
    match_info = {
        'team': 'PESCARA',
        'opponent': 'AVEZZANO',
        'date': '2025-10-19',
        'competition': 'AMISTOSO PRE-TEMPORADA',
        'result': '0-0'
    }
    """
    tree = ET.parse(xml_file_path)
    root = tree.getroot()
    
    events = []
    event_id = 1
    
    # Mapeo de categorías de LongoMatch a formato esperado
    category_mapping = {
        'EQUIPO': 'TEAM',
        'INFRACCION': 'INFRACTION',
        'PENAL': 'PENALTY',
        'SCRUM': 'SCRUM',
        'LINEOUT': 'LINEOUT',
        'TACKLE': 'TACKLE',
        'RUCK': 'RUCK',
        'KICK': 'KICK',
        'TRY': 'POINTS',
        'TURNOVER': 'TURNOVER+',
        'DEFENSA': 'DEFENSE',
        'ATAQUE': 'ATTACK'
    }
    
    for instance in root.findall('.//instance'):
        event = {}
        
        # ID
        event['ID'] = event_id
        event['GAME'] = 1
        event['OPPONENT'] = match_info['opponent']
        event['TEAM'] = match_info['team']
        
        # Tiempo
        start_elem = instance.find('start')
        if start_elem is not None:
            start_ms = int(start_elem.text)
            start_sec = start_ms / 1000.0
            event['SECOND'] = start_sec
            event['MINUTE'] = start_sec / 60.0
            
            minutes = int(start_sec // 60)
            seconds = int(start_sec % 60)
            event['TIME'] = f"{minutes:02d}:{seconds:02d}"
        
        # Duración
        end_elem = instance.find('end')
        if end_elem is not None and start_elem is not None:
            end_ms = int(end_elem.text)
            duration_sec = (end_ms - int(start_elem.text)) / 1000.0
            event['DURATION'] = duration_sec
        
        # Categoría del evento
        code_elem = instance.find('code')
        if code_elem is not None:
            group_elem = code_elem.find('.//label/group')
            if group_elem is not None:
                category_raw = group_elem.get('name', '')
                event['CATEGORY'] = category_mapping.get(category_raw, category_raw)
        
        # Jugador
        players_elem = instance.find('players')
        if players_elem is not None:
            player_elem = players_elem.find('player')
            if player_elem is not None:
                event['PLAYER'] = player_elem.get('name', '')
        
        # Etiquetas adicionales (text dentro de label)
        labels = instance.findall('.//label')
        for label in labels:
            text_elem = label.find('text')
            if text_elem is not None:
                label_text = text_elem.text
                group_name = label.find('group').get('name', '') if label.find('group') is not None else ''
                
                # Asignar según el tipo de etiqueta
                if 'RESULTADO' in group_name or 'RESULT' in group_name:
                    if event.get('CATEGORY') == 'SCRUM':
                        event['SCRUM_RESULT'] = label_text
                    elif event.get('CATEGORY') == 'LINEOUT':
                        event['LINE_RESULT'] = label_text
                elif 'TIPO' in group_name or 'TYPE' in group_name:
                    if event.get('CATEGORY') == 'KICK':
                        event['KICK_TYPE'] = label_text
                    elif 'INFRACTION' in event.get('CATEGORY', ''):
                        event['INFRACTION_TYPE'] = label_text
                    elif 'TURNOVER' in event.get('CATEGORY', ''):
                        event['TURNOVER_TYPE'] = label_text
        
        # Determinar períodos (primeros 40min = periodo 1, resto = periodo 2)
        if 'SECOND' in event:
            event['PERIODS'] = 1 if event['SECOND'] < 2400 else 2
        
        events.append(event)
        event_id += 1
    
    # Información del partido
    match_date = datetime.strptime(match_info['date'], '%Y-%m-%d')
    match_data = [{
        'ID_MATCH': 1,
        'DATE': int(match_date.timestamp() * 1000),
        'COMPETITION': match_info['competition'],
        'ROUND': match_info.get('round', 'AMISTOSO'),
        'GAME': 1,
        'TEAM': match_info['team'],
        'OPPONENT': match_info['opponent'],
        'FIELD': match_info.get('field', match_info['team']),
        'RESULT': match_info['result']
    }]
    
    return events, match_data


if __name__ == '__main__':
    # Configuración del partido Pescara vs Avezzano
    match_info = {
        'team': 'PESCARA',
        'opponent': 'AVEZZANO',
        'date': '2025-10-19',
        'competition': 'AMISTOSO PRE-TEMPORADA',
        'result': '0-0',  # Actualizar con resultado real si lo sabes
        'round': 'AMISTOSO',
        'field': 'PESCARA'
    }
    
    xml_path = '/Users/Agustin/wa/videoanalisis/VideoAnalysis/backend/uploads/20251019 Az-Pescara (2) 2.xml'
    
    print("🔄 Convirtiendo XML a JSON...")
    events, match_data = parse_longomatch_to_json(xml_path, match_info)
    
    # Guardar JSONs
    matriz_path = '/Users/Agustin/wa/videoanalisis/VideoAnalysis/backend/uploads/matriz_pescara.json'
    matches_path = '/Users/Agustin/wa/videoanalisis/VideoAnalysis/backend/uploads/matches_pescara.json'
    
    with open(matriz_path, 'w', encoding='utf-8') as f:
        json.dump(events, f, indent=2, ensure_ascii=False)
    
    with open(matches_path, 'w', encoding='utf-8') as f:
        json.dump(match_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Eventos generados: {len(events)}")
    print(f"📁 Archivos creados:")
    print(f"   - {matriz_path}")
    print(f"   - {matches_path}")
    print("\n💡 Próximo paso: Actualizar app.py para usar estos archivos")
