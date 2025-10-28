import xml.etree.ElementTree as ET
import json
from datetime import datetime

# Parsear XML - ruta dentro del contenedor Docker
tree = ET.parse('/app/uploads/20251019 Az-Pescara (2) 2.xml')
root = tree.getroot()

# Obtener info del partido
match_info = {
    "TEAM": "Pescara",
    "OPPONENT": "Avezzano",
    "GAME": 1
}

matriz = []
id_counter = 1

for instance in root.findall('.//instance'):
    code = instance.find('code')
    if code is None:
        continue
    
    category = code.text
    start = instance.find('start')
    end = instance.find('end')
    
    if start is None or end is None:
        continue
    
    start_ms = int(start.text)
    end_ms = int(end.text)
    duration = (end_ms - start_ms) / 1000.0
    second = start_ms / 1000.0
    minute = second / 60.0
    
    # Formatear TIME como HH:MM:SS
    hours = int(second // 3600)
    minutes = int((second % 3600) // 60)
    secs = int(second % 60)
    time_str = f"{hours:02d}:{minutes:02d}:{secs:02d}"
    
    event = {
        "ID": id_counter,
        "ID_NAC": id_counter,
        "MATCH_ID": id_counter,
        "CATEGORY": category,
        "SECOND": second,
        "MINUTE": minute,
        "TIME": time_str,
        "DURATION": duration,
        "GAME": 1,
        "TEAM": match_info["TEAM"],
        "OPPONENT": match_info["OPPONENT"]
    }
    
    # Agregar players si existen
    players = instance.find('.//label[@group="Jugadores"]')
    if players is not None and players.find('text') is not None:
        event["PLAYER"] = players.find('text').text
    
    # Agregar coordenadas si existen
    for label in instance.findall('.//label'):
        group = label.get('group', '')
        text_elem = label.find('text')
        if text_elem is not None:
            text = text_elem.text
            if group == 'COORDINATE_X':
                try:
                    event["COORDINATE_X"] = float(text)
                except:
                    pass
            elif group == 'COORDINATE_Y':
                try:
                    event["COORDINATE_Y"] = float(text)
                except:
                    pass
    
    matriz.append(event)
    id_counter += 1

# Guardar matriz
with open('/app/uploads/matrizPescara.json', 'w') as f:
    json.dump(matriz, f, indent=2)

# Crear archivo de matches
matches = [{
    "MATCH_ID": 1,
    "TEAM": "Pescara",
    "OPPONENT": "Avezzano", 
    "DATE": "2025-10-19",
    "COMPETITION": "Amistoso Pre-Temporada",
    "VIDEO_URL": "https://videoanalisis.s3.eu-west-3.amazonaws.com/videos/20251019%20Az-Pescara%20%282%29%202.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA4JGH5GCXNXWSOWZ7%2F20251027%2Feu-west-3%2Fs3%2Faws4_request&X-Amz-Date=20251027T113353Z&X-Amz-Expires=7200&X-Amz-SignedHeaders=host&X-Amz-Signature=9f1cc8a0b27a82769ee94e2eed4b2e2a18b3be579f86ff7fc1dcd89a15f4bca0"
}]

with open('/app/uploads/matchesPescara.json', 'w') as f:
    json.dump(matches, f, indent=2)

print(f"✅ Convertidos {len(matriz)} eventos")
print(f"📁 Archivos creados:")
print(f"   - /app/uploads/matrizPescara.json")
print(f"   - /app/uploads/matchesPescara.json")
