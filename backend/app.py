from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import os
import pandas as pd
import json
import openai

# Configura tu clave de API de OpenAI
# client = openai.OpenAI(api_key="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")
openai.api_key = "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"
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = '/app/uploads/'
matches_json_path = os.path.join(UPLOAD_FOLDER, 'matches.json')

# Ruta del archivo JSON
matriz_json_path = os.path.join(UPLOAD_FOLDER, 'matrizC2.json')
# matches_json_path = os.path.join(UPLOAD_FOLDER, 'matchesC2.json')

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

@app.route('/matches', methods=['GET'])
def get_matches():
    try:
        # Leer los datos de matches.json
        with open(matches_json_path, 'r') as f:
            matches = json.load(f)
        return jsonify({"matches": matches}), 200
    except FileNotFoundError:
        return jsonify({"error": "Archivo matches.json no encontrado"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/events', methods=['GET'])
def get_events():
    match_id = request.args.get('match_id')  # Obtener el ID del partido desde los parámetros
    print(f"match_id recibido: {match_id}")  # Log para verificar el ID recibido

    if not match_id:
        print("No se proporcionó match_id")
        return jsonify({"error": "No match_id provided"}), 400

    try:
        # Leer los datos de matches.json para obtener el archivo JSON correspondiente
        with open(matches_json_path, 'r') as f:
            matches = json.load(f)
        match = next((m for m in matches if m['ID_MATCH'] == int(match_id)), None)
        if not match:
            return jsonify({"error": "Match not found"}), 404

        # Leer el archivo JSON de eventos correspondiente
        events_json_path = os.path.join(UPLOAD_FOLDER, f"{match['JSON']}.json")
        if not os.path.exists(events_json_path):
            return jsonify({"error": f"Archivo JSON {match['JSON']} no encontrado"}), 404

        with open(events_json_path, 'r') as f:
            events = json.load(f)

        # Procesar los eventos para agregar campos adicionales
        columns_to_include = ['ID', 'OPPONENT', 'SECOND', 'DURATION', 'CATEGORY', 'TEAM', 'COORDINATE_X', 'COORDINATE_Y', 
                              'SECTOR', 'PLAYER', 'SCRUM_RESULT', 'ADVANCE', 'LINE_RESULT', 'LINE_QUANTITY', 'LINE_POSITION', 
                              'LINE_THROWER', 'LINE_RECEIVER', 'LINE_PLAY', 'OPPONENT_JUMPER', 'BREAK_TYPE', 'BREAK_CHANNEL', 
                              'TURNOVER_TYPE', 'INFRACTION_TYPE', 'KICK_TYPE', 'SQUARE', 'RUCK_SPEED', 'POINTS', 
                              'POINTS(VALUE)', 'PERIODS', 'GOAL_KICK', 'TRY_ORIGIN', 'YELLOW-CARD', 'RED-CARD']

        # Convertir los eventos a un DataFrame para procesarlos
        df = pd.DataFrame(events)

        # Asegúrate de que todas las columnas existan en el DataFrame
        for column in columns_to_include:
            if column not in df.columns:
                df[column] = None

        # Calcular tiempos clave del partido
        kick_off_1 = df[(df['CATEGORY'] == 'KICK OFF') & (df['PERIODS'] == 1)]['SECOND'].min()
        fin_1 = df[(df['CATEGORY'] == 'END') & (df['PERIODS'] == 1)]['SECOND'].max()
        kick_off_2 = df[(df['CATEGORY'] == 'KICK OFF') & (df['PERIODS'] == 2)]['SECOND'].min()
        fin_2 = df[(df['CATEGORY'] == 'END') & (df['PERIODS'] == 2)]['SECOND'].max()

        def calcular_tiempo_de_juego(second):
            if second <= fin_1:
                return second - kick_off_1
            elif second >= kick_off_2:
                return (fin_1 - kick_off_1) + (second - kick_off_2)
            return None

        # Definir los grupos de tiempo
        timeGroups = [
            {"label": "0'- 20'", "start": 0, "end": 20 * 60},
            {"label": "20' - 40'", "start": 20 * 60, "end": calcular_tiempo_de_juego(fin_1)},
            {"label": "40' - 60'", "start": calcular_tiempo_de_juego(kick_off_2), "end": calcular_tiempo_de_juego(kick_off_2) + 20 * 60},
            {"label": "60' - 80'", "start": calcular_tiempo_de_juego(kick_off_2) + 20 * 60, "end": calcular_tiempo_de_juego(fin_2)}
        ]

        # Procesar cada evento
        for event in events:
            if 'SECOND' in event and event['SECOND'] is not None:
                minutes, seconds = divmod(int(event['SECOND']), 60)
                event['TIME(VIDEO)'] = f"{minutes:02}:{seconds:02}"
                tiempo_de_juego = calcular_tiempo_de_juego(event['SECOND'])
                if tiempo_de_juego is not None:
                    tiempo_de_juego_minutes, tiempo_de_juego_seconds = divmod(tiempo_de_juego, 60)
                    event['Game_Time'] = f"{int(tiempo_de_juego_minutes):02}:{int(tiempo_de_juego_seconds):02}"
                    for group in timeGroups:
                        if group["start"] <= tiempo_de_juego < group["end"]:
                            event["Time_Group"] = group["label"]
                            break
                else:
                    event['Game_Time'] = None
                    event['Time_Group'] = None

        # Procesar el video (puede ser una URL o un ID de YouTube)
        video_url = match.get('VIDEO', '')
        if video_url and not video_url.startswith('http'):
            # Si no es una URL, asumimos que es un ID de YouTube
            video_url = f"https://www.youtube.com/watch?v={video_url}"

        # Devolver los datos del partido y los eventos
        return jsonify({"header": {**match, "video_url": video_url}, "events": events}), 200
    except Exception as e:
        print(f"Error en get_events: {e}")
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

        # Guarda los JSON en archivos
        with open(os.path.join(UPLOAD_FOLDER, 'SERIE_B_PRATO.json'), 'w') as f:
            f.write(df_json)
        # with open(os.path.join(UPLOAD_FOLDER, 'matchesC2.json'), 'w') as f:
        #     f.write(df_partidos_json)

        return jsonify({"message": "Conversion successful"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analyze_events', methods=['GET'])
def analyze_events():
    try:
        # Cargar el archivo matriz_semplyfied.json
        matriz_semplyfied_path = os.path.join(UPLOAD_FOLDER, 'matrizC2.json')
        if not os.path.exists(matriz_semplyfied_path):
            return jsonify({"error": "Archivo JSON no encontrado"}), 404

        with open(matriz_semplyfied_path, 'r') as f:
            events = json.load(f)

        if not events:
            return jsonify({"error": "No events provided"}), 400

        # Configuración de mensajes para la solicitud a la API
        messages = [
            {
                "role": "system",
                "content": (
                    "Eres un experto en análisis de datos deportivos, especializado en rugby. "
                    "Tu tarea es interpretar datos de eventos de un partido proporcionados en formato JSON, "
                    "identificando patrones, estadísticas y recomendaciones tácticas para mejorar el rendimiento "
                    "del equipo San Benedetto. El reporte debe ser lo más completo posible, dividido por aspectos del juego "
                    "donde se hayan encontrado patrones interesantes. Escribe el reporte de manera clara y fácil de interpretar "
                    "para un entrenador, evitando formatos técnicos como JSON.\n\n"
                    "Si encuentras datos que son difíciles de interpretar o necesitas más información para sacar conclusiones, "
                    "inclúyelos al final del reporte con una explicación de por qué son necesarios y cómo podrían mejorar el análisis "
                    "en futuros partidos.\n\n"
                    "Reporte de Análisis del Partido – San Benedetto vs. Lundax Lions Amaranto\n"
                    "Este reporte se basa en el análisis del JSON de eventos del partido y se han derivado distintos indicadores y métricas que ayudan a interpretar el desarrollo del juego. "
                    "Se han considerado también reglas específicas para interpretar los turnovers, break y penalizaciones, de acuerdo a las siguientes aclaraciones:\n\n"
                    "Equipo: Nuestro equipo es San Benedetto.\n\n"
                    "Turnover+: Indica recuperación de posesión.\n"
                    "Turnover–: Indica pérdida de posesión.\n"
                    "– Por ejemplo, si se inicia un ataque y se produce un “Turnover–”, significa que perdimos la pelota.\n\n"
                    "Defensa y Break:\n"
                    "– Si en defensa se produce un “BREAK”, significa que el rival ha quebrado nuestra línea defensiva.\n"
                    "– Si luego se produce un “Turnover+”, se entiende que hemos recuperado la posesión.\n\n"
                    "Penal:\n"
                    "– Si se registra un evento “PENALTY” con el equipo San Benedetto, indica que hemos cometido una infracción.\n\n"
                    "1. Análisis de Fases y Quiebres\n"
                    "Fase del Quiebre: La fase de un quiebre se calcula contando la cantidad de rucks (eventos “RUCK”) que se han dado desde el inicio de la secuencia ofensiva (o defensiva) hasta que se produce el quiebre (evento “BREAK”).\n"
                    "...\n"  # Incluye el resto del contenido aquí
                )
            },
            {
                "role": "user",
                "content": (
                    "Aquí tienes un conjunto de eventos en formato JSON. Cada evento tiene varias propiedades como "
                    "'ID', 'OPPONENT', 'SECOND', 'CATEGORY', 'TEAM', etc. Por favor, analiza estos eventos y "
                    "genera un reporte detallado dividido por aspectos del juego donde hayas encontrado patrones interesantes. "
                    "escribe apartados para cada aspecto del juego, como 'Defensa', 'Ataque', 'Penalizaciones', etc. "
                    "incluye seccioens especiales para LINEOUT y SCRUM, y cualquier otro aspecto que consideres relevante. "
                    "No incluyas estadistiacas, ya las tengo. Lo que me sirve son patrones y recomendaciones. "
                    "No incluyas el JSON en el reporte, solo el análisis. "
                    "Escribe el reporte de manera clara y fácil de interpretar para un entrenador. Si necesitas más información "
                    "para sacar conclusiones, inclúyelo al final del reporte.\n\n"
                    "JSON:\n{}".format(json.dumps(events, indent=2))
                )
            }
        ]

        # Llamada a la API de OpenAI
        response = openai.ChatCompletion.create(
            model="o3-mini",
            messages=messages
        )

        text = response['choices'][0]['message']['content']
        return jsonify({"analysis2": text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)