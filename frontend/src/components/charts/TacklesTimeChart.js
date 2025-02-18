import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

const TacklesTimeChart = ({ events, onChartClick }) => {
  const [tacklesTimeChartData, setTacklesTimeChartData] = useState(null);

  useEffect(() => {
    const pointsEvents = events.filter(
      (event) => event.CATEGORIA === "PLACCAGGIO"
    );

    const timeGroups = [
      "0'- 20'",
      "20' - 40'",
      "40' - 60'",
      "60' - 80'"
    ];

    const data = {
      labels: timeGroups,
      datasets: [
        {
          label: "Tackles por tiempo de juego (Equipo)",
          data: timeGroups.map(group => {
            const groupEvents = pointsEvents.filter(event => event.Grupo_Tiempo === group && event.EQUIPO !== "RIVAL");
            const totalTackles = groupEvents.length;
            return totalTackles;
          }),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
        {
          label: "Tackles por tiempo de juego (Rival)",
          data: timeGroups.map(group => {
            const groupEvents = pointsEvents.filter(event => event.Grupo_Tiempo === group && event.EQUIPO === "RIVAL");
            const totalTackles = groupEvents.length;
            return totalTackles;
          }),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };

    setTacklesTimeChartData(data);
  }, [events]);

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
  //       onChartClick(event, elements, "time", [{ descriptor: "Grupo_Tiempo", value: timeGroup }]);
  //     } else {
  //       console.error("Index out of bounds:", index);
  //     }
  //   }
  // };

  const handleChartClick = (event, elements) => {
    onChartClick(event, elements, "time");
  };

  const tacklesTimeChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Puntos por Tiempo de Juego',
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
        display: false,
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
    maintainAspectRatio: false,
    onClick: handleChartClick,
  };

  return tacklesTimeChartData ? (
    <Bar data={tacklesTimeChartData} options={tacklesTimeChartOptions} />
  ) : null;
};

export default TacklesTimeChart;