from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import os
import pandas as pd
import json

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Asegúrate de que el directorio de uploads exista
UPLOAD_FOLDER = '/app/uploads/'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Ruta del archivo JSON
# matriz_json_path = os.path.join(UPLOAD_FOLDER, 'SERIE_B_PRATO.json')
# matches_json_path = os.path.join(UPLOAD_FOLDER, 'match-PRATO.json')

# Ruta del archivo JSON - PESCARA vs AVEZZANO
matriz_json_path = os.path.join(UPLOAD_FOLDER, 'matrizPescara.json')
matches_json_path = os.path.join(UPLOAD_FOLDER, 'matchesPescara.json')

# Lee los datos desde los archivos JSON
try:
    with open(matriz_json_path, 'r') as f:
        df = pd.DataFrame(json.load(f))
    with open(matches_json_path, 'r') as f:
        df_partidos = pd.DataFrame(json.load(f))
except FileNotFoundError:
    print(f"Archivo no encontrado: {matriz_json_path} o {matches_json_path}")
    df = pd.DataFrame()
    df_partidos = pd.DataFrame()
except Exception as e:
    print(f"Error al leer el archivo: {e}")
    df = pd.DataFrame()
    df_partidos = pd.DataFrame()

# Función para calcular el origen de los tries
def calcular_origen_tries(df):
    if 'POINTS' not in df.columns:
        raise KeyError("La columna 'POINTS' no existe en el DataFrame")

    origin_categories = ["TURNOVER+", "SCRUM", "LINEOUT", "KICKOFF"]
    tries_events = df[df['POINTS'] == "TRY"]

    def get_origin_event(try_event):
        try_time = try_event['SECOND']
        relevant_events = df[(df['CATEGORY'].isin(origin_categories)) & (df['SECOND'] < try_time)]
        return relevant_events.iloc[-1]['CATEGORY'] if not relevant_events.empty else None

    df['TRY_ORIGIN'] = df.apply(lambda event: get_origin_event(event) if event['POINTS'] == "TRY" else None, axis=1)
    return df

# Verifica si la columna 'POINTS' existe antes de llamar a la función
if 'POINTS' in df.columns:
    df = calcular_origen_tries(df)
else:
    print("La columna 'POINTS' no existe en el DataFrame")

print(df.head())

