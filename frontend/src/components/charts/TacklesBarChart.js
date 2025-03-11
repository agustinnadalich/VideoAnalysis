import React from 'react';
import { Bar } from 'react-chartjs-2';

const TacklesBarChart = ({ events, onChartClick }) => {
  const tackleEvents = events.filter(
    (event) => event.CATEGORY === "TACKLE"
  );

  const playerLabels = [
    ...new Set(tackleEvents.map((event) => event.PLAYER)),
  ].sort((a, b) => a - b);

  const barChartData = {
    labels: playerLabels,
    datasets: [
      {
        label: "Negative Tackles ",
        data: playerLabels.map((player) => {
          const count = tackleEvents.filter(
            (event) =>
              event.PLAYER === player && event.ADVANCE === "NEGATIVE"
          ).length;
          return count;
        }),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
      {
        label: "Neutral Tackles",
        data: playerLabels.map((player) => {
          const count = tackleEvents.filter(
            (event) => event.PLAYER === player && event.ADVANCE === "NEUTRAL"
          ).length;
          return count;
        }),
        backgroundColor: "rgba(201, 203, 207, 0.6)",
      },
      {
        label: "Positive Tackles ",
        data: playerLabels.map((player) => {
          const count = tackleEvents.filter(
            (event) =>
              event.PLAYER === player && event.ADVANCE === "POSITIVE"
          ).length;
          return count;
        }),
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
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tackles by player',
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
          const dataElement = meta.data[context.dataIndex];
          const hidden = dataElement ? dataElement.hidden : false;
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

  return <Bar data={barChartData} options={barChartOptions} />;
};

export default TacklesBarChart;