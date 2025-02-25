from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import os
import pandas as pd

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://videoanalysis-front.onrender.com"]}})  # Permitir solicitudes desde localhost:3000 y videoanalysis-front.onrender.com

# Asegúrate de que el directorio de uploads exista
UPLOAD_FOLDER = '/app/uploads/'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Ruta del archivo Excel
file_path = os.path.join(UPLOAD_FOLDER, 'Matriz_San_Benedetto_24-25_(TEST).xlsx')

# Lee la hoja "MATRIZ" del archivo Excel
try:
    df = pd.read_excel(file_path, sheet_name='MATRIZ')
    # Convierte la columna 'SEGUNDO' a enteros si existe
    if 'SEGUNDO' in df.columns:
        df['SEGUNDO'] = df['SEGUNDO'].astype(int)
    # Reemplaza NaN con None para que sea serializable a JSON
    df = df.where(pd.notnull(df), None)
    # Muestra las primeras filas del DataFrame
    print(df.head())
except FileNotFoundError:
    print(f"Archivo no encontrado: {file_path}")
    df = pd.DataFrame()  # Crea un DataFrame vacío si el archivo no se encuentra
except Exception as e:
    print(f"Error al leer el archivo: {e}")
    df = pd.DataFrame()  # Crea un DataFrame vacío en caso de otros errores

# Lee la hoja "PARTIDOS" del archivo Excel
try:
    df_partidos = pd.read_excel(file_path, sheet_name='PARTIDOS')
    # Reemplaza NaN con None para que sea serializable a JSON
    df_partidos = df_partidos.where(pd.notnull(df_partidos), None)
    # Muestra las primeras filas del DataFrame
    print(df_partidos.head())
except FileNotFoundError:
    print(f"Archivo no encontrado: {file_path}")
    df_partidos = pd.DataFrame()  # Crea un DataFrame vacío si el archivo no se encuentra
except Exception as e:
    print(f"Error al leer el archivo: {e}")
    df_partidos = pd.DataFrame()  # Crea un DataFrame vacío en caso de otros errores


