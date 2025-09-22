import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TacklesTimeChart = ({ events, onChartClick }) => {
  const [tacklesTimeChartData, setTacklesTimeChartData] = useState(null);

  useEffect(() => {
    console.log("🎯 TacklesTimeChart - Received events:", events?.length || 0);
    console.log("🎯 TacklesTimeChart - Sample event:", events?.[0]);
    console.log("🎯 TacklesTimeChart - Event types in received events:", [...new Set(events?.map(e => e.event_type) || [])]);
    
    // Usar los eventos ya filtrados en lugar de hacer filtrado propio
    const pointsEvents = events.filter(
      (event) => event.event_type === "TACKLE" || event.CATEGORY === "TACKLE" || event.event_type === "MISSED-TACKLE"
    );
    
    console.log("🎯 TacklesTimeChart - Filtered events by type:", {
      successfulTackles: pointsEvents.filter(e => e.event_type === "TACKLE" || e.CATEGORY === "TACKLE").length,
      missedTackles: pointsEvents.filter(e => e.event_type === "MISSED-TACKLE").length
    });
    
    console.log("🎯 TacklesTimeChart - Filtered TACKLE events from filteredEvents:", pointsEvents.length);
    console.log("🎯 TacklesTimeChart - Sample TACKLE event:", pointsEvents?.[0]);

    const timeGroups = [
      "0'- 20'",
      "20' - 40'",
      "40' - 60'",
      "60' - 80'"
    ];

    // Función para determinar el grupo de tiempo basado en segundos
    const getTimeGroup = (seconds) => {
      if (seconds < 1200) return "0'- 20'";      // 0-20 minutos
      if (seconds < 2400) return "20' - 40'";    // 20-40 minutos
      if (seconds < 3600) return "40' - 60'";    // 40-60 minutos
      return "60' - 80'";                        // 60+ minutos
    };

    const data = {
      labels: timeGroups,
      datasets: [
      {
        label: "Tackles Exitosos",
        data: timeGroups.map(group => {
        const groupEvents = pointsEvents.filter(event => {
          const timeInSeconds = event.timestamp_sec || event.Game_Time || 0;
          const eventTimeGroup = getTimeGroup(timeInSeconds);
          return eventTimeGroup === group && (event.event_type === "TACKLE" || event.CATEGORY === "TACKLE");
        });
        const totalTackles = groupEvents.length;
        return totalTackles;
        }),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
      },
      {
        label: "Tackles Errados",
        data: timeGroups.map(group => {
        const groupEvents = pointsEvents.filter(event => {
          const timeInSeconds = event.timestamp_sec || event.Game_Time || 0;
          const eventTimeGroup = getTimeGroup(timeInSeconds);
          return eventTimeGroup === group && event.event_type === "MISSED-TACKLE";
        });
        const totalTackles = groupEvents.length;
        return totalTackles;
        }),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
      },
      ],
    };

    console.log("🎯 TacklesTimeChart - Final data:", data);
    console.log("🎯 TacklesTimeChart - Data labels:", data.labels);
    console.log("🎯 TacklesTimeChart - Data values:", data.datasets[0].data);
    setTacklesTimeChartData(data);
  }, [events]);

  console.log("🎯 TacklesTimeChart - Rendering with data:", {
    tacklesTimeChartData,
    hasData: !!tacklesTimeChartData,
    dataLength: tacklesTimeChartData?.datasets?.[0]?.data?.length || 0
  });

  // const handleChartClick = (event, elements) => {
  //   if (elements.length > 0) {
  //     const index = elements[0].index;
  //     const timeGroups = [
  //       "0'- 20'",
  //       "20' - 40'",
  //       "40' - 60'",
  //       "60' - 80'"
  //     ];
  //     if (index >= 0 && index < timeGroups.length) {
  //       const timeGroup = timeGroups[index];
  //       onChartClick(event, elements, "time", [{ descriptor: "Time_Group", value: timeGroup }]);
  //     } else {
  //       console.error("Index out of bounds:", index);
  //     }
  //   }
  // };

  // const handleChartClick = (event, elements) => {
  //   onChartClick(event, elements, "time");
  // };


  const handleChartClick = (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const timeGroups = [
          "0'- 20'",
          "20' - 40'",
          "40' - 60'",
          "60' - 80'"
        ];
        if (index >= 0 && index < timeGroups.length) {
          const timeGroupValue = timeGroups[index];
          onChartClick("time", timeGroupValue, "Quarter_Group"); 
        }
      }
  };

  const tacklesTimeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Tackles por Tiempo de Juego',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label;
            const value = context.raw;
            return `${label}: ${value}`;
          },
        },
      },
      datalabels: {
        color: 'grey',
        formatter: (value, context) => {
          const meta = context.chart.getDatasetMeta(context.datasetIndex);
          const hidden = meta.data[context.dataIndex].hidden;
          return hidden || value === 0 ? '' : value;
        },
        font: {
          weight: 700,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
    onClick: handleChartClick,
  };

  return tacklesTimeChartData ? (
    <Bar data={tacklesTimeChartData} options={tacklesTimeChartOptions} />
  ) : null;
};

export default TacklesTimeChart;