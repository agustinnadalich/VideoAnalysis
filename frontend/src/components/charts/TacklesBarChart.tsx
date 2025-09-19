import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

  // Filtrar solo tackles de nuestro equipo
  const ourTeamEvents = tackleEvents.filter((event) => {
    const team = event.extra_data?.EQUIPO || event.extra_data?.TEAM;
    return team === 'SAN LUIS (PreA)' || team === 'SAN LUIS';
  });

  console.log("TacklesBarChart - Our team tackle events:", ourTeamEvents.length);

  // Agrupar por jugador y tipo de avance
  const playerAdvanceMap: Record<string, Record<string, number>> = {};

  ourTeamEvents.forEach((event) => {
    // Obtener el jugador
    let player = 'Unknown';
    if (event.PLAYER) {
      player = Array.isArray(event.PLAYER) ? event.PLAYER[0] : event.PLAYER;
    } else if (event.player_name) {
      player = Array.isArray(event.player_name) ? event.player_name[0] : event.player_name;
    } else if (event.extra_data?.JUGADOR) {
      player = Array.isArray(event.extra_data.JUGADOR) ? event.extra_data.JUGADOR[0] : event.extra_data.JUGADOR;
    }

    // Obtener el tipo de avance (buscar tanto en español como inglés)
    const advance = 
      event.extra_data?.AVANCE ||
      event.extra_data?.ADVANCE ||
      event.extra_data?.descriptors?.AVANCE ||
      event.extra_data?.descriptors?.ADVANCE ||
      'UNKNOWN';

    // Inicializar el mapa para este jugador si no existe
    if (!playerAdvanceMap[player]) {
      playerAdvanceMap[player] = {
        NEGATIVE: 0,
        NEUTRAL: 0,
        POSITIVE: 0,
        UNKNOWN: 0
      };
    }

    // Incrementar el contador correspondiente
    if (playerAdvanceMap[player][advance] !== undefined) {
      playerAdvanceMap[player][advance]++;
    } else {
      playerAdvanceMap[player].UNKNOWN++;
    }
  });

  // Convertir a formato para el gráfico
  const data = Object.entries(playerAdvanceMap)
    .map(([player, advances]) => ({
      player,
      NEGATIVE: advances.NEGATIVE,
      NEUTRAL: advances.NEUTRAL,
      POSITIVE: advances.POSITIVE,
      UNKNOWN: advances.UNKNOWN,
      total: advances.NEGATIVE + advances.NEUTRAL + advances.POSITIVE + advances.UNKNOWN
    }))
    .filter(item => item.total > 0) // Solo mostrar jugadores con tackles
    .sort((a, b) => b.total - a.total); // Ordenar por total de tackles descendente

  console.log("TacklesBarChart - Data for stacked chart:", data);

  // Determinar qué categorías tienen valores para mostrar solo las necesarias
  const hasNegative = data.some(item => item.NEGATIVE > 0);
  const hasNeutral = data.some(item => item.NEUTRAL > 0);
  const hasPositive = data.some(item => item.POSITIVE > 0);
  const hasUnknown = data.some(item => item.UNKNOWN > 0);

  // Colores para cada tipo de avance
  const COLORS = {
    NEGATIVE: '#ef4444', // Rojo para negativo
    NEUTRAL: '#f59e0b',  // Amarillo para neutral
    POSITIVE: '#10b981', // Verde para positivo
    UNKNOWN: '#6b7280'   // Gris para desconocido
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-2">Tackles por Jugador (Nuestro Equipo)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          onClick={(e) => {
            if (e && e.activeLabel && onBarClick) {
              onBarClick('TACKLE', e.activeLabel);
            }
          }}
        >
          <XAxis 
            dataKey="player" 
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => {
              // Solo mostrar valores mayores a cero
              if (value === 0) return null;
              return [value, name];
            }}
            labelFormatter={(label) => `Jugador: ${label}`}
          />
          <Legend />
          {hasNegative && <Bar dataKey="NEGATIVE" stackId="a" fill={COLORS.NEGATIVE} name="Negativo" />}
          {hasNeutral && <Bar dataKey="NEUTRAL" stackId="a" fill={COLORS.NEUTRAL} name="Neutral" />}
          {hasPositive && <Bar dataKey="POSITIVE" stackId="a" fill={COLORS.POSITIVE} name="Positivo" />}
          {hasUnknown && <Bar dataKey="UNKNOWN" stackId="a" fill={COLORS.UNKNOWN} name="Desconocido" />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}