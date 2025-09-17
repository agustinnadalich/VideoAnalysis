#!/usr/bin/env python3
"""
Script para reimportar XML con precisión decimal corregida
"""
import requests
import json

def reimport_xml(filename, profile):
    """Reimporta un archivo XML usando el endpoint de importación"""

    url = "http://localhost:5001/api/import/xml"

    data = {
        "filename": filename,
        "profile": profile
    }

    print(f"Reimportando {filename}...")
    print(f"Perfil: {profile}")

    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ Importación exitosa!")
            print(f"Resultado: {result}")
            return True
        else:
            print("❌ Error en la importación:")
            print(response.text)
            return False

    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

if __name__ == "__main__":
    # Archivo XML a reimportar
    filename = "250830_CASI_vs_San_Luis_Pre.xml"

    # Perfil del partido
    profile = {
        "team": "San Luis",
        "opponent": "CASI",
        "date": "2025-08-30",
        "video_url": "https://youtube.com/watch?v=placeholder"
    }

    reimport_xml(filename, profile)
