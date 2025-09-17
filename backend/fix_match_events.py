#!/usr/bin/env python3

# Script para arreglar el archivo match_events.py
import re

def fix_match_events():
    # Leer el archivo original
    with open('/app/routes/match_events.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remover las líneas problemáticas de debug mal formateadas
    # Buscar y reemplazar el bloque problemático
    problematic_pattern = r'logging\.warning\("🚨🚨🚨 LOGGING: Aplicando enricher a %d eventos con perfil: %s", len\(events_list\), profi\nle is not None\)\s*print\("🚨🚨🚨 PRINT.*?"🚨��🚨 DEBUG.*?None"\)'
    
    # Patrón más simple - eliminar líneas específicas
    lines = content.split('\n')
    new_lines = []
    skip_next = False
    
    for i, line in enumerate(lines):
        # Si la línea contiene el logging mal formateado
        if 'logging.warning("🚨🚨🚨 LOGGING: Aplicando enricher a %d eventos con perfil: %s", len(events_list), profi' in line:
            # Reemplazar con la versión corregida
            new_lines.append('                logging.warning("🚨🚨🚨 LOGGING: Aplicando enricher a %d eventos con perfil: %s", len(events_list), profile is not None)')
            skip_next = 2  # Saltar las siguientes 2 líneas problemáticas
            continue
        elif skip_next > 0:
            skip_next -= 1
            continue
        elif 'print("🚨��🚨 DEBUG: enriched_events sample:"' in line and line.strip().startswith('print('):
            # Eliminar esta línea de debug mal formateada
            continue
        else:
            new_lines.append(line)
    
    # Escribir el archivo corregido
    with open('/app/routes/match_events.py', 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
    
    print("Archivo corregido exitosamente")

if __name__ == '__main__':
    fix_match_events()
