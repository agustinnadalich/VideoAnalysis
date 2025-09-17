import re

# Leer el archivo
with open('backend/routes/match_events.py', 'r') as f:
    content = f.read()

# Corregir las líneas problemáticas
content = re.sub(
    r'            if events_list:\s*logging\.warning\("🚨🚨🚨 LOGGING: Aplicando enricher a %d eventos con perfil: %s", len\(events_list\), profi\nle is not None\)\s*print\("🚨🚨🚨 PRINT: Aplicando enricher a", len\(events_list\), "eventos"\)\s*enriched_events = enrich_events\(events_list, match_id, profile\)\nprint\("🚨��🚨 DEBUG: enriched_events sample:", enriched_events\[0\] if enriched_events else "None"\)\s*return jsonify\(enriched_events\)\s*else:\s*return jsonify\(\[\]\)',
    '''            if events_list:
                logging.warning("🚨🚨🚨 LOGGING: Aplicando enricher a %d eventos con perfil: %s", len(events_list), profile is not None)
                print("🚨🚨🚨 PRINT: Aplicando enricher a", len(events_list), "eventos")
                enriched_events = enrich_events(events_list, match_id, profile)
                print("🚨🚨🚨 DEBUG: enriched_events sample:", enriched_events[0] if enriched_events else "None")
                return jsonify(enriched_events)
            else:
                return jsonify([])''',
    content,
    flags=re.MULTILINE | re.DOTALL
)

# Escribir el archivo corregido
with open('backend/routes/match_events.py', 'w') as f:
    f.write(content)

print("Archivo corregido")
