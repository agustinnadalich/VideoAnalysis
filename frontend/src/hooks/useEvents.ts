import { useQuery } from '@tanstack/react-query';

export const useEvents = (matchId: number) => {
  return useQuery({
    queryKey: ['events', matchId],
    queryFn: async () => {
      // Obtener eventos
      const eventsRes = await fetch(`http://localhost:5001/api/matches/${matchId}/events`);
      if (!eventsRes.ok) throw new Error('Error fetching events');
      const eventsJson = await eventsRes.json();
      console.log("📦 Eventos obtenidos:", eventsJson);
      
      // Obtener información del match
      const matchRes = await fetch(`http://localhost:5001/api/matches/${matchId}/info`);
      const matchJson = matchRes.ok ? await matchRes.json() : {};
      console.log("📦 Info del match obtenida:", matchJson);
      
      // Transformar la respuesta del backend al formato esperado por el frontend
      const formattedData = {
        events: Array.isArray(eventsJson) ? eventsJson : [],
        match_info: matchJson
      };
      
      console.log("📦 Datos formateados:", formattedData);
      return formattedData;
    },
    enabled: !!matchId,
  });
};



