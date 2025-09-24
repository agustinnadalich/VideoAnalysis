from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Configuración de la conexión a PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL no está definida. Verifica tu archivo .env o configuración de entorno.")

# Crear el motor de base de datos con configuración de pool
engine = create_engine(
    DATABASE_URL,
    pool_size=10,  # Número máximo de conexiones en el pool
    max_overflow=20,  # Conexiones adicionales permitidas
    pool_timeout=30,  # Tiempo de espera antes de cerrar una conexión
)

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
