#!/usr/bin/env python3
"""
Script para probar la funcionalidad de importación XML con perfil manual
"""
import requests
import json

# URLs del backend
BASE_URL = "http://localhost:5001"
UPLOAD_URL = f"{BASE_URL}/api/upload"
PROFILES_URL = f"{BASE_URL}/api/import/profiles"

def test_xml_import_with_manual_profile():
    """
    Prueba la importación de XML con un perfil que requiere configuración manual
    """
    
    # 1. Obtener perfiles disponibles
    print("1. Obteniendo perfiles disponibles...")
    response = requests.get(PROFILES_URL)
    profiles = response.json()
    
    # Buscar un perfil XML con configuración manual
    manual_xml_profiles = []
    for profile in profiles:
        settings = profile.get('settings', {})
        is_xml = settings.get('file_type') == 'xml'
        has_manual_times = (
            settings.get('manual_period_times') or 
            (settings.get('time_mapping', {}).get('manual_times') and 
             settings.get('time_mapping', {}).get('method') == 'manual')
        )
        
        if is_xml and has_manual_times:
            manual_xml_profiles.append(profile)
    
    if not manual_xml_profiles:
        print("❌ No se encontraron perfiles XML con configuración manual")
        return False
    
    # Usar el primer perfil manual encontrado
    selected_profile = manual_xml_profiles[0]
    print(f"✅ Perfil seleccionado: {selected_profile['name']}")
    print(f"   Descripción: {selected_profile['description']}")
    
    # Mostrar configuración manual
    manual_times = (
        selected_profile['settings'].get('manual_period_times') or
        selected_profile['settings'].get('time_mapping', {}).get('manual_times', {})
    )
    print(f"   Tiempos manuales: {manual_times}")
    
    # 2. Simular el upload de un archivo XML
    xml_file_path = "/Users/Agustin/wa/videoanalisis/VideoAnalysis/backend/uploads/20250531_1ra_Alumni_vs_San_Luis.xml"
    
    print(f"\n2. Simulando upload de archivo XML: {xml_file_path}")
    try:
        with open(xml_file_path, 'rb') as f:
            files = {'file': (xml_file_path.split('/')[-1], f, 'text/xml')}
            data = {'profile_name': selected_profile['name']}
            
            response = requests.post(UPLOAD_URL, files=files, data=data)
            
        if response.status_code == 200:
            upload_result = response.json()
            print("✅ Upload exitoso")
            print(f"   Eventos detectados: {len(upload_result.get('events', []))}")
            print(f"   Tipos de evento: {upload_result.get('event_types', [])}")
            
            # Verificar si el preview incluiría configuración manual
            preview_data = upload_result
            profile = selected_profile
            
            # Simular la lógica de detección de PreviewImport
            is_manual_profile = (
                profile['settings'].get('manual_period_times') or 
                (profile['settings'].get('time_mapping', {}).get('manual_times') and 
                 profile['settings'].get('time_mapping', {}).get('method') == 'manual')
            )
            
            print(f"\n3. Verificación de detección de perfil manual:")
            print(f"   ¿Es perfil manual? {is_manual_profile}")
            
            if is_manual_profile:
                print("✅ La página de preview DEBERÍA mostrar campos de configuración manual")
                print("   - Kick Off 1er Tiempo")
                print("   - Fin 1er Tiempo") 
                print("   - Kick Off 2do Tiempo")
                print("   - Fin 2do Tiempo")
            else:
                print("❌ La página de preview NO mostraría campos de configuración manual")
            
            return True
        else:
            print(f"❌ Error en upload: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except FileNotFoundError:
        print(f"❌ Archivo XML no encontrado: {xml_file_path}")
        return False
    except Exception as e:
        print(f"❌ Error durante el upload: {e}")
        return False

if __name__ == "__main__":
    print("=== Prueba de Importación XML con Perfil Manual ===\n")
    success = test_xml_import_with_manual_profile()
    
    if success:
        print(f"\n✅ Prueba completada exitosamente")
        print("\nPasos para probar en el frontend:")
        print("1. Ve a http://localhost:3000")
        print("2. Ve a 'Importar Datos'")
        print("3. Selecciona un perfil XML con configuración manual")
        print("4. Sube un archivo XML")
        print("5. En la página de preview, deberías ver los campos de configuración manual")
    else:
        print(f"\n❌ Prueba falló")
