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

  // Obtener avances únicos soportando ambos formatos
  const advanceLabels = [
    ...new Set(filteredEvents.map((event) => {
      const advance = event.ADVANCE || (event.extra_data && event.extra_data.AVANCE);
      return advance;
    }).filter((avance) => avance !== null && avance !== undefined)),
  ].sort();

  console.log("AdvancePieChart - Filtered events:", filteredEvents.length);
  console.log("AdvancePieChart - Advance labels:", advanceLabels);

  const advanceData = advanceLabels.map(
    (result) =>
      filteredEvents.filter((event) => {
        const advance = event.ADVANCE || (event.extra_data && event.extra_data.AVANCE);
        return advance === result;
      }).length
  );

  const data = advanceLabels.map((label, index) => ({
    name: label,
    value: advanceData[index],
  }));

  const onPieClick = (data: any) => {
    if (onChartClick && data.name) {
      onChartClick(null, null, null, 'advance-chart', 'tackles-tab', [
        { descriptor: "ADVANCE", value: data.name }
      ]);
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-2">Distribución de Avances - {category}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onClick={onPieClick}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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