import { useQuery } from '@tanstack/react-query';

export const useEvents = (matchId: number) => {
  return useQuery({
    queryKey: ['events', matchId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5001/api/matches/${matchId}/events`);
      if (!res.ok) throw new Error('Error fetching events');
      const json = await res.json();
      console.log("📦 JSON parseado:", json); // Debería mostrar { events: [...] }
      return json; // 🔁 devolvemos todo el objeto
    },
    enabled: !!matchId,
  });
};



