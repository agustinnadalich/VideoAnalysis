import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

const PointsTypeChart = ({ events, onChartClick }) => {
  const getPointType = (ev:any) => {
    return ev?.extra_data?.['TIPO-PUNTOS'] ?? ev?.extra_data?.TIPO_PUNTOS ?? ev?.TIPO_PUNTOS ?? ev?.['TIPO-PUNTOS'] ?? ev?.MISC ?? null;
  };

  const pointTypes = [...new Set(events.map(event => String(getPointType(event) ?? '').trim()).filter(p => p && p !== 'null' && p !== 'undefined'))];

  const getPointsValue = (ev:any) => {
    const type = String(getPointType(ev) ?? '').toUpperCase();
    if (!type) return 0;
    if (type.includes('TRY')) return 5;
    if (type.includes('CONVERSION')) return 2;
    if (type.includes('PENALTY')) return 3;
    if (type.includes('DROP')) return 3;
    const v = ev?.["POINTS(VALUE)"] ?? ev?.["POINTS_VALUE"] ?? ev?.["POINTS VALUE"] ?? ev?.["POINTS"] ?? 0;
    const num = Number(v);
    return Number.isFinite(num) ? num : 0;
  };

  const isOpponent = (ev:any) => {
    const team = (ev.TEAM ?? ev.EQUIPO ?? ev.extra_data?.EQUIPO ?? ev.extra_data?.TEAM ?? '').toString().toUpperCase();
    if (!team) return false;
    return /OPPONENT|RIVAL|RIVALES|AWAY|OPPONENTS|RIVAL_TEAM|OPP/i.test(team);
  };

  const teamPointsByType = pointTypes.map(type => events.filter(event => String(getPointType(event) ?? '').toUpperCase() === String(type).toUpperCase() && !isOpponent(event)).reduce((sum, ev) => sum + getPointsValue(ev), 0));
  const rivalPointsByType = pointTypes.map(type => events.filter(event => String(getPointType(event) ?? '').toUpperCase() === String(type).toUpperCase() && isOpponent(event)).reduce((sum, ev) => sum + getPointsValue(ev), 0));

  const filteredPointTypes = pointTypes.filter((_, index) => teamPointsByType[index] > 0 || rivalPointsByType[index] > 0);
  const filteredTeamPointsByType = teamPointsByType.filter((count, index) => count > 0 || rivalPointsByType[index] > 0);
  const filteredRivalPointsByType = rivalPointsByType.filter((count, index) => count > 0 || teamPointsByType[index] > 0);

  const totalTeamPoints = filteredTeamPointsByType.reduce((a, b) => a + b, 0);
  const totalRivalPoints = filteredRivalPointsByType.reduce((a, b) => a + b, 0);

  const combinedData = [
    ...filteredTeamPointsByType,
    ...filteredRivalPointsByType
  ];
  const combinedColors = [
    ...filteredTeamPointsByType.map((_, index) => `rgba(${30 + index * 30}, ${144 + index * 10}, 255, 0.8)`),
    ...filteredRivalPointsByType.map((_, index) => `rgba(255, ${100 + index * 30}, ${100 + index * 30}, 0.8)`)
  ];

  const data = {
    labels: [
      ...filteredPointTypes.map((type, index) => filteredTeamPointsByType[index] > 0 ? type + ' (Our Team)' : null).filter(label => label !== null),
      ...filteredPointTypes.map((type, index) => filteredRivalPointsByType[index] > 0 ? type + ' (Opponent)' : null).filter(label => label !== null)
    ],
    datasets: [
      {
        data: [
          ...filteredPointTypes.map((type, index) => filteredTeamPointsByType[index] > 0 ? filteredTeamPointsByType[index] : null).filter(value => value !== null),
          ...filteredPointTypes.map((type, index) => filteredRivalPointsByType[index] > 0 ? filteredRivalPointsByType[index] : null).filter(value => value !== null)
        ],
        backgroundColor: combinedColors,
        hoverBackgroundColor: combinedColors,
      },
    ],
  };

  // Debug
  // eslint-disable-next-line no-console
  console.log('PointsTypeChart - pointTypes:', pointTypes, 'teamPointsByType:', teamPointsByType, 'rivalPointsByType:', rivalPointsByType);

  const handleChartClick = (event, elements) => {
    if (!elements || elements.length === 0) {
      console.warn('PointsTypeChart - click handler invoked with empty elements', { event, elements });
      return;
    }
    const el = elements[0];
    const chart = el.element?.$context?.chart ?? (elements[0].element && elements[0].element.$context && elements[0].element.$context.chart);
    if (!chart) {
      console.warn('PointsTypeChart - unable to extract chart from elements', elements[0]);
      return;
    }
    const label = chart.data.labels[el.index ?? el.element?.index ?? el.element?.$context?.dataIndex ?? el.element?.$context?.dataIndex];
    const type = label.includes(' (Our Team)') ? label.replace(' (Our Team)', '') : label.replace(' (Opponent)', '');      
    // Use the actual key used by the backend/extra_data to filter correctly
    onChartClick(event, elements, chart, "points_type", "points-tab", [{ descriptor: "TIPO-PUNTOS", value: type }]);
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    // aumentar cutout para reducir el radio exterior y que entre mejor en cajas pequeñas
    cutout: '65%',
    plugins: {
      legend: {
        display: true,
        position: 'top',
        onClick: (e, legendItem, legend) => {
          const index = legendItem.index;
          const chart = legend.chart;
          const meta = chart.getDatasetMeta(0);
          const start = index === 0 ? 0 : filteredTeamPointsByType.length;
          const end = index === 0 ? filteredTeamPointsByType.length : meta.data.length;
          for (let i = start; i < end; i++) {
            meta.data[i].hidden = !meta.data[i].hidden;
          }
          chart.update();
        },
        labels: {
          generateLabels: (chart) => {
            return [
              {
                text: 'Our Team',
                fillStyle: 'rgba(54, 162, 235, 1)',
                hidden: false,
                index: 0,
              },
              {
                text: 'Opponent',
                fillStyle: 'rgba(255, 99, 132, 1)',
                hidden: false,
                index: 1,
              },
            ];
            },
          },
          },
          title: {
          display: true,
          text: 'Points by Type',
          },
          tooltip: {
          callbacks: {
            label: (context) => {
            const label = context.label;
            const value = context.raw;
            const eventsCount = events.filter(event => {
              const type = label.includes(' (Our Team)') ? label.replace(' (Our Team)', '') : label.replace(' (Opponent)', '');
              return event.POINTS === type && ((label.includes(' (Our Team)') && event.TEAM !== 'OPPONENT') || (label.includes(' (Opponent)') && event.TEAM === 'OPPONENT'));
            }).length;
            return ` ${value} Points - (Events: ${eventsCount})`;
            },
          },
          },
          datalabels: {
          color: 'grey',
          formatter: (value, context) => {
          const meta = context.chart.getDatasetMeta(context.datasetIndex);
          const element = meta.data[context.dataIndex];
          const hidden = element ? element.hidden : false;
          return hidden || value === 0 ? '' : value;
        },
        font: {
          weight: 'bold',
        },
      },
    },
    onClick: handleChartClick,
  };

  return (
    <div className="relative w-full h-full max-w-full overflow-hidden flex items-center justify-center">
      <div className="w-full h-full max-h-52 sm:max-h-80 flex items-center justify-center">
        <Doughnut data={data} options={pieChartOptions as any} plugins={[ChartDataLabels]} style={{ maxHeight: '100%', maxWidth: '100%', height: '100%', width: '100%' }} />
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <span className="text-[1.25rem] text-[rgba(255,99,132,1)]">{totalRivalPoints}</span>
        <span className="text-[1.25rem] mx-1"> / </span>
        <span className="text-[1.25rem] text-[rgba(54,162,235,1)]">{totalTeamPoints}</span>
      </div>
    </div>
  );
};

export default PointsTypeChart;