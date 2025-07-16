#!/usr/bin/env python3
"""
Test simple para verificar el funcionamiento del enricher después de la limpieza.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from enricher import enrich_events

# Datos de prueba básicos
test_events = [
    {
        'event_type': 'KICK OFF',
        'timestamp_sec': 56,
        'extra_data': {'PERIODS': 1}
    },
    {
        'event_type': 'TACKLE',
        'timestamp_sec': 1376,
        'extra_data': {}
    },
    {
        'event_type': 'KICK OFF',
        'timestamp_sec': 2422,
        'extra_data': {'PERIODS': 2}
    },
    {
        'event_type': 'SCRUM',
        'timestamp_sec': 4958,
        'extra_data': {'PERIODS': 2}
    }
]

print("🧪 TEST DE FUNCIONAMIENTO POST-LIMPIEZA")
print("=" * 50)

try:
    enriched = enrich_events(test_events, match_info={}, profile={})
    
    print("✅ Enriquecimiento exitoso")
    print(f"📊 Procesados: {len(enriched)} eventos")
    
    for i, event in enumerate(enriched):
        extra = event.get('extra_data', {})
        print(f"  [{i+1}] {event.get('event_type', 'N/A')}: "
              f"Game_Time={extra.get('Game_Time', 'N/A')}, "
              f"Time_Group={extra.get('Time_Group', 'N/A')}, "
              f"DETECTED_PERIOD={extra.get('DETECTED_PERIOD', 'N/A')}")
    
    # Verificar que los cálculos son correctos
    assert enriched[0]['extra_data']['Game_Time'] == '00:00', "KICK OFF P1 debe ser 00:00"
    assert enriched[2]['extra_data']['DETECTED_PERIOD'] == 2, "KICK OFF P2 debe tener periodo 2"
    assert enriched[3]['extra_data']['DETECTED_PERIOD'] == 2, "SCRUM P2 debe tener periodo 2"
    
    print("\n✅ Todos los tests pasaron - Sistema funcionando correctamente")
    
except Exception as e:
    print(f"❌ Error en test: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
