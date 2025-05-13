import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

const TriesPlayerChart = ({ events, onChartClick }) => {
  const [triesPlayerChartData, setTriesPlayerChartData] = useState(null);

  useEffect(() => {
    const triesEvents = events.filter(
      (event) => event.POINTS === "TRY"
    );

    const playerLabels = [
      ...new Set(triesEvents.map((event) => event.PLAYER).filter(player => player && player !== 'none')),
    ].sort((a, b) => a - b);

    const data = {
      labels: playerLabels,
      datasets: [
      {
      label: "Tries por jugador",
      data: playerLabels.map((player) => {
      const totalTries = triesEvents
        .filter((event) => event.PLAYER === player && event.TEAM !== "OPPONENT")
        .length;
      return totalTries;
      }),
      backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
      ],
    };

    setTriesPlayerChartData(data);
  }, [events]);

  const handleChartClick = (event, elements) => {
    const chart = elements[0].element.$context.chart;
    onChartClick(event, elements, chart, "player", "tries-tab"); 
  };

  const triesPlayerChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tries por Jugador',
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

  return triesPlayerChartData ? (
    <Bar data={triesPlayerChartData} options={triesPlayerChartOptions} style={{minHeight: '300px' }} />
  ) : null;
};

export default TriesPlayerChart;