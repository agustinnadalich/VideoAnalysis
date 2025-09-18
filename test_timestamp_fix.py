#!/usr/bin/env python3
"""
Script para probar el nuevo cálculo de timestamps usando clip_start
"""

import sys
import os
sys.path.append('backend')

from backend.normalizer import normalize_xml_to_json

# Usar el perfil "Importacion XML" existente
profile = {
    "name": "Importacion XML",
    "manual_period_times": {
        "kick_off_1": 0,
        "end_1": 2400,
        "kick_off_2": 2700,
        "end_2": 5100
    }
}

xml_file = "backend/uploads/250830_CASI_vs_San_Luis_Pre.xml"

if os.path.exists(xml_file):
    print(f"🔍 Procesando archivo XML: {xml_file}")
    result = normalize_xml_to_json(xml_file, profile)
    
    if result and 'events' in result:
        # Buscar el evento TACKLE específico
        for event in result['events']:
            if event['event_type'] == 'TACKLE' and event.get('extra_data', {}).get('clip_start') == 2.24:
                print("\n" + "="*50)
                print("🎯 Evento TACKLE encontrado:")
                print(f"   Event Type: {event['event_type']}")
                print(f"   Timestamp (nuevo): {event['timestamp_sec']} segundos")
                print(f"   Game Time: {event.get('Game_Time', 'N/A')}")
                print(f"   Clip Start: {event.get('extra_data', {}).get('clip_start', 'N/A')}")
                print(f"   Clip End: {event.get('extra_data', {}).get('clip_end', 'N/A')}")
                print("="*50)
                break
        else:
            print("❌ No se encontró el evento TACKLE específico")
            
        print(f"\n✅ Total eventos procesados: {len(result['events'])}")
    else:
        print("❌ Error procesando el archivo XML")
else:
    print(f"❌ Archivo XML no encontrado: {xml_file}")
