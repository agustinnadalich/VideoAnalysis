import React from 'react';
import { Bar } from 'react-chartjs-2';

const TacklesBarChart = ({ events, onChartClick }) => {
  const tackleEvents = events.filter(
    (event) => event.CATEGORIA === "PLACCAGGIO"
  );

  const playerLabels = [
    ...new Set(tackleEvents.map((event) => event.JUGADOR)),
  ].sort((a, b) => a - b);

  const barChartData = {
    labels: playerLabels,
    datasets: [
      {
        label: "Tackles Negativos",
        data: playerLabels.map((player) => {
          const count = tackleEvents.filter(
            (event) =>
              event.JUGADOR === player && event.AVANCE === "NEGATIVO"
          ).length;
          return count;
        }),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
      {
        label: "Tackles Neutros",
        data: playerLabels.map((player) => {
          const count = tackleEvents.filter(
            (event) => event.JUGADOR === player && event.AVANCE === "NEUTRO"
          ).length;
          return count;
        }),
        backgroundColor: "rgba(201, 203, 207, 0.6)",
      },
      {
        label: "Tackles Positivos",
        data: playerLabels.map((player) => {
          const count = tackleEvents.filter(
            (event) =>
              event.JUGADOR === player && event.AVANCE === "POSITIVO"
          ).length;
          return count;
        }),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const handleChartClick = (event, elements) => {
    onChartClick(event, elements, "player");
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tackles por Jugador',
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

  return <Bar data={barChartData} options={barChartOptions} />;
};

export default TacklesBarChart;