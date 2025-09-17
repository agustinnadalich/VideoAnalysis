#!/usr/bin/env python3

import re

def fix_timestamp_logic():
    # Leer el archivo
    with open('/app/routes/match_events.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Buscar donde está la llamada a enrich_events y agregar la lógica después
    pattern = r'(enriched_events = enrich_events\(events_list, match_id, profile\))\s*return jsonify\(enriched_events\)'
    
    replacement = r'''\1
                # Priorizar clip_start para timestamp_sec si está disponible
                for event_dict in enriched_events:
                    if "clip_start" in event_dict.get("extra_data", {}):
                        event_dict["timestamp_sec"] = event_dict["extra_data"]["clip_start"]
                print("🚨🚨🚨 DEBUG: Ajustados timestamps con clip_start")
                return jsonify(enriched_events)'''
    
    # Aplicar el reemplazo
    new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    # Escribir el archivo corregido
    with open('/app/routes/match_events.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("Archivo corregido exitosamente")

if __name__ == '__main__':
    fix_timestamp_logic()
