import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

const TurnoversTimeChart = ({ events, onChartClick }) => {
  const [turnoversTimeChartData, setTurnoversTimeChartData] = useState(null);

  useEffect(() => {
    const turnoversEvents = events.filter(
      (event) => event.CATEGORY === "TURNOVER+" || event.CATEGORY === "TURNOVER-"
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
          label: "Turnovers by Game Time (Our Team)",
          data: timeGroups.map(group => {
            const groupEvents = turnoversEvents.filter(event => event.Time_Group === group && event.CATEGORY === "TURNOVER+");
            const totalTurnovers = groupEvents.length;
            return totalTurnovers;
          }),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
        {
          label: "Turnovers by Game Time (Opponent)",
          data: timeGroups.map(group => {
            const groupEvents = turnoversEvents.filter(event => event.Time_Group === group && event.CATEGORY === "TURNOVER-");
            const totalTurnovers = groupEvents.length;
            return totalTurnovers;
          }),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };

    setTurnoversTimeChartData(data);
  }, [events]);

  const handleChartClick = (event, elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const timeGroup = [
        "0'- 20'",
        "20' - 40'",
        "40' - 60'",
        "60' - 80'"
      ][index];
      onChartClick(event, elements, "time", [{ descriptor: "Time_Group", value: timeGroup }]);
    }
  };

  const turnoversTimeChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Turnovers by Game Time',
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

  return turnoversTimeChartData ? (
    <Bar data={turnoversTimeChartData} options={turnoversTimeChartOptions} />
  ) : null;
};

export default TurnoversTimeChart;