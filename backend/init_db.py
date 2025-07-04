# En un archivo como init_db.py o al iniciar app
from models import ImportProfile
from db import SessionLocal

db = SessionLocal()
if not db.query(ImportProfile).filter_by(name="Default").first():
    db.add(ImportProfile(name="Default", description="Perfil por defecto", settings={}))
    db.commit()
db.close()
