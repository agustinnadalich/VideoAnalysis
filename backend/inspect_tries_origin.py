from db import SessionLocal
from models import Event

def inspect(match_id=23):
    db=SessionLocal()
    try:
        events=db.query(Event).filter(Event.match_id==match_id).order_by(Event.id).all()
        for e in events:
            ed = getattr(e, 'extra_data', None)
            if isinstance(ed, dict) and ( 'TRY_ORIGIN' in ed or 'TRY_PHASES' in ed ):
                print(e.id, e.timestamp_sec, ed.get('TRY_ORIGIN'), ed.get('TRY_PHASES'))
    finally:
        db.close()

if __name__=='__main__':
    inspect()
