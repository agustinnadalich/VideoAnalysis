import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

const MissedTacklesBarChart = ({ events, onChartClick }) => {
  const [missedTacklesBarChartData, setMissedTacklesBarChartData] = useState(null);

  useEffect(() => {
    const missedTackleEvents = events.filter(
      (event) => event.CATEGORY === "MISSED-TACKLE"
    );

    const playerLabels = [
      ...new Set(missedTackleEvents.map((event) => event.PLAYER)),
    ].sort((a, b) => a - b);

    const data = {
      labels: playerLabels,
      datasets: [
        {
          label: "Missed Tackles",
          data: playerLabels.map((player) => {
            const count = missedTackleEvents.filter(
              (event) => event.PLAYER === player  && event.TEAM !== "OPPONENT"
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
    const chart = elements[0].element.$context.chart;
    onChartClick(event, elements, chart, "player", "tackles-tab"); 
  };


  const missedTacklesBarChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Missed Tackles by Player',
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

  return missedTacklesBarChartData ? (
    <Bar data={missedTacklesBarChartData} options={missedTacklesBarChartOptions} />
  ) : null;
};

export default MissedTacklesBarChart;