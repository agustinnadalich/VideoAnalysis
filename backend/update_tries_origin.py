#!/usr/bin/env python3
"""
Script temporal para recalcular origen de tries en match existente
"""
import sys
sys.path.append('/app')

from db import SessionLocal
from models import Match, Event
from enricher import calculate_try_origin_and_phases
import json

def update_match_tries_origin(match_id):
    db = SessionLocal()
    try:
        # Obtener eventos del match
        events = db.query(Event).filter(Event.match_id == match_id).all()
        
        # Convertir a formato que espera el enricher
        events_data = []
        for event in events:
            event_dict = {
                "event_type": event.event_type,
                "timestamp_sec": event.timestamp_sec,
                "team": event.extra_data.get("EQUIPO") if event.extra_data else None,
                "extra_data": event.extra_data.copy() if event.extra_data else {}
            }
            events_data.append((event_dict, event))  # (data, db_object)
        
        print(f"Procesando {len(events_data)} eventos...")
        
        # Calcular origen usando enricher
        enriched_data = calculate_try_origin_and_phases([ed[0] for ed in events_data])
        
        # Actualizar eventos en base de datos
        updates_count = 0
        from sqlalchemy.orm.attributes import flag_modified

        for i, (enriched_event, db_event) in enumerate(zip(enriched_data, [ed[1] for ed in events_data])):
            try:
                if 'TRY_ORIGIN' in enriched_event.get('extra_data', {}):
                    # Asegurar que extra_data es dict y reasignarlo para que SQLAlchemy detecte cambios
                    new_extra = dict(db_event.extra_data or {})
                    new_extra['TRY_ORIGIN'] = enriched_event['extra_data']['TRY_ORIGIN']
                    new_extra['TRY_PHASES'] = enriched_event['extra_data']['TRY_PHASES']
                    db_event.extra_data = new_extra
                    # Marcar como modificado para JSONB
                    flag_modified(db_event, 'extra_data')
                    updates_count += 1
            except Exception as inner_e:
                print(f"WARN: no se pudo actualizar evento id={getattr(db_event, 'id', '??')}: {inner_e}")
        
        # Guardar cambios
        db.commit()
        print(f"✅ Actualizados {updates_count} eventos con TRY_ORIGIN")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_match_tries_origin(23)