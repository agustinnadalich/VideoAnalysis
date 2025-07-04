import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

const TriesTimeChart = ({ events, onChartClick }) => {
  const [triesTimeChartData, setTriesTimeChartData] = useState(null);

  useEffect(() => {
    const triesEvents = events.filter(
      (event) => event.POINTS === "TRY"
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
          label: "Tries por tiempo de juego (Equipo)",
          data: timeGroups.map(group => {
            const groupEvents = triesEvents.filter(event => event.Time_Group === group && event.TEAM !== "OPPONENT");
            const totalTries = groupEvents.length;
            return totalTries;
            }),
            backgroundColor: "rgba(75, 192, 192, 0.6)",
          },
          {
            label: "Tries por tiempo de juego (Opponent)",
            data: timeGroups.map(group => {
            const groupEvents = triesEvents.filter(event => event.Time_Group === group && event.TEAM === "OPPONENT");
            const totalTries = groupEvents.length;
            return totalTries;
          }),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };

    setTriesTimeChartData(data);
  }, [events]);

  const handleChartClick = (event, elements) => {
    const chart = elements[0].element.$context.chart;
    onChartClick(event, elements, chart, "time", "tries-tab"); 
  };

  const triesTimeChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tries por Tiempo de Juego',
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

  return triesTimeChartData ? (
    <Bar data={triesTimeChartData} options={triesTimeChartOptions} />
  ) : null;
};

export default TriesTimeChart;