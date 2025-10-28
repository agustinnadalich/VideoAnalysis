from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Configuración de la conexión a la base de datos
DATABASE_URL = os.getenv("DATABASE_URL")

# Si no está definida, usar SQLite por defecto
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./videoanalysis_demo.db"
    print(f"Using SQLite: {DATABASE_URL}")
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    print(f"Connecting to: {DATABASE_URL[:20]}...")
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
    )

Base = declarative_base()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
