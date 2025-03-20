from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import os
import pandas as pd
import json

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

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)