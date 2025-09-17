import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Props = {
  events: any[];
  onBarClick?: (category: string, player: string) => void;
};

export default function TacklesBarChart({ events, onBarClick }: Props) {
  // Soportar tanto formato nuevo como legacy
  const tackleEvents = events.filter((e) => 
    e.CATEGORY === 'TACKLE' || e.event_type === 'TACKLE'
  );

  console.log("TacklesBarChart - Total events:", events.length);
  console.log("TacklesBarChart - Tackle events:", tackleEvents.length);

  const dataMap: Record<string, number> = {};

  tackleEvents.forEach((event) => {
    // Manejar jugadores múltiples correctamente
    let players: string[] = [];
    
    if (event.PLAYER) {
      players = Array.isArray(event.PLAYER) ? event.PLAYER : [event.PLAYER];
    } else if (event.player_name) {
      players = Array.isArray(event.player_name) ? event.player_name : [event.player_name];
    } else if (event.extra_data && event.extra_data.JUGADOR) {
      const jugador = event.extra_data.JUGADOR;
      players = Array.isArray(jugador) ? jugador : [jugador];
    } else {
      players = ['Unknown'];
    }

    const category = event.CATEGORY || event.event_type || 'TACKLE';
    
    // Crear una entrada para cada jugador
    players.forEach(player => {
      const key = `${category} - ${player}`;
      dataMap[key] = (dataMap[key] || 0) + 1;
    });
  });

  const data = Object.entries(dataMap).map(([key, count]) => ({
    key,
    count,
  }));

  console.log("TacklesBarChart - Data for chart:", data);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-2">Tackles por Jugador</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          onClick={(e) => {
            if (e && e.activeLabel && onBarClick) {
              const [category, player] = e.activeLabel.split(' - ');
              onBarClick(category, player);
            }
          }}
        >
          <XAxis dataKey="key" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}