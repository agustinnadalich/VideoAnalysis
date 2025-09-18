import { useQuery } from '@tanstack/react-query';

export const useEvents = (matchId: number) => {
  return useQuery({
    queryKey: ['events', matchId],
    queryFn: async () => {
      try {
        // Obtener eventos
        const eventsRes = await fetch(`http://localhost:5001/api/matches/${matchId}/events`);
        if (!eventsRes.ok) {
          throw new Error(`Error fetching events: ${eventsRes.status}`);
        }
        const eventsJson = await eventsRes.json();
        console.log("📦 Eventos obtenidos:", eventsJson.events?.length || 0, "eventos");

        // Obtener información del match (opcional)
        let matchJson = {};
        try {
          const matchRes = await fetch(`http://localhost:5001/api/matches/${matchId}/info`);
          if (matchRes.ok) {
            matchJson = await matchRes.json();
            console.log("📦 Info del match obtenida");
          }
        } catch (matchError) {
          console.warn("⚠️ No se pudo obtener info del match:", matchError);
        }

        // Transformar la respuesta del backend al formato esperado por el frontend
        const formattedData = {
          events: Array.isArray(eventsJson.events) ? eventsJson.events : [],
          match_info: matchJson
        };

        console.log("📦 Datos formateados - eventos:", formattedData.events.length);
        return formattedData;
      } catch (error) {
        console.error("❌ Error en useEvents:", error);
        throw error;
      }
    },
    enabled: !!matchId,
  });
};



