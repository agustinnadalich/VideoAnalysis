import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

const PlayerPointsChart = ({ events, onChartClick }) => {
  const [playerPointsChartData, setPlayerPointsChartData] = useState(null);

  useEffect(() => {
    const pointsEvents = events.filter(
      (event) => event.CATEGORIA === "PUNTI"
    );    

    const playerLabels = [
      ...new Set(pointsEvents.map((event) => event.JUGADOR)),
    ].sort((a, b) => a - b);

    const data = {
      labels: playerLabels,
      datasets: [
        {
          label: "Puntos por jugador",
          data: playerLabels.map((player) => {
            const totalPoints = pointsEvents
              .filter((event) => event.JUGADOR === player && event.EQUIPO !== "RIVAL")
              .reduce((sum, event) => sum + event["PUNTOS (VALOR)"], 0);
            return totalPoints;
          }),
          backgroundColor: "rgba(75, 192, 192, 0.6)",

        },
      ],
    };

    setPlayerPointsChartData(data);
  }, [events]);

  const handleChartClick = (event, elements) => {
    onChartClick(event, elements, "player");
  };


  const playerPointsChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Puntos por Jugador',
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

  return playerPointsChartData ? (
    <Bar data={playerPointsChartData} options={playerPointsChartOptions} />
  ) : null;
};

export default PlayerPointsChart;