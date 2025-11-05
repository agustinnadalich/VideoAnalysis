"""
Ejemplo de mapeos personalizados para diferentes analistas/entrenadores.
Este script muestra cómo agregar terminología específica de cada equipo o analista.
"""

from db import SessionLocal
from translator import get_translator

def add_custom_team_mappings():
    """
    Agrega mapeos personalizados para diferentes equipos y analistas.
    Cada equipo puede tener su propia terminología que se mapea a categorías estándar.
    """
    db = SessionLocal()
    translator = get_translator(db)
    
    print("🏉 Agregando mapeos personalizados para equipos...")
    
    # ========================================
    # EQUIPO ROSARIO - Terminología específica
    # ========================================
    rosario_mappings = [
        # Event Types - Terminología del entrenador
        {"source_term": "Derribo", "target_category": "TACKLE", "notes": "Equipo Rosario"},
        {"source_term": "Tackle Fallido", "target_category": "TACKLE_MISSED", "notes": "Equipo Rosario"},
        {"source_term": "Formación Fija", "target_category": "SCRUM", "notes": "Equipo Rosario"},
        {"source_term": "Lateral", "target_category": "LINEOUT", "notes": "Equipo Rosario"},
        {"source_term": "Infracción", "target_category": "PENALTY", "notes": "Equipo Rosario"},
        
        # Descriptores personalizados
        {"source_term": "Zona Defensiva", "target_category": "DEFENSIVE_ZONE", 
         "mapping_type": "descriptor", "notes": "Equipo Rosario"},
        {"source_term": "Media Cancha", "target_category": "MIDFIELD", 
         "mapping_type": "descriptor", "notes": "Equipo Rosario"},
    ]
    
    # ========================================
    # CLUB ATHLETIC - Terminología inglesa adaptada
    # ========================================
    athletic_mappings = [
        {"source_term": "Tackle Efectivo", "target_category": "TACKLE", "notes": "Club Athletic"},
        {"source_term": "Tackle Perdido", "target_category": "TACKLE_MISSED", "notes": "Club Athletic"},
        {"source_term": "Scrum Ganado", "target_category": "SCRUM_WON", "notes": "Club Athletic"},
        {"source_term": "Scrum Perdido", "target_category": "SCRUM_LOST", "notes": "Club Athletic"},
        {"source_term": "Line Ganado", "target_category": "LINEOUT_WON", "notes": "Club Athletic"},
        
        # Descriptores con mezcla inglés-español
        {"source_term": "Outside 22", "target_category": "OUTSIDE_22", 
         "mapping_type": "descriptor", "notes": "Club Athletic"},
        {"source_term": "Inside 22", "target_category": "INSIDE_22", 
         "mapping_type": "descriptor", "notes": "Club Athletic"},
    ]
    
    # ========================================
    # PESCARA - Terminología italiana mixta
    # ========================================
    pescara_mappings = [
        # Mix italiano-español en software
        {"source_term": "Placcaggio Buono", "target_category": "TACKLE", 
         "language": "it", "notes": "Pescara - Nacsport italiano"},
        {"source_term": "Placcaggio Mancato", "target_category": "TACKLE_MISSED", 
         "language": "it", "notes": "Pescara"},
        {"source_term": "Touche", "target_category": "LINEOUT", 
         "language": "fr", "notes": "Pescara - influencia francesa"},
        
        # Descriptores italianos personalizados
        {"source_term": "Zona Difesa", "target_category": "DEFENSIVE_ZONE", 
         "mapping_type": "descriptor", "language": "it", "notes": "Pescara"},
        {"source_term": "Centrocampo", "target_category": "MIDFIELD", 
         "mapping_type": "descriptor", "language": "it", "notes": "Pescara"},
    ]
    
    # ========================================
    # LONGOMATCH - Terminología del software
    # ========================================
    longoMatch_mappings = [
        # LongoMatch usa nombres descriptivos largos
        {"source_term": "PENALTY KICK", "target_category": "PENALTY", 
         "notes": "LongoMatch default export"},
        {"source_term": "SCRUM SET", "target_category": "SCRUM", 
         "notes": "LongoMatch default export"},
        {"source_term": "LINE OUT", "target_category": "LINEOUT", 
         "notes": "LongoMatch default export"},
        {"source_term": "TACKLE MADE", "target_category": "TACKLE", 
         "notes": "LongoMatch default export"},
        {"source_term": "TACKLE MISSED", "target_category": "TACKLE_MISSED", 
         "notes": "LongoMatch default export"},
    ]
    
    # ========================================
    # SPORTSCODE - Terminología del software
    # ========================================
    sportscode_mappings = [
        {"source_term": "Tackle_Success", "target_category": "TACKLE", 
         "notes": "Sportscode export format"},
        {"source_term": "Tackle_Fail", "target_category": "TACKLE_MISSED", 
         "notes": "Sportscode export format"},
        {"source_term": "Scrum_Win", "target_category": "SCRUM_WON", 
         "notes": "Sportscode export format"},
        {"source_term": "Scrum_Loss", "target_category": "SCRUM_LOST", 
         "notes": "Sportscode export format"},
    ]
    
    # Combinar todos los mapeos
    all_custom_mappings = (
        rosario_mappings + 
        athletic_mappings + 
        pescara_mappings + 
        longoMatch_mappings + 
        sportscode_mappings
    )
    
    # Agregar todos con bulk_add
    count = translator.bulk_add_mappings(all_custom_mappings)
    
    print(f"✅ Se agregaron {count} mapeos personalizados")
    print("\n📊 Resumen por equipo/sistema:")
    print(f"   - Equipo Rosario: {len(rosario_mappings)} términos")
    print(f"   - Club Athletic: {len(athletic_mappings)} términos")
    print(f"   - Pescara: {len(pescara_mappings)} términos")
    print(f"   - LongoMatch: {len(longoMatch_mappings)} términos")
    print(f"   - Sportscode: {len(sportscode_mappings)} términos")
    
    # Probar algunas traducciones
    print("\n🔍 Probando traducciones personalizadas:")
    test_terms = [
        ("Derribo", "event_type"),
        ("Tackle Efectivo", "event_type"),
        ("Placcaggio Buono", "event_type"),
        ("PENALTY KICK", "event_type"),
        ("Tackle_Success", "event_type"),
        ("Zona Defensiva", "descriptor"),
    ]
    
    for term, mapping_type in test_terms:
        result = translator.translate(term, mapping_type)
        print(f"   '{term}' → '{result}'")
    
    db.close()
    return count


if __name__ == "__main__":
    add_custom_team_mappings()
