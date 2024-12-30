from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import os
import pandas as pd

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # Permitir solicitudes desde localhost:3000

# Asegúrate de que el directorio de uploads exista
UPLOAD_FOLDER = '/Users/Agustin/wa/videoanalisis/VideoAnalysis/frontend/public/'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Ruta del archivo Excel
file_path = os.path.join(UPLOAD_FOLDER, 'Matriz San Benedetto 24-25 (TEST).xlsx')

# Lee el archivo Excel
try:
    df = pd.read_excel(file_path)
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

@app.route('/events', methods=['GET'])
def get_events():
    if df.empty:
        return jsonify({"error": "No data available"}), 404
    
    # Selecciona algunas columnas básicas para empezar
    # columns_to_include = ['ID', 'FECHA', 'RIVAL','SEGUNDO', 'CATEGORÍA', 'JUGADOR', 'Equipo', 'SECTOR','COORDENADA X','COORDENADA Y', 'RESULTADO LINE']
    columns_to_include = ['ID', 'FECHA', 'RIVAL','SEGUNDO','DURACION', 'CATEGORÍA', 'JUGADOR', 'Equipo', 'SECTOR', 'RESULTADO LINE','COORDENADA X','COORDENADA Y', 'AVANCE']
    filtered_df = df[columns_to_include]
    
    # Convierte el DataFrame a una lista de diccionarios
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
            # elif key == 'COORDENADAS' and isinstance(value, str):
            #     try:
            #         coords = [int(coord) for coord in value.split('-')]
            #         event['x'] = coords[0]
            #         event['y'] = coords[1]
            #     except (ValueError, IndexError) as e:
            #         print(f"Error al procesar coordenadas: {value} - {e}")
            #         event['x'] = None
            #         event['y'] = None
            # elif key == 'COORDENADAS' and not value:
            #     event['x'] = None
            #     event['y'] = None
    
    print(events)  # Verifica los datos en la consola del servidor
    return jsonify(events)

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
        filtered_df = filtered_df[filtered_df['CATEGORÍA'] == category]
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
        filtered_df = filtered_df[filtered_df['CATEGORÍA'] == category]
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