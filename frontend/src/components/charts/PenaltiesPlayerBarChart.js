import React from 'react';
import { Bar } from 'react-chartjs-2';

const PenaltiesPlayerBarChart = ({ events, onChartClick }) => {
  const players = [...new Set(events.map(event => event.PLAYER).filter(player => player !== null))];
  const penaltiesByPlayer = players.map(player => events.filter(event => event.PLAYER === player).length);

  const data = {
    labels: players,
    datasets: [
      {
        label: 'Penalties by Player',
        data: penaltiesByPlayer,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
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
        text: 'Penalties by Player',
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

  return <Bar data={data} options={barChartOptions} />;
};

export default PenaltiesPlayerBarChart;