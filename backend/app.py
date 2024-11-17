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
        {"type": "Tackle", "descriptor": "Player 1", "duration": 3, "time": 45, "result": "Success"},
        {"type": "Tackle", "descriptor": "Player 2", "duration": 3, "time": 12, "result": "Failure"},
        {"type": "Tackle", "descriptor": "Player 3", "duration": 3, "time": 30, "result": "Success"},
        {"type": "Tackle", "descriptor": "Player 4", "duration": 3, "time": 22, "result": "Failure"},
        {"type": "Tackle", "descriptor": "Player 5", "duration": 3, "time": 55, "result": "Success"},
        {"type": "Tackle", "descriptor": "Player 3", "duration": 3, "time": 18, "result": "Failure"},
        {"type": "Tackle", "descriptor": "Player 2", "duration": 3, "time": 37, "result": "Success"},
        {"type": "Tackle", "descriptor": "Player 3", "duration": 3, "time": 29, "result": "Success"},
        {"type": "Tackle", "descriptor": "Player 4", "duration": 3, "time": 41, "result": "Success"},
        {"type": "Tackle", "descriptor": "Player 5", "duration": 3, "time": 50, "result": "Success"},
    ]
    print(events)  # Verifica los datos en la consola del servidor
    return jsonify(events)

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)