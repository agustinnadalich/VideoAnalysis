import json

with open('TEST-Alumni.json', 'r') as f:
    eventos = json.load(f)

# Tomar solo los primeros 10 eventos
eventos_cortos = eventos[:10]

with open('TEST-Alumni-10eventos.json', 'w') as f:
    json.dump(eventos_cortos, f, indent=2, ensure_ascii=False)

print("Archivo TEST-Alumni-10eventos.json generado con 10 eventos.")