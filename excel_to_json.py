#!/usr/bin/env python3
"""
Script para convertir Excel real a JSON para debug
"""

import pandas as pd
import json
import sys
from pathlib import Path

def excel_to_json(excel_file):
    """
    Convierte el Excel real a JSON para debugging
    """
    print(f"🔍 Convirtiendo Excel a JSON: {excel_file}")
    print("=" * 50)
    
    try:
        # Leer el Excel
        df = pd.read_excel(excel_file)
        print(f"✅ Excel leído exitosamente: {len(df)} filas, {len(df.columns)} columnas")
        
        # Mostrar columnas disponibles
        print(f"\n📋 Columnas disponibles:")
        for i, col in enumerate(df.columns):
            print(f"  {i+1}. {col}")
        
        # Mostrar primeras 5 filas para inspección
        print(f"\n📋 Primeras 5 filas:")
        print(df.head().to_string())
        
        # Convertir a JSON
        events_data = []
        for index, row in df.iterrows():
            event = {}
            for col in df.columns:
                value = row[col]
                # Convertir NaN a None
                if pd.isna(value):
                    value = None
                # Convertir numpy types a tipos Python básicos
                elif hasattr(value, 'item'):
                    value = value.item()
                # Convertir datetime.time a string
                elif hasattr(value, 'strftime'):
                    value = str(value)
                event[col] = value
            
            # Agregar ID si no existe
            if 'ID' not in event:
                event['ID'] = index + 1
            
            # Agregar timestamp_sec si no existe
            if 'timestamp_sec' not in event and 'SECOND' in event and event['SECOND'] is not None:
                event['timestamp_sec'] = event['SECOND']
            
            events_data.append(event)
        
        print(f"\n✅ Datos convertidos: {len(events_data)} eventos")
        
        # Mostrar eventos con PERIODS para verificar estructura
        print(f"\n📋 Eventos con PERIODS:")
        periods_events = [e for e in events_data if e.get('PERIODS') is not None]
        for event in periods_events[:10]:  # Primeros 10
            print(f"  ID {event.get('ID')}: {event.get('CATEGORY')} PERIODS={event.get('PERIODS')} SECOND={event.get('SECOND')}")
        
        # Mostrar eventos sin PERIODS para verificar estructura
        print(f"\n📋 Eventos sin PERIODS (primeros 10):")
        no_periods_events = [e for e in events_data if e.get('PERIODS') is None]
        for event in no_periods_events[:10]:  # Primeros 10
            print(f"  ID {event.get('ID')}: {event.get('CATEGORY')} SECOND={event.get('SECOND')}")
        
        # Generar JSON para copiar/pegar
        json_output = json.dumps(events_data, indent=2, ensure_ascii=False)
        
        # Guardar en archivo
        json_file = excel_file.replace('.xlsx', '_converted.json').replace('.XLSX', '_converted.json')
        with open(json_file, 'w', encoding='utf-8') as f:
            f.write(json_output)
        
        print(f"\n✅ JSON guardado en: {json_file}")
        
        # Mostrar código Python listo para usar
        print(f"\n🐍 CÓDIGO PYTHON LISTO PARA USAR:")
        print("=" * 50)
        print("events_data = [")
        
        # Mostrar solo los primeros 20 eventos para no saturar la salida
        for i, event in enumerate(events_data[:20]):
            print(f"    {json.dumps(event, ensure_ascii=False)},")
        
        if len(events_data) > 20:
            print(f"    # ... {len(events_data) - 20} eventos más ...")
        
        print("]")
        print("=" * 50)
        
        # Estadísticas finales
        print(f"\n📊 ESTADÍSTICAS:")
        print(f"  Total eventos: {len(events_data)}")
        print(f"  Eventos con PERIODS: {len(periods_events)}")
        print(f"  Eventos sin PERIODS: {len(no_periods_events)}")
        
        # Mostrar categorías únicas
        categories = set(e.get('CATEGORY') for e in events_data if e.get('CATEGORY'))
        print(f"  Categorías únicas: {', '.join(sorted(categories))}")
        
        # Mostrar períodos únicos
        periods = set(e.get('PERIODS') for e in events_data if e.get('PERIODS') is not None)
        print(f"  Períodos únicos: {sorted(periods)}")
        
        return events_data
        
    except Exception as e:
        print(f"❌ Error procesando Excel: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    # Buscar archivo Excel automáticamente
    excel_files = [
        "Matriz_San_Benedetto_24-25_ENG_TEST_KICKOFF.XLSX",
        "Matriz_San_Benedetto_24-25_ENG_TEST_KICKOFF.xlsx",
        "test_file.xlsx"
    ]
    
    excel_file = None
    for filename in excel_files:
        if Path(filename).exists():
            excel_file = filename
            break
    
    if excel_file:
        print(f"📁 Archivo encontrado: {excel_file}")
        excel_to_json(excel_file)
    else:
        print("❌ No se encontró archivo Excel")
        print("📁 Archivos buscados:")
        for filename in excel_files:
            print(f"  - {filename}")
        print("\n💡 Para usar manualmente:")
        print("  python3 excel_to_json.py")
        print("  Y luego coloque el archivo Excel en el directorio actual")
