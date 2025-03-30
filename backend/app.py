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
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://videoanalysis-front.onrender.com"]}})  # Permitir solicitudes desde localhost:3000 y videoanalysis-front.onrender.com

# Asegúrate de que el directorio de uploads exista
UPLOAD_FOLDER = '/app/uploads/'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Ruta del archivo JSON
matriz_json_path = os.path.join(UPLOAD_FOLDER, 'matriz.json')
matches_json_path = os.path.join(UPLOAD_FOLDER, 'matches.json')

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
        df = calcular_origen_tries(df)

        if df.empty:
            return jsonify({"error": "No data available"}), 404

        columns_to_include = ['ID', 'OPPONENT', 'SECOND', 'DURATION', 'CATEGORY', 'TEAM', 'COORDINATE_X', 'COORDINATE_Y', 'SECTOR', 'PLAYER', 'SCRUM_RESULT', 'ADVANCE', 'LINE_RESULT', 'LINE_QUANTITY', 'LINE_POSITION', 'LINE_THROWER', 'LINE_PLAY', 'OPPONENT_JUMPER', 'BREAK_TYPE', 'BREAK_CHANNEL', 'TURNOVER_TYPE', 'INFRACTION_TYPE', 'KICK_TYPE', 'SQUARE', 'RUCK_SPEED', 'POINTS', 'POINTS(VALUE)', 'PERIODS', 'GOAL_KICK', 'TRY_ORIGIN']

        filtered_df = df[columns_to_include]

        kick_off_1 = filtered_df[(filtered_df['CATEGORY'] == 'KICK OFF') & (filtered_df['PERIODS'] == 1)]['SECOND'].min()
        fin_1 = filtered_df[(filtered_df['CATEGORY'] == 'END') & (filtered_df['PERIODS'] == 1)]['SECOND'].max()
        kick_off_2 = filtered_df[(filtered_df['CATEGORY'] == 'KICK OFF') & (filtered_df['PERIODS'] == 2)]['SECOND'].min()
        fin_2 = filtered_df[(filtered_df['CATEGORY'] == 'END') & (filtered_df['PERIODS'] == 2)]['SECOND'].max()

        def calcular_tiempo_de_juego(second):
            if second <= fin_1:
                return second - kick_off_1
            elif second >= kick_off_2:
                return (fin_1 - kick_off_1) + (second - kick_off_2)
            return None

        timeGroups = [
            { "label": "0'- 20'", "start": 0, "end": 20 * 60 },
            { "label": "20' - 40'", "start": 20 * 60, "end": calcular_tiempo_de_juego(fin_1) },
            { "label": "40' - 60'", "start": calcular_tiempo_de_juego(kick_off_2), "end": calcular_tiempo_de_juego(kick_off_2) + 20 * 60 },
            { "label": "60' - 80'", "start": calcular_tiempo_de_juego(kick_off_2) + 20 * 60, "end": calcular_tiempo_de_juego(fin_2) }
        ]
        print(timeGroups)

        events = filtered_df.to_dict(orient='records')
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

@app.route('/analyze_events', methods=['GET'])
def analyze_events():
    try:
        # Cargar el archivo matriz_semplyfied.json
        matriz_semplyfied_path = os.path.join(UPLOAD_FOLDER, 'matriz_semplyfied.json')
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
        return jsonify({"analysis": text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)