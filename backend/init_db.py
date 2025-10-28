#!/usr/bin/env python3
"""
Script para inicializar la base de datos con el schema necesario.
Funciona tanto con SQLite como con PostgreSQL.
"""
import os
import sys

# Asegurarse de que podemos importar desde el directorio backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import engine, Base
from models import (
    Club, Team, Player, TeamPlayer, Match, Event,
    EventType, EventTypeTranslation, ImportProfile
)

def init_database():
    """Crea todas las tablas en la base de datos"""
    print("🔧 Iniciando creación de tablas...")
    print(f"📁 Base de datos: {engine.url}")
    
    try:
        # Crear todas las tablas
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas exitosamente!")
        
        # Listar tablas creadas
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"\n📋 Tablas disponibles ({len(tables)}):")
        for table in tables:
            print(f"   - {table}")
        
        return True
    except Exception as e:
        print(f"❌ Error al crear tablas: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  VideoAnalysis - Inicialización de Base de Datos")
    print("=" * 60)
    
    success = init_database()
    
    if success:
        print("\n✅ Base de datos lista para usar!")
        print("\n💡 Próximos pasos:")
        print("   1. Levantar el backend: docker-compose up backend")
        print("   2. Importar datos via UI o script")
    else:
        print("\n❌ Hubo errores. Verifica la configuración.")
        sys.exit(1)
