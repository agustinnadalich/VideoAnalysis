import { Colors } from 'chart.js';
import React from 'react';
import { Bar } from 'react-chartjs-2';

const TacklesBarChart = ({ events, onChartClick }) => {
  const tackleEvents = events.filter((event) => event.CATEGORY === "TACKLE");

  // Extrae todos los jugadores únicos, manejando arrays en PLAYER
  const playerLabels = [
    ...new Set(
      tackleEvents.flatMap((event) =>
        Array.isArray(event.PLAYER) ? event.PLAYER : [event.PLAYER]
      )
    ),
  ].sort();

  const barChartData = {
    labels: playerLabels,
    datasets: [
      {
        label: "Negative Tackles",
        data: playerLabels.map((player) =>
          tackleEvents.filter(
            (event) =>
              (Array.isArray(event.PLAYER)
                ? event.PLAYER.includes(player)
                : event.PLAYER === player) && event.ADVANCE === "NEGATIVE"
          ).length
        ),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
      {
        label: "Neutral Tackles",
        data: playerLabels.map((player) =>
          tackleEvents.filter(
            (event) =>
              (Array.isArray(event.PLAYER)
                ? event.PLAYER.includes(player)
                : event.PLAYER === player) && event.ADVANCE === "NEUTRAL"
          ).length
        ),
        backgroundColor: "rgba(201, 203, 207, 0.6)",
      },
      {
        label: "Positive Tackles",
        data: playerLabels.map((player) =>
          tackleEvents.filter(
            (event) =>
              (Array.isArray(event.PLAYER)
                ? event.PLAYER.includes(player)
                : event.PLAYER === player) && event.ADVANCE === "POSITIVE"
          ).length
        ),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const handleChartClick = (event, elements) => {
    const chart = elements[0].element.$context.chart;
    onChartClick(event, elements, chart, "player", "tackles-tab");
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Tackles by player",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label;
            const value = context.raw;
            return value > 0 ? `${label}: ${value}` : null; // Oculta etiquetas con valor 0
          },
        },
      },
      datalabels: {
        formatter: (val) => (val > 0 ? val : '')
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