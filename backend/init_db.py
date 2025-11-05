"""
Script para inicializar la base de datos.
Crea todas las tablas definidas en models.py usando SQLAlchemy.
"""

from db import engine, Base, SessionLocal
from models import Club, Team, Player, TeamPlayer, Match, Event, ImportProfile, CategoryMapping

def init_database():
    """Crea todas las tablas en la base de datos"""
    print("🔧 Inicializando base de datos...")
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas correctamente")
    
    # Verificar tablas creadas
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"📊 Tablas en la base de datos: {', '.join(tables)}")
    
    # Crear perfil por defecto si no existe
    db = SessionLocal()
    try:
        if not db.query(ImportProfile).filter_by(name="Default").first():
            default_profile = ImportProfile(
                name="Default",
                description="Perfil por defecto",
                settings={}
            )
            db.add(default_profile)
            db.commit()
            print("✅ Perfil por defecto creado")
        else:
            print("ℹ️  Perfil por defecto ya existe")
    finally:
        db.close()
    
    print("🎉 Base de datos inicializada correctamente")

if __name__ == "__main__":
    init_database()
