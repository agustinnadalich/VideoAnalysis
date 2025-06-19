import xml.etree.ElementTree as ET
import json
import re
import math

def seconds_to_hms(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02}:{m:02}:{s:02}"

tree = ET.parse('backend/uploads/20250531 1ra Alumni vs San Luis.xml')
root = tree.getroot()

instances = root.find('ALL_INSTANCES')

id_segundo_tiempo = 424
category_counter = {}
events = []

def safe_num(val, default=0):
    try:
        if val is None:
            return default
        if isinstance(val, float) and math.isnan(val):
            return default
        return int(val)
    except Exception:
        return default

def safe_float(val, default=0.0):
    try:
        if val is None:
            return default
        if isinstance(val, float) and math.isnan(val):
            return default
        return float(val)
    except Exception:
        return default

for inst in instances.findall('instance'):
    code = inst.find('code').text
    start = safe_float(inst.find('start').text)
    end = safe_float(inst.find('end').text)
    duration = safe_float(end - start)
    minute = safe_num(start // 60)
    second = safe_float(start)
    time_str = seconds_to_hms(start)
    id_ = safe_num(inst.find('ID').text)

    period = 1 if id_ < id_segundo_tiempo else 2

    # Lógica para TEAM y CATEGORY/CODE
    team = "San Luis"
    category = code

    # Si es evento rival/contra, cambiar TEAM y limpiar CATEGORY/CODE
    if any(x in code for x in ["CONTRA", "RIVAL"]):
        team = "Alumni"
        category = re.sub(r" (CONTRA|RIVAL)", "", code)
    if "TRY CONTRA" in code:
        team = "Alumni"
        category = "TRY"
    if "PALOS RIVAL" in code:
        team = "Alumni"
        category = "PALOS"

    # Cambios de nombre para posesión
    if code == "SIN POSESION":
        category = "DEFENSA"
    if code == "CON POSESION":
        category = "ATAQUE"

    # Número de orden por categoría (usando la categoría final)
    if category not in category_counter:
        category_counter[category] = 1
    else:
        category_counter[category] += 1
    number = safe_num(category_counter[category])

    event = {
        "CATEGORY": category,
        "CODE": category,
        "MATCH_ID": 3,
        "MINUTE": minute,
        "SECOND": second,
        "DURATION": duration,
        "TIME": time_str,
        "OPPONENT": "Alumni",
        "TEAM": team,
        "GAME": 3,
        "NUMBER": number,
        "PERIODS": safe_num(period)
    }
    events.append(event)

# Lista de claves obligatorias para cada evento
required_keys = ["CATEGORY", "SECOND", "PERIODS", "TEAM", "NUMBER"]

def is_valid_event(event):
    for key in required_keys:
        if key not in event:
            return False
        val = event[key]
        if val is None:
            return False
        if isinstance(val, float) and math.isnan(val):
            return False
    return True

# Filtra eventos válidos (que tengan todos los campos requeridos y valores válidos)
valid_events = [e for e in events if is_valid_event(e)]
invalid_events = [e for e in events if not is_valid_event(e)]

if invalid_events:
    print("Eventos inválidos detectados (no serán guardados):")
    for ev in invalid_events:
        print(ev)

print(f"Total eventos válidos: {len(valid_events)}")
print(f"Total eventos inválidos: {len(invalid_events)}")

with open('events.json', 'w') as f:
    json.dump(valid_events, f, indent=2, ensure_ascii=False)

print("Listo. Archivo events.json generado solo con eventos válidos.")