import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

const PenaltiesTimeChart = ({ events, onChartClick }) => {
  const [penaltiesTimeChartData, setPenaltiesTimeChartData] = useState(null);

  useEffect(() => {
    const penaltiesEvents = events.filter(
      (event) => event.CATEGORY === "PENALTY"
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
          label: "Our Team",
          data: timeGroups.map(group => {
            const groupEvents = penaltiesEvents.filter(event => event.Time_Group === group && event.TEAM !== "OPPONENT");
            const totalPenalties = groupEvents.length;
            return totalPenalties;
          }),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
        {
          label: "Opponent",
          data: timeGroups.map(group => {
            const groupEvents = penaltiesEvents.filter(event => event.Time_Group === group && event.TEAM === "OPPONENT");
            const totalPenalties = groupEvents.length;
            return totalPenalties;
          }),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };

    setPenaltiesTimeChartData(data);
  }, [events]);

  const handleChartClick = (event, elements) => {
    onChartClick(event, elements, "time");
  };

  const penaltiesTimeChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Penalties by Game Time',
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

  return penaltiesTimeChartData ? (
    <Bar data={penaltiesTimeChartData} options={penaltiesTimeChartOptions} />
  ) : null;
};

export default PenaltiesTimeChart;