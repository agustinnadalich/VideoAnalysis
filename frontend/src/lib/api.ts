export async function fetchEvents(matchId: number) {
  const res = await fetch(`http://localhost:5001/events?match_id=${matchId}`);
  if (!res.ok) throw new Error("Error al obtener eventos");
  return res.json();
}