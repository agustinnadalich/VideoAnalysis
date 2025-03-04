import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

const PointsTimeChart = ({ events, onChartClick }) => {
  const [pointsTimeChartData, setPointsTimeChartData] = useState(null);

  useEffect(() => {
    const pointsEvents = events.filter(
      (event) => event.CATEGORY === "POINTS"
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
          label: "Puntos por tiempo de juego (Equipo)",
          data: timeGroups.map(group => {
            const groupEvents = pointsEvents.filter(event => event.Time_Group === group && event.TEAM !== "OPPONENT");
            const totalPoints = groupEvents.reduce((sum, event) => sum + event["POINTS(VALUE)"], 0);
            return totalPoints;
          }),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
        {
          label: "Puntos por tiempo de juego (Opponent)",
          data: timeGroups.map(group => {
            const groupEvents = pointsEvents.filter(event => event.Time_Group === group && event.TEAM === "OPPONENT");
            const totalPoints = groupEvents.reduce((sum, event) => sum + event["POINTS(VALUE)"], 0);
            return totalPoints;
          }),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };

    setPointsTimeChartData(data);
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
  //       onChartClick(event, elements, "time", [{ descriptor: "Time_Group", value: timeGroup }]);
  //     } else {
  //       console.error("Index out of bounds:", index);
  //     }
  //   }
  // };

  const handleChartClick = (event, elements) => {
    onChartClick(event, elements, "time");
  };

  const pointsTimeChartOptions = {
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

  return pointsTimeChartData ? (
    <Bar data={pointsTimeChartData} options={pointsTimeChartOptions} />
  ) : null;
};

export default PointsTimeChart;