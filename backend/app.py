from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Asegúrate de que el directorio de uploads exista
UPLOAD_FOLDER = './uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/events', methods=['GET'])
def get_events():
    events = [
        {"id": 1, "type": "Tackle", "descriptor": "Player 2", "duration": 3, "time": 12, "result": "Failure", "x": 10, "y": 5},
        {"id": 2, "type": "Tackle", "descriptor": "Player 3", "duration": 3, "time": 18, "result": "Failure", "x": 20, "y": 10},
        {"id": 3, "type": "Tackle", "descriptor": "Player 4", "duration": 3, "time": 22, "result": "Failure", "x": 30, "y": 15},
        {"id": 4, "type": "Tackle", "descriptor": "Player 3", "duration": 3, "time": 29, "result": "Success", "x": 40, "y": 20},
        {"id": 5, "type": "Tackle", "descriptor": "Player 3", "duration": 3, "time": 30, "result": "Success", "x": 50, "y": 25},
        {"id": 6, "type": "Tackle", "descriptor": "Player 2", "duration": 3, "time": 37, "result": "Success", "x": 60, "y": 30},
        {"id": 7, "type": "Tackle", "descriptor": "Player 4", "duration": 3, "time": 41, "result": "Success", "x": 70, "y": 35},
        {"id": 8, "type": "Ruck", "descriptor": "Player 1", "duration": 3, "time": 45, "result": "Success", "x": 80, "y": 40},
        {"id": 9, "type": "Ruck", "descriptor": "Player 5", "duration": 3, "time": 50, "result": "Success", "x": 90, "y": 45},
        {"id": 10, "type": "Tackle", "descriptor": "Player 5", "duration": 3, "time": 55, "result": "Success", "x": 100, "y": 50}
    ]
    print(events)  # Verifica los datos en la consola del servidor
    return jsonify(events)

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)