import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

const MissedTacklesBarChart = ({ events, onChartClick }) => {
  const [missedTacklesBarChartData, setMissedTacklesBarChartData] = useState(null);

  useEffect(() => {
    const missedTackleEvents = events.filter(
      (event) => event.CATEGORÍA === "PLAC-SBAGLIATTO"
    );

    const playerLabels = [
      ...new Set(missedTackleEvents.map((event) => event.JUGADOR)),
    ].sort((a, b) => a - b);

    const data = {
      labels: playerLabels,
      datasets: [
        {
          label: "Tackles Errados",
          data: playerLabels.map((player) => {
            const count = missedTackleEvents.filter(
              (event) => event.JUGADOR === player  && event.EQUIPO !== "RIVAL"
            ).length;
            return count;
          }),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };

    setMissedTacklesBarChartData(data);
  }, [events]);

  const handleChartClick = (event, elements) => {
    onChartClick(event, elements, "bar");
  };


  const missedTacklesBarChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tackles Errados por Jugador',
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

  return missedTacklesBarChartData ? (
    <Bar data={missedTacklesBarChartData} options={missedTacklesBarChartOptions} />
  ) : null;
};

export default MissedTacklesBarChart;