import React from 'react';
import { Bar } from 'react-chartjs-2';

const TacklesByTeamChart = ({ events, onChartClick }) => {

const TacklesByTeamChart = ({ events, onChartClick }) => {
  // Filtrar eventos de tackles
  const tackleEvents = events.filter((event) => 
    event.CATEGORY === "TACKLE" || event.event_type === "TACKLE"
  );

  // Contar tackles por equipo
  const ourTeamTackles = tackleEvents.filter(event => event.TEAM !== "OPPONENT").length;
  const opponentTackles = tackleEvents.filter(event => event.TEAM === "OPPONENT").length;

  const data = {
    labels: ['Nuestro Equipo', 'Rival'],
    datasets: [
      {
        label: 'Tackles por Equipo',
        data: [ourTeamTackles, opponentTackles],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const handleChartClick = (event, elements) => {
    if (elements.length > 0 && onChartClick) {
      const chart = elements[0].element.$context.chart;
      const index = elements[0].index;
      const teamName = index === 0 ? 'OUR_TEAM' : 'OPPONENT';
      onChartClick(event, elements, chart, 'team_tackles', 'tackles-tab');
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tackles por Equipo',
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
        formatter: (value) => value > 0 ? value : '',
        font: {
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    onClick: handleChartClick,
  };

  return (
    <div className="w-full">
      <Bar data={data} options={options} height={300} />
    </div>
  );
};

export default TacklesByTeamChart;
