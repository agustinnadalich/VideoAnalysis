import xml.etree.ElementTree as ET
import json

with open('/app/uploads/20251019 Az-Pescara (2) 2.xml', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

root = ET.fromstring(content)
matriz = []
id_counter = 1

for instance in root.findall('.//instance'):
    # Extraer code como CATEGORY
    code = instance.find('code')
    if code is None or code.text is None:
        continue
    
    start = instance.find('start')
    end = instance.find('end')
    
    if start is None or end is None or start.text is None or end.text is None:
        continue
    
    try:
        start_ms = float(start.text) * 1000
        end_ms = float(end.text) * 1000
        duration = (end_ms - start_ms) / 1000.0
        second = start_ms / 1000.0
        minute = second / 60.0
        
        # Determinar periodo basado en tiempo (aproximado)
        period = 1 if minute < 43 else 2
        
        hours = int(second // 3600)
        minutes = int((second % 3600) // 60)
        secs = int(second % 60)
        time_str = f"{hours:02d}:{minutes:02d}:{secs:02d}"
        
        # Evento base
        event = {
            "ID": id_counter,
            "CATEGORY": code.text,
            "SECOND": second,
            "MINUTE": minute,
            "TIME": time_str,
            "DURATION": duration,
            "GAME": 1,
            "OPPONENT": "Avezzano",
            "PERIODS": period
        }
        # TEAM se agregará solo si hay EQUIPO en las labels
        
        # Extraer coordenadas (pos_x, pos_y) - tomar las primeras si hay múltiples
        pos_x = instance.find('pos_x')
        pos_y = instance.find('pos_y')
        if pos_x is not None and pos_x.text is not None:
            try:
                event["COORDINATE_X"] = float(pos_x.text)
            except:
                pass
        if pos_y is not None and pos_y.text is not None:
            try:
                event["COORDINATE_Y"] = float(pos_y.text)
            except:
                pass
        
        # Extraer descriptores: Group + Text
        # Regla: solo usar <text> si tiene un <group> inmediatamente antes
        labels = instance.findall('label')
        current_group = None
        
        for label in labels:
            group_elem = label.find('group')
            text_elem = label.find('text')
            
            if group_elem is not None and group_elem.text is not None:
                # Guardar el grupo actual
                current_group = group_elem.text
            
            if text_elem is not None and text_elem.text is not None:
                # Solo agregar si hay un grupo previo
                if current_group is not None:
                    # Mapeo especial para campos críticos
                    group_upper = current_group.upper()
                    
                    if group_upper == "EQUIPO":
                        # Convertir EQUIPO según el valor del text
                        text_value = text_elem.text.upper().strip()
                        if text_value == "RIVAL" or text_value == "AVEZZANO":
                            event["TEAM"] = "OPPONENT"
                        elif text_value == "PESCARA" or text_value in ["1", "2"]:
                            event["TEAM"] = "PESCARA"
                        else:
                            # Si es otro valor, conservarlo
                            event["TEAM"] = text_elem.text
                    elif group_upper == "JUGADOR":
                        event["PLAYER"] = text_elem.text
                    elif group_upper == "TIPO-PUNTOS":
                        # Para charts de Points by Type
                        text_value = text_elem.text.upper().strip()
                        
                        # Mapear valores del XML a nombres esperados por charts
                        if text_value == "PENALTY-KICK" or text_value == "PENALTY KICK":
                            event["POINTS"] = "PEN"
                            event["POINTS(VALUE)"] = 3
                        elif text_value == "DROP P" or text_value == "DROP":
                            event["POINTS"] = "DG"
                            event["POINTS(VALUE)"] = 3
                        elif text_value == "CONVERSION" or text_value == "CON":
                            event["POINTS"] = "CON"
                            event["POINTS(VALUE)"] = 2
                        elif text_value == "TRY":
                            event["POINTS"] = "TRY"
                            event["POINTS(VALUE)"] = 5
                        else:
                            # Conservar valor original si no está en el mapa
                            event["POINTS"] = text_elem.text
                            event["POINTS(VALUE)"] = 0
                    elif group_upper == "INFRACCION" or group_upper == "INFRACCI\u00d3N":
                        # Para Penalties Cause chart
                        event["INFRACTION_TYPE"] = text_elem.text
                    elif "TIPO-PERDIDA" in group_upper or "RECUPERACI" in group_upper:
                        # Para Turnovers Type chart
                        event["TURNOVER_TYPE"] = text_elem.text
                    elif group_upper == "AVANCE":
                        # Para Tackles charts
                        event["ADVANCE"] = text_elem.text
                    else:
                        # Para otros grupos, usar nombre normalizado
                        key_name = current_group.replace('-', '_').replace('/', '_').replace(' ', '_').upper()
                        event[key_name] = text_elem.text
                    
                    current_group = None  # Resetear después de usar
        
        matriz.append(event)
        id_counter += 1
    except Exception as e:
        continue

print(f"✅ Convertidos {len(matriz)} eventos con estructura mejorada")

with open('/app/uploads/matrizPescara.json', 'w') as f:
    json.dump(matriz, f, indent=2)

# URL actualizada ya está en matchesPescara.json (no sobreescribir)
print("📁 matrizPescara.json guardado!")

