import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

const TriesTimeChart = ({ events, onChartClick }) => {
  const [triesTimeChartData, setTriesTimeChartData] = useState(null);

  useEffect(() => {
    
    const getPointType = (event: any) => {
      if (!event) return '';
      if (event.POINTS) return String(event.POINTS).toUpperCase();
      const ed = event.extra_data || {};
      const candidates = [ed['TIPO-PUNTOS'], ed['TIPO_PUNTOS'], ed['tipo_puntos'], ed['TIPO-PUNTO'], ed['TIPO'], ed['type_of_points'], ed['type']];
      for (const c of candidates) {
        if (c !== undefined && c !== null) {
          const s = String(c).trim();
          if (s.length > 0) return s.toUpperCase();
        }
      }
      return '';
    };

    const triesEvents = events.filter((event) => {
      const pt = getPointType(event);
      return pt && pt.includes('TRY');
    });

    // Usar Time_Group real o mapear a grupos estándar
    const getTimeGroup = (event: any) => {
      // Preferir Time_Group de extra_data
      const timeGroup = event.extra_data?.Time_Group || event.Time_Group;
      if (timeGroup) return timeGroup;
      
      // Fallback a cálculo manual
      const gameTime = event.Game_Time || event.game_time;
      if (!gameTime) return "Sin tiempo";
      
      const [minutes] = gameTime.split(':').map(Number);
      if (minutes < 20) return "Primer cuarto";
      if (minutes < 40) return "Segundo cuarto"; 
      if (minutes < 60) return "Tercer cuarto";
      return "Cuarto cuarto";
    };

    // Obtener grupos únicos de los datos reales
  const uniqueGroups = [...new Set(triesEvents.map(getTimeGroup))].sort();

    const data = {
      labels: uniqueGroups,
      datasets: [
        {
          label: "Tries por tiempo de juego (Equipo)",
          data: uniqueGroups.map(group => {
            const groupEvents = triesEvents.filter(event => {
              const eventGroup = getTimeGroup(event);
              const team = event.team || event.TEAM || event.extra_data?.EQUIPO;
              return eventGroup === group && team !== "OPPONENT" && team !== "RIVAL";
            });
            
            return groupEvents.length;
            }),
            backgroundColor: "rgba(75, 192, 192, 0.6)",
          },
          {
            label: "Tries por tiempo de juego (Opponent)",
            data: uniqueGroups.map(group => {
            const groupEvents = triesEvents.filter(event => {
              const eventGroup = getTimeGroup(event);
              const team = event.team || event.TEAM || event.extra_data?.EQUIPO;
              return eventGroup === group && (team === "OPPONENT" || team === "RIVAL");
            });
            
            return groupEvents.length;
          }),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };

    setTriesTimeChartData(data);
  }, [events]);

  const handleChartClick = (event, elements) => {
    if (!elements || elements.length === 0) return;
    const chart = elements[0].element.$context.chart;
    // Determine which label was clicked
    const datasetIndex = elements[0].datasetIndex;
    const index = elements[0].index;
    const label = triesTimeChartData?.labels?.[index];
    

    // Emit a normalized Time_Group descriptor so ChartsTabs can toggle filters
    const additionalFilters = label ? [{ descriptor: 'Time_Group', value: label }] : [];

    onChartClick(event, elements, chart, 'time', 'tries-tab', additionalFilters);
  };

  const triesTimeChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Tries por Tiempo de Juego',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label;
            const value = context.raw;
            return `${label}: ${value}`;
          },
        },
      },
      datalabels: {
        color: 'grey',
        formatter: (value: any, context: any) => {
          try {
            const meta = context?.chart?.getDatasetMeta(context.datasetIndex);
            if (!meta || !meta.data) return '';
            const point = meta.data[context.dataIndex];
            const hidden = point?.hidden;
            return hidden || value === 0 ? '' : value;
          } catch (e) {
            return '';
          }
        },
        font: {
          weight: 700 as const,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { maxRotation: 0, autoSkip: true },
      },
      y: {
        stacked: true,
      },
    },
    maintainAspectRatio: false,
    onClick: handleChartClick,
  };

  // Container para controlar la altura y evitar que el chart colapse con otros elementos
  const containerStyle: React.CSSProperties = { minHeight: '260px', maxHeight: '420px' };

  return triesTimeChartData ? (
    <div style={containerStyle}>
      <Bar data={triesTimeChartData} options={triesTimeChartOptions as any} />
    </div>
  ) : null;
};

export default TriesTimeChart;