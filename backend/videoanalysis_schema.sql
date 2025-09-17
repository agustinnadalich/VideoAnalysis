
-- Tabla de clubes
CREATE TABLE Clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Tabla de equipos por club
CREATE TABLE Teams (
    id SERIAL PRIMARY KEY,
    club_id INTEGER REFERENCES Clubs(id),
    name VARCHAR(100),
    category VARCHAR(50),
    season VARCHAR(20)
);

-- Jugadores globales
CREATE TABLE Players (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100),
    birth_date DATE,
    nationality VARCHAR(50),
    preferred_position VARCHAR(50)
);

-- Asociación de jugadores a equipos y temporadas
CREATE TABLE TeamPlayers (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES Teams(id),
    player_id INTEGER REFERENCES Players(id),
    shirt_number INTEGER,
    active_since DATE,
    active_until DATE
);

-- Partidos
CREATE TABLE Matches (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES Teams(id),
    opponent_name VARCHAR(100),
    date DATE,
    location VARCHAR(100),
    video_url TEXT
);

-- Eventos
CREATE TABLE Events (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES Matches(id),
    player_id INTEGER REFERENCES Players(id),
    event_type VARCHAR(50),
    timestamp_sec FLOAT,
    x FLOAT,
    y FLOAT,
    tag TEXT,
    phase VARCHAR(50),
    origin VARCHAR(50),
    outcome VARCHAR(50),
    notes TEXT
);

-- Datos físicos
CREATE TABLE PhysicalStats (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES Players(id),
    match_id INTEGER REFERENCES Matches(id),
    distance_m FLOAT,
    sprints INTEGER,
    impacts INTEGER,
    max_speed_kmh FLOAT,
    acceleration FLOAT
);

-- Tipos de usuarios
CREATE TABLE UserRoles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

-- Usuarios
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password_hash TEXT,
    role_id INTEGER REFERENCES UserRoles(id),
    club_id INTEGER REFERENCES Clubs(id)
);

-- Accesos por usuario
CREATE TABLE UserAccess (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id),
    team_id INTEGER REFERENCES Teams(id),
    match_id INTEGER REFERENCES Matches(id)
);

-- Tipos de eventos base
CREATE TABLE EventTypes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    group_name VARCHAR(50),
    icon VARCHAR(10),
    color VARCHAR(20)
);

-- Traducciones y equivalencias multilingua
CREATE TABLE EventTypeTranslations (
    id SERIAL PRIMARY KEY,
    event_type_id INTEGER REFERENCES EventTypes(id),
    lang_code VARCHAR(5),
    label VARCHAR(50),
    synonyms TEXT
);
