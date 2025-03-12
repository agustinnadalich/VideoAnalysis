import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

const PlayerPointsChart = ({ events, onChartClick }) => {
  const [playerPointsChartData, setPlayerPointsChartData] = useState(null);

  useEffect(() => {
    const pointsEvents = events.filter(
      (event) => event.CATEGORY === "POINTS"
    );    

    const playerLabels = [
      ...new Set(pointsEvents.map((event) => event.PLAYER)),
    ].sort((a, b) => a - b);

    const data = {
      labels: playerLabels,
      datasets: [
        {
          label: "Puntos por jugador",
          data: playerLabels.map((player) => {
            const totalPoints = pointsEvents
              .filter((event) => event.PLAYER === player && event.TEAM !== "OPPONENT")
              .reduce((sum, event) => sum + event["POINTS(VALUE)"], 0);
            return totalPoints;
          }),
          backgroundColor: "rgba(75, 192, 192, 0.6)",

        },
      ],
    };

    setPlayerPointsChartData(data);
  }, [events]);

  const handleChartClick = (event, elements) => {
    const chart = elements[0].element.$context.chart;
    onChartClick(event, elements, chart, "player", "points-tab"); 
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
        color: 'grey',
        formatter: (value, context) => {
          const meta = context.chart.getDatasetMeta(context.datasetIndex);
          const hidden = meta.data[context.dataIndex].hidden;
          return hidden || value === 0 ? '' : value;
        },
        font: {
          weight: 'bold',
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
    maintainAspectRatio: false,
    onClick: handleChartClick,
  };

  return playerPointsChartData ? (
    <Bar data={playerPointsChartData} options={playerPointsChartOptions} />
  ) : null;
};

export default PlayerPointsChart;