#!/usr/bin/env python3
import os
import sys
sys.path.append('/Users/Agustin/wa/videoanalisis/VideoAnalysis/backend')

from normalizer import normalize_xml_to_json

# Test XML import
xml_file = "/Users/Agustin/wa/videoanalisis/VideoAnalysis/backend/uploads/FI.FA._Security_Unione_Rugby_San_Benedetto_vs_Lundax_Lions_Amaranto_1080p_30fps_H264-128kbit_AAC.xml"

profile = {
    "file_type": "xml",
    "events_sheet": "MATRIZ",
    "meta_sheet": "MATCHES",
    "time_mapping": {
        "method": "manual",
        "kick_off_1": {"category": "", "descriptor": "", "descriptor_value": "", "period": 1},
        "end_1": {"category": "", "descriptor": "", "descriptor_value": "", "period": 1},
        "kick_off_2": {"category": "", "descriptor": "", "descriptor_value": "", "period": 2},
        "end_2": {"category": "", "descriptor": "", "descriptor_value": "", "period": 2},
        "manual_times": {"kick_off_1": 490, "end_1": 3100, "kick_off_2": 3600, "end_2": 6150}
    }
}

print("🔍 Testando importación XML...")
print(f"📁 Archivo: {xml_file}")
print(f"📄 Archivo existe: {os.path.exists(xml_file)}")

try:
    result = normalize_xml_to_json(xml_file, profile)
    if result:
        print(f"✅ Importación exitosa!")
        print(f"📊 Eventos encontrados: {len(result.get('events', []))}")
        print(f"📋 Match info: {result.get('match', {})}")
    else:
        print("❌ La importación falló - resultado vacío")
except Exception as e:
    print(f"❌ Error durante la importación: {e}")
    import traceback
    traceback.print_exc()
