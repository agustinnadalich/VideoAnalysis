
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Configuración de la conexión a PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")

# Crear el motor de base de datos
engine = create_engine(DATABASE_URL)

# Crear una clase base para los modelos
Base = declarative_base()

# Crear una sesión para ejecutar operaciones con la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Función para obtener una sesión (para usar en Flask, scripts, etc.)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
