import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#0088FE'];

type Props = {
  events: any[];
  onChartClick?: (event: any, elements: any, chart: any, chartType: string, tabId?: string, additionalFilters?: any[]) => void;
  category: string;
};

const AdvancePieChart: React.FC<Props> = ({ events, onChartClick, category }) => {
  // Soportar tanto formato nuevo como legacy
  const filteredEvents = events.filter(
    (event) => event.CATEGORY === category || event.event_type === category
  );

    // Obtener todos los resultados únicos de AVANCE
  const advanceLabels = [
    ...new Set(
      filteredEvents.map((event) => {
        // Buscar en descriptors, extra_data, etc. - usar AVANCE en español
        const advance = 
          event.extra_data?.descriptors?.AVANCE ||
          event.extra_data?.AVANCE ||
          event.descriptors?.AVANCE ||
          event.extra_data?.descriptors?.ADVANCE ||
          event.extra_data?.ADVANCE ||
          event.descriptors?.ADVANCE ||
          null;

      return advance;
    }).filter((avance) => avance !== null && avance !== undefined && avance !== "")),
  ].sort();

  console.log("AdvancePieChart - Raw advance values:", filteredEvents.map(e => e.extra_data?.AVANCE));
  console.log("AdvancePieChart - Filtered advance labels:", advanceLabels);

  const advanceData = advanceLabels.map(
    (result) =>
      filteredEvents.filter((event) => {
        let eventAdvance = 
          event.extra_data?.descriptors?.AVANCE ||
          event.extra_data?.AVANCE ||
          event.descriptors?.AVANCE ||
          event.extra_data?.descriptors?.ADVANCE ||
          event.extra_data?.ADVANCE ||
          event.descriptors?.ADVANCE ||
          event.ADVANCE ||
          event.AVANCE ||
          null;

        // Si es un array, verificar si contiene el resultado (después de eliminar duplicados)
        if (Array.isArray(eventAdvance)) {
          const uniqueAdvances = [...new Set(eventAdvance)];
          return uniqueAdvances.includes(result);
        }

        // Comparación normal para strings
        return eventAdvance === result;
      }).length
  );

  const data = advanceLabels.map((label, index) => ({
    name: label,
    value: advanceData[index],
  }));

  console.log("AdvancePieChart - Final data for chart:", data);

  const onPieClick = (entry: any, index: number) => {
    console.log("AdvancePieChart - Click entry received:", entry);
    console.log("AdvancePieChart - Click index:", index);
    console.log("AdvancePieChart - Entry name:", entry?.name);
    if (onChartClick && entry && entry.name) {
      console.log("AdvancePieChart - Sending filter for:", entry.name);
      onChartClick(null, null, null, 'advance-chart', 'tackles-tab', [
        { descriptor: "ADVANCE", value: entry.name }
      ]);
    } else {
      console.log("AdvancePieChart - Click entry incomplete:", { entry, hasName: entry?.name });
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-2">Distribución de Avances</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                onClick={() => onPieClick(entry, index)}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AdvancePieChart;