@app.route('/events', methods=['GET'])
def get_events():
    if not os.path.exists(file_path):
        return jsonify({"error": "Archivo Excel no encontrado"}), 404

    df = pd.read_excel(file_path, sheet_name='MATRIZ')
    if df.empty:
        return jsonify({"error": "No data available"}), 404

    # Selecciona todas las columnas necesarias
    columns_to_include = ['ID', 'RIVAL', 'SEGUNDO', 'DURACION', 'CATEGORIA', 'EQUIPO', 'COORDENADA X', 'COORDENADA Y', 'SECTOR', 'JUGADOR', 'RESULTADO SCRUM', 'AVANCE', 'RESULTADO LINE', 'CANTIDAD LINE', 'POSICION LINE', 'TIRADOR LINE', 'JUGADA LINE', 'SALTADOR RIVAL', 'TIPO QUIEBRE', 'CANAL QUIEBRE', 'PERDIDA', 'TIPO DE INFRACCIÓN', 'TIPO DE PIE', 'ENCUADRE', 'TIEMPO RUCK', 'PUNTOS', 'PUNTOS (VALOR)', 'TIEMPOS', 'PALOS']
    filtered_df = df[columns_to_include]

    # Identifica los eventos de inicio y fin de cada mitad
    kick_off_1 = filtered_df[(filtered_df['CATEGORIA'] == 'KICK OFF') & (filtered_df['TIEMPOS'] == 1)]['SEGUNDO'].min()
    fin_1 = filtered_df[(filtered_df['CATEGORIA'] == 'FIN') & (filtered_df['TIEMPOS'] == 1)]['SEGUNDO'].max()
    kick_off_2 = filtered_df[(filtered_df['CATEGORIA'] == 'KICK OFF') & (filtered_df['TIEMPOS'] == 2)]['SEGUNDO'].min()
    fin_2 = filtered_df[(filtered_df['CATEGORIA'] == 'FIN') & (filtered_df['TIEMPOS'] == 2)]['SEGUNDO'].max()

    # Calcula el tiempo de juego acumulado
    def calcular_tiempo_de_juego(segundo):
        if segundo <= fin_1:
            return segundo - kick_off_1
        elif segundo >= kick_off_2:
            return (fin_1 - kick_off_1) + (segundo - kick_off_2)
        return None

    # Define los grupos de tiempo
    timeGroups = [
        { "label": "0'- 20'", "start": 0, "end": 20 * 60 },
        { "label": "20' - 40'", "start": 20 * 60, "end": calcular_tiempo_de_juego(fin_1) },
        { "label": "40' - 60'", "start": calcular_tiempo_de_juego(kick_off_2), "end": calcular_tiempo_de_juego(kick_off_2) + 20 * 60 },
        { "label": "60' - 80'", "start": calcular_tiempo_de_juego(kick_off_2) + 20 * 60, "end": calcular_tiempo_de_juego(fin_2) }
    ]
    print(timeGroups)

    # Convierte el DataFrame a una lista de diccionarios
    events = filtered_df.to_dict(orient='records')
    for event in events:
        if 'SEGUNDO' in event and event['SEGUNDO'] is not None:
            minutes, seconds = divmod(int(event['SEGUNDO']), 60)
            event['TIEMPO(VIDEO)'] = f"{minutes:02}:{seconds:02}"
            tiempo_de_juego = calcular_tiempo_de_juego(event['SEGUNDO'])
            if tiempo_de_juego is not None:
                tiempo_de_juego_minutes, tiempo_de_juego_seconds = divmod(tiempo_de_juego, 60)
                event['Tiempo_de_Juego'] = f"{int(tiempo_de_juego_minutes):02}:{int(tiempo_de_juego_seconds):02}"
                # Asigna el grupo de tiempo correspondiente
                for group in timeGroups:
                    if group["start"] <= tiempo_de_juego < group["end"]:
                        event["Grupo_Tiempo"] = group["label"]
                        break
            else:
                event['Tiempo_de_Juego'] = None
                event['Grupo_Tiempo'] = None

    # Reemplaza NaN con None en la lista de diccionarios y convierte objetos no serializables
    for event in events:
        for key, value in event.items():
            if value != value:  # NaN no es igual a sí mismo
                event[key] = None
            elif isinstance(value, pd.Timestamp):
                event[key] = value.isoformat()
            elif isinstance(value, pd.Timedelta):
                event[key] = str(value)
            elif isinstance(value, (pd._libs.tslibs.nattype.NaTType, type(pd.NaT))):
                event[key] = None

    # Lee los datos generales del partido desde la hoja "PARTIDOS"
    df_partidos = pd.read_excel(file_path, sheet_name='PARTIDOS')
    partido_info = df_partidos.to_dict(orient='records')[0]  # Asume que hay solo una fila con datos generales del partido

    print(events)  # Verifica los datos en la consola del servidor
    return jsonify({"header": partido_info, "events": events})

@app.route('/events/filter', methods=['GET'])
def filter_events():
    if df.empty:
        return jsonify({"error": "No data available"}), 404
    
    # Obtiene los parámetros de filtro de la solicitud
    category = request.args.get('category')
    time = request.args.get('time')
    player = request.args.get('player')
    
    filtered_df = df
    
    if category:
        filtered_df = filtered_df[filtered_df['CATEGORIA'] == category]
    if time:
        filtered_df = filtered_df[filtered_df['SEGUNDO'] == int(time)]
    if player:
        filtered_df = filtered_df[filtered_df['JUGADOR'] == player]
    
    events = filtered_df.to_dict(orient='records')
    
    # Reemplaza NaN con None en la lista de diccionarios y convierte objetos no serializables
    for event in events:
        for key, value in event.items():
            if value != value:  # NaN no es igual a sí mismo
                event[key] = None
            elif isinstance(value, pd.Timestamp):
                event[key] = value.isoformat()
            elif isinstance(value, pd.Timedelta):
                event[key] = str(value)
            elif isinstance(value, (pd._libs.tslibs.nattype.NaTType, type(pd.NaT))):
                event[key] = None
    
    return jsonify(events)

@app.route('/events/table', methods=['GET'])
def events_table():
    if df.empty:
        return "<h1>No data available</h1>", 404
    
    # Obtiene los parámetros de filtro de la solicitud
    category = request.args.get('category')
    player = request.args.get('player')
    
    filtered_df = df
    
    if category:
        filtered_df = filtered_df[filtered_df['CATEGORIA'] == category]
    if player:
        filtered_df = filtered_df[filtered_df['JUGADOR'] == player]
    
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

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)