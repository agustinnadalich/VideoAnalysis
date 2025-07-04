export async function fetchMatches() {
  const response = await fetch("http://localhost:5001/api/matches");
  if (!response.ok) throw new Error("Error al obtener los partidos");
  return response.json();
}

export async function fetchEvents(matchId: number) {
  const response = await fetch(`http://localhost:5001/events?match_id=${matchId}`);
  if (!response.ok) throw new Error("Error al obtener los eventos");
  return response.json();
}
