import React from 'react';
import { Pie } from 'react-chartjs-2';

const TacklesEffectivityChart = ({ events, team, onChartClick }) => {
  const teamEvents = team === "OPPONENT" 
    ? events.filter(event => event.TEAM === "OPPONENT")
    : events.filter(event => event.TEAM !== "OPPONENT");

  const successfulTackles = teamEvents.filter(event => event.CATEGORY === "TACKLE").length; 
  const missedTackles = teamEvents.filter(event => event.CATEGORY === "MISSED-TACKLE").length;
  const totalAttempts = successfulTackles + missedTackles;
  const effectiveness = totalAttempts > 0 ? (successfulTackles / totalAttempts) * 100 : 0;

  const data = {
    labels: ['Successful Tackles', 'Missed Tackles'],
    datasets: [
      {
        data: [successfulTackles, missedTackles],
        backgroundColor: ['#36A2EB', '#FF6384'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384'],
      },
    ],
  };

  const handleChartClick = (event, elements) => {
    if (elements.length > 0) {
      const chart = elements[0].element.$context.chart;
      const label = chart.data.labels[elements[0].index];
      const category = label === 'Successful Tackles' ? 'TACKLE' : 'MISSED-TACKLE';
      onChartClick(event, elements, chart, category, "tackles-tab", [{ descriptor: "CATEGORY", value: category }]);
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: `${team} Tackles Effectivity`,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label;
            const value = context.raw;
            return `${label}: ${value}`;
          },
        },
      },
    },
    onClick: handleChartClick,
  };

  return (
    <div>
      <h3>{team} Tackles Effectivity: {effectiveness.toFixed(2)}%</h3>
      <Pie data={data} options={pieChartOptions} style={{ maxHeight: '600px' }}/>
    </div>
  );
};

export default TacklesEffectivityChart;