@app.route('/events', methods=['GET'])
def get_events():
    if not os.path.exists(matriz_json_path):
        return jsonify({"error": "Archivo JSON no encontrado"}), 404

    try:
        with open(matriz_json_path, 'r') as f:
            df = pd.DataFrame(json.load(f))
        # Comentado temporalmente para demo rápido
        # df = calcular_origen_tries(df)

        if df.empty:
            return jsonify({"error": "No data available"}), 404

        columns_to_include = ['ID', 'OPPONENT', 'SECOND', 'DURATION', 'CATEGORY', 'TEAM', 'COORDINATE_X', 'COORDINATE_Y', 'SECTOR', 'PLAYER', 'SCRUM_RESULT', 'ADVANCE', 'LINE_RESULT', 'LINE_QUANTITY', 'LINE_POSITION', 'LINE_THROWER', 'LINE_RECEIVER', 'LINE_PLAY', 'OPPONENT_JUMPER', 'BREAK_TYPE', 'BREAK_CHANNEL', 'TURNOVER_TYPE', 'INFRACTION_TYPE', 'KICK_TYPE', 'SQUARE', 'RUCK_SPEED', 'POINTS', 'POINTS(VALUE)', 'PERIODS', 'GOAL_KICK', 'TRY_ORIGIN', 'YELLOW-CARD', 'RED-CARD']

        # Asegúrate de que todas las columnas existan en el DataFrame
        for column in columns_to_include:
            if column not in df.columns:
                df[column] = None

        filtered_df = df[columns_to_include]

        kick_off_1 = filtered_df[(filtered_df['CATEGORY'] == 'KICK OFF') & (filtered_df['PERIODS'] == 1)]['SECOND'].min()
        fin_1 = filtered_df[(filtered_df['CATEGORY'] == 'END') & (filtered_df['PERIODS'] == 1)]['SECOND'].max()
        kick_off_2 = filtered_df[(filtered_df['CATEGORY'] == 'KICK OFF') & (filtered_df['PERIODS'] == 2)]['SECOND'].min()
        fin_2 = filtered_df[(filtered_df['CATEGORY'] == 'END') & (filtered_df['PERIODS'] == 2)]['SECOND'].max()

        def calcular_tiempo_de_juego(second):
            if kick_off_1 is None or fin_1 is None or kick_off_2 is None or fin_2 is None:
                print(f"Valores inválidos detectados: kick_off_1={kick_off_1}, fin_1={fin_1}, kick_off_2={kick_off_2}, fin_2={fin_2}")
                return None

            if second is None:
                print("El valor de 'second' es None")
                return None

            if second <= fin_1:
                return second - kick_off_1
            elif second >= kick_off_2:
                return (fin_1 - kick_off_1) + (second - kick_off_2)
            return None

        if None in [kick_off_1, fin_1, kick_off_2, fin_2]:
            print(f"Valores inválidos para timeGroups: kick_off_1={kick_off_1}, fin_1={fin_1}, kick_off_2={kick_off_2}, fin_2={fin_2}")
            return jsonify({"error": "Datos incompletos para calcular grupos de tiempo"}), 500

        timeGroups = [
            { "label": "0'- 20'", "start": 0, "end": 20 * 60 },
            { "label": "20' - 40'", "start": 20 * 60, "end": calcular_tiempo_de_juego(fin_1) or 0 },
            { "label": "40' - 60'", "start": calcular_tiempo_de_juego(kick_off_2) or 0, "end": (calcular_tiempo_de_juego(kick_off_2) or 0) + 20 * 60 },
            { "label": "60' - 80'", "start": (calcular_tiempo_de_juego(kick_off_2) or 0) + 20 * 60, "end": calcular_tiempo_de_juego(fin_2) or 0 }
        ]

        events = filtered_df.to_dict(orient='records')
        for event in events:
            if 'SECOND' in event and event['SECOND'] is not None:
                print(f"Procesando evento: {event}")
                minutes, seconds = divmod(int(event['SECOND']), 60)
                event['TIME(VIDEO)'] = f"{minutes:02}:{seconds:02}"
                tiempo_de_juego = calcular_tiempo_de_juego(event['SECOND'])
                if tiempo_de_juego is not None:
                    tiempo_de_juego_minutes, tiempo_de_juego_seconds = divmod(tiempo_de_juego, 60)
                    event['Game_Time'] = f"{int(tiempo_de_juego_minutes):02}:{int(tiempo_de_juego_seconds):02}"
                    for group in timeGroups:
                        if group["start"] is None or group["end"] is None:
                            print(f"Grupo de tiempo inválido: {group}")
                            continue  # Salta este grupo si es inválido

                        if tiempo_de_juego is not None and group["start"] <= tiempo_de_juego < group["end"]:
                            event["Time_Group"] = group["label"]
                            break
                else:
                    print(f"Tiempo de juego no calculado para el evento: {event}")
                    event['Game_Time'] = None
                    event['Time_Group'] = None

        for event in events:
            for key, value in event.items():
                if value != value:
                    event[key] = None
                elif isinstance(value, pd.Timestamp):
                    event[key] = value.isoformat()
                elif isinstance(value, pd.Timedelta):
                    event[key] = str(value)
                elif isinstance(value, (pd._libs.tslibs.nattype.NaTType, type(pd.NaT))):
                    event[key] = None

        with open(matches_json_path, 'r') as f:
            df_partidos = pd.DataFrame(json.load(f))
        partido_info = df_partidos.to_dict(orient='records')[0]

        print(events)
        return jsonify({"header": partido_info, "events": events})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/pescara', methods=['GET'])
