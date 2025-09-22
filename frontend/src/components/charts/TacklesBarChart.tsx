import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Props = {
  events: any[];
  onBarClick?: (category: string, player: string) => void;
};

export default function TacklesBarChart({ events, onBarClick }: Props) {
  // Filtrar solo tackles del equipo propio (no del rival)
  const tackleEvents = events.filter((e) => 
    (e.CATEGORY === 'TACKLE' || e.event_type === 'TACKLE') && e.TEAM !== 'OPPONENT'
  );

  console.log("TacklesBarChart - Total events:", events.length);
  console.log("TacklesBarChart - Tackle events (own team only):", tackleEvents.length);

  const playerAdvanceMap: Record<string, Record<string, number>> = {};

  tackleEvents.forEach((event) => {
    let players = [];
    if (event.PLAYER) {
      players = Array.isArray(event.PLAYER) ? event.PLAYER : event.PLAYER.split(',');
    } else if (event.player_name) {
      players = Array.isArray(event.player_name) ? event.player_name : event.player_name.split(',');
    } else if (event.extra_data?.JUGADOR) {
      const jugador = event.extra_data.JUGADOR;
      if (typeof jugador === 'string') {
        players = jugador.split(',');
      } else if (Array.isArray(jugador)) {
        players = jugador;
      } else {
        console.warn("Unexpected JUGADOR format:", jugador);
      }
    }

    // Filtrar valores vacíos o null del array de jugadores
    players = players.filter(player => player && typeof player === 'string' && player.trim() !== '');

    const advance = event.ADVANCE || event.advance_type || event.extra_data?.AVANCE || 'UNKNOWN';

    players.forEach((player) => {
      // Solo procesar si hay un jugador válido (no vacío, no null, no undefined)
      const trimmedPlayer = player.trim();
      if (trimmedPlayer !== '' && trimmedPlayer !== 'Unknown' && trimmedPlayer !== 'unknown') {
        if (!playerAdvanceMap[trimmedPlayer]) {
          playerAdvanceMap[trimmedPlayer] = { NEGATIVE: 0, NEUTRAL: 0, POSITIVE: 0, UNKNOWN: 0 };
        }

        if (['NEGATIVE', 'NEUTRAL', 'POSITIVE'].includes(advance)) {
          playerAdvanceMap[trimmedPlayer][advance]++;
        } else {
          playerAdvanceMap[trimmedPlayer]['UNKNOWN']++;
        }
      }
    });
  });

  const data = Object.keys(playerAdvanceMap).map(player => ({
    name: player,
    NEGATIVE: playerAdvanceMap[player].NEGATIVE,
    NEUTRAL: playerAdvanceMap[player].NEUTRAL,
    POSITIVE: playerAdvanceMap[player].POSITIVE,
    UNKNOWN: playerAdvanceMap[player].UNKNOWN,
  }));

  console.log("TacklesBarChart - Data for stacked chart:", data);

  const COLORS = {
    NEGATIVE: "#ff6b6b",
    NEUTRAL: "#feca57", 
    POSITIVE: "#48ca7b",
    UNKNOWN: "#a0a0a0"
  };

  const handleBarClick = (data: any) => {
    if (onBarClick && data && data.activeLabel) {
      console.log("Bar clicked:", data);
      onBarClick("player", data.activeLabel);
    }
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
          onClick={handleBarClick}
        >
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => {
              return [value, name];
            }}
            labelFormatter={(label) => `Jugador: ${label}`}
          />
          <Legend />
          <Bar dataKey="NEGATIVE" stackId="a" fill={COLORS.NEGATIVE} name="Negativo" />
          <Bar dataKey="NEUTRAL" stackId="a" fill={COLORS.NEUTRAL} name="Neutral" />
          <Bar dataKey="POSITIVE" stackId="a" fill={COLORS.POSITIVE} name="Positivo" />
          <Bar dataKey="UNKNOWN" stackId="a" fill={COLORS.UNKNOWN} name="Desconocido" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
