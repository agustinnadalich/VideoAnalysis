#!/usr/bin/env python3
"""
Script de prueba para verificar la lógica simplificada de detección de períodos
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from normalizer import detect_periods_and_convert_times

def test_manual_times():
    """Prueba la lógica con tiempos manuales"""
    print("🧪 Probando lógica simplificada con tiempos manuales...")

    # Simular perfil con tiempos manuales
    profile = {
        "manual_period_times": {
            "kick_off_1": 0,
            "end_1": 2400,  # 40 minutos
            "kick_off_2": 2700,  # 15 min descanso
            "end_2": 4800  # 40 minutos más
        }
    }

    # Simular instancias XML (vacías para esta prueba)
    instances = []

    # Ejecutar la función
    control_events, game_events, time_offsets = detect_periods_and_convert_times(instances, profile)

    print("✅ Resultados:")
    print(f"   Eventos de control: {len(control_events)}")
    print(f"   Eventos de juego: {len(game_events)}")
    print(f"   Offsets calculados: {time_offsets}")

    # Verificar que los offsets sean correctos
    expected_offsets = {
        1: {
            'start_offset': 0,
            'start_time': 0,
            'end_time': 2400
        },
        2: {
            'start_offset': -2700,
            'start_time': 2700,
            'end_time': 4800
        }
    }

    if time_offsets == expected_offsets:
        print("✅ Los offsets calculados son correctos!")
        return True
    else:
        print("❌ Los offsets no coinciden con lo esperado")
        print(f"   Esperado: {expected_offsets}")
        print(f"   Obtenido: {time_offsets}")
        return False

def test_fallback():
    """Prueba la lógica de fallback sin tiempos manuales"""
    print("\n🧪 Probando lógica de fallback...")

    # Simular perfil sin tiempos manuales
    profile = {}

    # Simular instancias XML (vacías para esta prueba)
    instances = []

    # Ejecutar la función
    control_events, game_events, time_offsets = detect_periods_and_convert_times(instances, profile)

    print("✅ Resultados del fallback:")
    print(f"   Eventos de control: {len(control_events)}")
    print(f"   Eventos de juego: {len(game_events)}")
    print(f"   Offsets calculados: {time_offsets}")

    # Verificar que tenga offsets por defecto
    if 1 in time_offsets and 2 in time_offsets:
        print("✅ Fallback generó offsets por defecto correctamente!")
        return True
    else:
        print("❌ Fallback no generó offsets por defecto")
        return False

if __name__ == "__main__":
    print("🚀 Iniciando pruebas de la lógica simplificada...\n")

    test1_passed = test_manual_times()
    test2_passed = test_fallback()

    if test1_passed and test2_passed:
        print("\n🎉 Todas las pruebas pasaron exitosamente!")
    else:
        print("\n❌ Algunas pruebas fallaron")
        sys.exit(1)
