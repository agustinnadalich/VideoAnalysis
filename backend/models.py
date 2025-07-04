from sqlalchemy import Column, Integer, String, Date, ForeignKey, Float, Text, JSON
from sqlalchemy.orm import relationship
from db import Base
from sqlalchemy.dialects.postgresql import JSONB


class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)

    teams = relationship("Team", back_populates="club")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    club_id = Column(Integer, ForeignKey("clubs.id"))
    name = Column(String(100))
    category = Column(String(50))
    season = Column(String(20))

    club = relationship("Club", back_populates="teams")
    players = relationship("TeamPlayer", back_populates="team")
    matches = relationship("Match", back_populates="team")


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(100))
    birth_date = Column(Date)
    nationality = Column(String(50))
    preferred_position = Column(String(50))

    team_links = relationship("TeamPlayer", back_populates="player")
    events = relationship("Event", back_populates="player")


class TeamPlayer(Base):
    __tablename__ = "teamplayers"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    shirt_number = Column(Integer)
    active_since = Column(Date)
    active_until = Column(Date)

    team = relationship("Team", back_populates="players")
    player = relationship("Player", back_populates="team_links")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    opponent_name = Column(String(100))
    date = Column(Date)
    location = Column(String(100))
    video_url = Column(Text)
    competition = Column(String(100))
    round = Column(String(50))
    field = Column(String(100))
    rain = Column(String(20))
    muddy = Column(String(20))
    wind_1p = Column(String(20))
    wind_2p = Column(String(20))
    referee = Column(String(100))
    result = Column(String) 

    team = relationship("Team", back_populates="matches")
    events = relationship("Event", back_populates="match")

    def to_dict(self):
        return {
            "id": self.id,
            "team_id": self.team_id,
            "opponent_name": self.opponent_name,
            "date": self.date.isoformat() if self.date else None,
            "location": self.location,
            "competition": self.competition,
            "round": self.round,
            "result": self.result,
            "video_url": self.video_url,
            # ...otros campos simples...
        }


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    event_type = Column(String(50))
    timestamp_sec = Column(Integer)
    x = Column(Float)
    y = Column(Float)
    tag = Column(Text)
    phase = Column(String(50))
    origin = Column(String(50))
    outcome = Column(String(50))
    notes = Column(Text)
    extra_data = Column(JSONB)  # <- esta es la línea clave

    match = relationship("Match", back_populates="events")
    player = relationship("Player", back_populates="events")

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class EventType(Base):
    __tablename__ = "eventtypes"

    id = Column(Integer, primary_key=True)
    code = Column(String(50), unique=True)
    group_name = Column(String(50))
    icon = Column(String(10))
    color = Column(String(20))

    translations = relationship("EventTypeTranslation", back_populates="event_type")


class EventTypeTranslation(Base):
    __tablename__ = "eventtypetranslations"

    id = Column(Integer, primary_key=True)
    event_type_id = Column(Integer, ForeignKey("eventtypes.id"))
    lang_code = Column(String(5))
    label = Column(String(50))
    synonyms = Column(Text)

    event_type = relationship("EventType", back_populates="translations")


class ImportProfile(Base):
    __tablename__ = "import_profiles"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255))
    settings = Column(JSON)  # Contiene: hoja de eventos, columnas clave, etc.
