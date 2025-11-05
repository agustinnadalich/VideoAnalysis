"""
Script de inicialización para cargar mapeos de categorías por defecto.

Ejecutar después de crear las tablas con init_db.py
"""

from db import SessionLocal
from translator import init_default_mappings
from models import CategoryMapping


def init_category_mappings():
    """Inicializa los mapeos de categorías en la base de datos"""
    db = SessionLocal()
    
    try:
        # Verificar si ya hay mapeos
        existing_count = db.query(CategoryMapping).count()
        
        if existing_count > 0:
            print(f"⚠️  Ya existen {existing_count} mapeos en la base de datos")
            response = input("¿Deseas recargar los mapeos por defecto? (s/n): ")
            
            if response.lower() != 's':
                print("❌ Operación cancelada")
                return
            
            # Eliminar mapeos existentes
            db.query(CategoryMapping).delete()
            db.commit()
            print(f"🗑️  Eliminados {existing_count} mapeos existentes")
        
        # Cargar mapeos por defecto
        print("📥 Cargando mapeos por defecto...")
        count = init_default_mappings(db)
        
        print(f"✅ Se agregaron {count} mapeos de categorías")
        
        # Mostrar resumen
        print("\n📊 Resumen de mapeos por tipo:")
        
        event_types = db.query(CategoryMapping).filter_by(
            mapping_type='event_type'
        ).count()
        descriptors = db.query(CategoryMapping).filter_by(
            mapping_type='descriptor'
        ).count()
        
        print(f"  - Tipos de evento: {event_types}")
        print(f"  - Descriptores: {descriptors}")
        
        # Mostrar algunos ejemplos
        print("\n📝 Ejemplos de mapeos creados:")
        
        examples = db.query(CategoryMapping).limit(10).all()
        for ex in examples:
            print(f"  - {ex.source_term} ({ex.language}) → {ex.target_category}")
        
        print("\n✨ Inicialización completada con éxito!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error durante la inicialización: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_category_mappings()
