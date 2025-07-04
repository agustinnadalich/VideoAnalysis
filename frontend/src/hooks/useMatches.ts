import { useQuery } from '@tanstack/react-query';

export const useMatches = () => {
  return useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const res = await fetch('http://localhost:5001/api/matches');
      if (!res.ok) throw new Error('Error al obtener los partidos');
      return res.json();
    },
  });
};
