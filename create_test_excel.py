import pandas as pd
import os

# Crear datos de prueba
data = {
    'ID': [1, 2, 3, 4, 5],
    'CATEGORY': ['KICK OFF', 'PASS', 'TACKLE', 'TRY', 'END'],
    'PLAYER': ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'],
    'SECOND': [0, 10, 20, 30, 40],
    'COORDINATE_X': [50, 60, 70, 80, 90],
    'COORDINATE_Y': [50, 40, 30, 20, 10],
    'TEAM': ['Home', 'Home', 'Away', 'Home', 'Home']
}

df = pd.DataFrame(data)

# Crear el archivo Excel
df.to_excel('/Users/Agustin/wa/videoanalisis/VideoAnalysis/test_excel_simple.xlsx', 
            sheet_name='MATRIZ', index=False)

print("Archivo Excel creado exitosamente!")