def pescara_events():
    """Endpoint específico para el partido Pescara vs Avezzano"""
    try:
        # Rutas para archivos de Pescara
        pescara_matriz_path = os.path.join(UPLOAD_FOLDER, 'matrizPescara.json')
        pescara_matches_path = os.path.join(UPLOAD_FOLDER, 'matchesPescara.json')
        
        # Verificar que existan los archivos
        if not os.path.exists(pescara_matriz_path) or not os.path.exists(pescara_matches_path):
            return jsonify({"error": "Archivos de Pescara no encontrados"}), 404
        
        # Leer datos
        with open(pescara_matriz_path, 'r') as f:
            df_pescara = pd.DataFrame(json.load(f))
        
        with open(pescara_matches_path, 'r') as f:
            df_partidos_pescara = pd.DataFrame(json.load(f))
        
        # Calcular Game_Time (igual que en /events)
        events = df_pescara.to_dict(orient='records')
        
        # Obtener eventos KICK OFF y END por periodo
        kick_off_1 = df_pescara[(df_pescara['CATEGORY'] == 'KICK OFF') & (df_pescara['PERIODS'] == 1)]
        fin_1 = df_pescara[(df_pescara['CATEGORY'] == 'END') & (df_pescara['PERIODS'] == 1)]
        kick_off_2 = df_pescara[(df_pescara['CATEGORY'] == 'KICK OFF') & (df_pescara['PERIODS'] == 2)]
        fin_2 = df_pescara[(df_pescara['CATEGORY'] == 'END') & (df_pescara['PERIODS'] == 2)]

        start_1 = kick_off_1['SECOND'].min() if not kick_off_1.empty else 0
        end_1 = fin_1['SECOND'].max() if not fin_1.empty else df_pescara[df_pescara['PERIODS'] == 1]['SECOND'].max()
        start_2 = kick_off_2['SECOND'].min() if not kick_off_2.empty else 0
        end_2 = fin_2['SECOND'].max() if not fin_2.empty else df_pescara[df_pescara['PERIODS'] == 2]['SECOND'].max()

        # Calcular Game_Time para cada evento
        for event in events:
            period = event.get('PERIODS')
            second = event.get('SECOND', 0)
            
            if period == 1:
                tiempo_de_juego = (second - start_1) if start_1 else None
            elif period == 2:
                tiempo_de_juego = (end_1 - start_1) + (second - start_2) if start_2 else None
            else:
                tiempo_de_juego = None

            if tiempo_de_juego is not None and tiempo_de_juego >= 0:
                minutos = int(tiempo_de_juego // 60)
                segundos = int(tiempo_de_juego % 60)
                event['Game_Time'] = f"{minutos:02d}:{segundos:02d}"
                
                # Asignar Time_Group
                time_groups = [
                    {"label": "0'- 20'", "start": 0, "end": 1200},
                    {"label": "20' - 40'", "start": 1200, "end": 2400},
                    {"label": "40' - 60'", "start": 2400, "end": 3600},
                    {"label": "60' - 80'", "start": 3600, "end": 4800}
                ]
                for group in time_groups:
                    if group["start"] <= tiempo_de_juego < group["end"]:
                        event["Time_Group"] = group["label"]
                        break
            else:
                event['Game_Time'] = None
                event['Time_Group'] = None

        # Limpiar valores NaN
        for event in events:
            for key, value in event.items():
                if value != value:  # NaN check
                    event[key] = None

        partido_info = df_partidos_pescara.to_dict(orient='records')[0]
        
        return jsonify({"header": partido_info, "events": events})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/events/table', methods=['GET'])
def events_table():
    if df.empty:
        return "<h1>No data available</h1>", 404
    
    # Obtiene los parámetros de filtro de la solicitud
    category = request.args.get('category')
    player = request.args.get('player')
    
    filtered_df = df
    
    if category:
        filtered_df = filtered_df[filtered_df['CATEGORY'] == category]
    if player:
        filtered_df = filtered_df[filtered_df['PLAYER'] == player]
    
    # Convierte el DataFrame filtrado a una tabla HTML
    table_html = filtered_df.to_html(classes='table table-striped', index=False)
    
    # Renderiza la tabla HTML en una página simple con un formulario de filtro
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Events Table</title>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    </head>
    <body>
        <div class="container">
            <h1 class="mt-5">Events Table</h1>
            <form method="get" action="/events/table" class="mb-3">
                <div class="form-row">
                    <div class="col">
                        <input type="text" name="category" class="form-control" placeholder="Category" value="{category or ''}">
                    </div>
                    <div class="col">
                        <input type="text" name="player" class="form-control" placeholder="Player" value="{player or ''}">
                    </div>
                    <div class="col">
                        <button type="submit" class="btn btn-primary">Filter</button>
                    </div>
                </div>
            </form>
            {table_html}
        </div>
    </body>
    </html>
    """
    return render_template_string(html)

@app.route('/convert_excel_to_json', methods=['GET'])
def convert_excel_to_json():
    # Aqui debajo se debe colocar el nombre del archivo Excel que se debe ubicar en backend/uploads 
    # y luego entrar a la ruta http://localhost:5001/convert_excel_to_json para que se creen los archivos JSON
    file_path = os.path.join(UPLOAD_FOLDER, 'Matriz_San_Benedetto_24-25_(ENG).xlsx')
    if not os.path.exists(file_path):
        return jsonify({"error": "Archivo Excel no encontrado"}), 404

    try:
        df = pd.read_excel(file_path, sheet_name='MATRIZ')
        df_partidos = pd.read_excel(file_path, sheet_name='MATCHES')

        # Convierte los DataFrames a JSON
        df_json = df.to_json(orient='records')
        df_partidos_json = df_partidos.to_json(orient='records')

        # Guarda los JSON en archivos
        with open(os.path.join(UPLOAD_FOLDER, 'matriz.json'), 'w') as f:
            f.write(df_json)
        with open(os.path.join(UPLOAD_FOLDER, 'matches.json'), 'w') as f:
            f.write(df_partidos_json)

        return jsonify({"message": "Conversion successful"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
@app.route('/convert_excel_to_json_2', methods=['GET'])
def convert_excel_to_json_2():
    file_path = os.path.join(UPLOAD_FOLDER, 'SERIE_B_PRATO_match_2.xlsx')
    if not os.path.exists(file_path):
        return jsonify({"error": "Archivo Excel no encontrado"}), 404

    try:
        df = pd.read_excel(file_path, sheet_name='MATRIZ')
        df_partidos = pd.read_excel(file_path, sheet_name='MATCHES')

                # Procesa los eventos PENALTY
        def process_penalty_events(row):
            if row['CATEGORY'] == 'PENALTY':
                advance = str(row.get('ADVANCE', '')).strip()
                if row['TEAM'] == 'OPPONENT':
                    player = "Player OPPONENT"
                else:
                    player = str(row.get('PLAYER', '')).strip()

                if advance == 'NEUTRAL':
                    row['YELLOW-CARD'] = player
                elif advance == 'NEGATIVE':
                    row['RED-CARD'] = player
                else:
                    row['YELLOW-CARD'] = None
                    row['RED-CARD'] = None
            else:
                # Asegúrate de que YELLOW-CARD y RED-CARD no existan en otras categorías
                row['YELLOW-CARD'] = None
                row['RED-CARD'] = None
            return row

        # Procesa los eventos LINEOUT
        def process_lineout_events(row):
            if row['CATEGORY'] == 'LINEOUT':
                player = str(row.get('PLAYER', '')).strip()
                player_2 = str(row.get('PLAYER_2', '')).strip()

                # Determina el LINE_THROWER y LINE_RECEIVER
                if player.startswith('T-'):
                    thrower = player[2:]  # Elimina el prefijo "T-"
                    receiver = player_2
                elif player_2.startswith('T-'):
                    thrower = player_2[2:]  # Elimina el prefijo "T-"
                    receiver = player
                else:
                    thrower = None
                    receiver = None

                # Asigna los valores al evento
                row['LINE_THROWER'] = thrower
                row['LINE_RECEIVER'] = receiver

                # Coloca ambos jugadores en un array en PLAYER
                players = [thrower, receiver]
                players = [p for p in players if p and p.lower() != 'nan']  # Filtra valores no válidos
                row['PLAYER'] = players if players else None  # Asigna None si está vacío

                # Depuración
                print(f"Processed LINEOUT event: PLAYER={row['PLAYER']}, LINE_THROWER={row['LINE_THROWER']}, LINE_RECEIVER={row['LINE_RECEIVER']}")
            else:
                # Asegúrate de que LINE_THROWER y LINE_RECEIVER no existan en otras categorías
                row['LINE_THROWER'] = None
                row['LINE_RECEIVER'] = None
            return row

            # Procesa los eventos TACKLE
        def process_tackle_events(row):
            if row['CATEGORY'] == 'TACKLE':
                player = str(row.get('PLAYER', '')).strip() if row.get('PLAYER') else None
                player_2 = str(row.get('PLAYER_2', '')).strip() if row.get('PLAYER_2') else None

                # Filtra valores no válidos como None o 'nan'
                players = [p for p in [player, player_2] if p and p.lower() != 'nan']

                # Si hay un solo jugador, lo dejamos como un string; si no, como lista
                row['PLAYER'] = players[0] if len(players) == 1 else (players if players else None)
                row['Team_Tackle_Count'] = 1
            return row

        # Calcula el ORIGIN, END y fases para ATTACK y DEFENCE
        def calculate_attack_defence(row, df):
            if row['CATEGORY'] in ['ATTACK', 'DEFENCE']:
                origin_events = ['KICK-OFF', 'TURNOVER+', 'SCRUM', 'LINEOUT', 'PENALTY', 'FREE-KICK']
                relevant_origin = df[(df['CATEGORY'].isin(origin_events)) & (df['SECOND'] < row['SECOND'])]
                origin = relevant_origin.iloc[-1] if not relevant_origin.empty else None

                end_events = ['PENALTY', 'TURNOVER-', 'POINTS']
                relevant_end = df[(df['CATEGORY'].isin(end_events)) & (df['SECOND'] > row['SECOND'])]
                end = relevant_end.iloc[0] if not relevant_end.empty else None

                ruck_events = df[(df['CATEGORY'] == 'RUCK') & (df['SECOND'] >= (origin['SECOND'] if origin is not None else 0)) & (df['SECOND'] <= (end['SECOND'] if end is not None else row['SECOND']))]
                phases = len(ruck_events) + 1 if not ruck_events.empty else 1

                row['ORIGIN'] = origin['CATEGORY'] if origin is not None else None
                row['END'] = end['CATEGORY'] if end is not None else None
                row['PHASES'] = phases
            return row
        



        # Limpia las filas eliminando claves con valores null, NaN, arrays vacíos o 'Undefined'
        def clean_row(row):
            return {
                k: v for k, v in row.items()
                if v is not None and v != 'undefined' and (not isinstance(v, list) or len(v) > 0) and (not (isinstance(v, float) and pd.isna(v)))
            }

        # Inicializa las columnas LINE_THROWER y LINE_RECEIVER en el DataFrame
        df['LINE_THROWER'] = None
        df['LINE_RECEIVER'] = None
        df['YELLOW-CARD'] = None
        df['RED-CARD'] = None

        # Aplica las transformaciones a los eventos
        df = df.apply(process_lineout_events, axis=1)
        df = df.apply(process_tackle_events, axis=1)
        df = df.apply(process_penalty_events, axis=1)  # Aplica la nueva función
        df = df.apply(lambda row: calculate_attack_defence(row, df), axis=1)

        # Aplica la limpieza
        df_json = df.apply(lambda row: clean_row(row.to_dict()), axis=1).to_json(orient='records')
        df_partidos_json = df_partidos.apply(lambda row: clean_row(row.to_dict()), axis=1).to_json(orient='records')

        # Guarda los JSON en archivos (ESTO SE HACE si no se comnenta la parte de arriba que hace la limpieza)
        # # Convert DataFrames to JSON format
        # df_json = df.to_json(orient='records')
        # df_partidos_json = df_partidos.to_json(orient='records')

        # Write JSON data to files
        with open(os.path.join(UPLOAD_FOLDER, 'SERIE_B_PRATO.json'), 'w') as f:
            f.write(df_json)
        with open(os.path.join(UPLOAD_FOLDER, 'match-PRATO.json'), 'w') as f:
            f.write(df_partidos_json)

        return jsonify({"message": "Conversion successful"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)