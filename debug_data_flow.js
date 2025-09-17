// Debug script para verificar el flujo de datos
console.log("=== DEBUG DATA FLOW ===");

// Simular la llamada al API
fetch('http://localhost:5001/api/matches/3/events')
  .then(response => response.json())
  .then(data => {
    console.log("1. Raw API Response:", data);
    console.log("2. Events count:", data.events?.length);
    
    // Verificar eventos de tackle
    const tackleEvents = data.events?.filter(e => e.event_type === 'TACKLE') || [];
    console.log("3. Tackle events count:", tackleEvents.length);
    
    // Verificar tackles con múltiples jugadores
    const doubleTackles = tackleEvents.filter(e => Array.isArray(e.extra_data?.JUGADOR));
    console.log("4. Double tackles:", doubleTackles.length);
    
    if (doubleTackles.length > 0) {
      console.log("5. Sample double tackle:", doubleTackles[0]);
    }
    
    // Verificar eventos por equipo
    const teamEvents = data.events?.filter(e => e.extra_data?.EQUIPO === 'PESCARA') || [];
    console.log("6. PESCARA team events:", teamEvents.length);
    
    console.log("=== DEBUG COMPLETE ===");
  })
  .catch(error => {
    console.error("API Error:", error);
  });
