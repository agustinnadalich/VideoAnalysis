import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

const PenaltiesCausePieChart = ({ events, onChartClick }) => {
  const causes = [...new Set(events.map(event => event.INFRACTION_TYPE))];
  console.log(causes);
  
  
  const teamPenaltiesByCause = causes.map(cause => events.filter(event => event.INFRACTION_TYPE === cause && event.TEAM !== 'OPPONENT').length);
  const rivalPenaltiesByCause = causes.map(cause => events.filter(event => event.INFRACTION_TYPE === cause && event.TEAM === 'OPPONENT').length);

  // Filtrar causas con al menos un evento
  const filteredCauses = causes.filter((_, index) => teamPenaltiesByCause[index] > 0 || rivalPenaltiesByCause[index] > 0);
  const filteredTeamPenaltiesByCause = teamPenaltiesByCause.filter((count, index) => count > 0 || rivalPenaltiesByCause[index] > 0);
  const filteredRivalPenaltiesByCause = rivalPenaltiesByCause.filter((count, index) => count > 0 || teamPenaltiesByCause[index] > 0);

  const totalTeamPenalties = filteredTeamPenaltiesByCause.reduce((a, b) => a + b, 0);
  const totalRivalPenalties = filteredRivalPenaltiesByCause.reduce((a, b) => a + b, 0);

  // Crear datos y colores combinados asegurando que los datos y colores estén alineados correctamente
  const combinedData = [...filteredTeamPenaltiesByCause, ...filteredRivalPenaltiesByCause];
  const combinedColors = [
    ...filteredTeamPenaltiesByCause.map((_, index) => `rgba(255, ${100 + index * 30}, ${100 + index * 30}, 0.8)`),
    ...filteredRivalPenaltiesByCause.map((_, index) => `rgba(${30 + index * 30}, ${144 + index * 10}, 255, 0.8)`)
  ];

  const data = {
    labels: [...filteredCauses.map(cause => cause + ' (Our Team)'), ...filteredCauses.map(cause => cause + ' (Opponent)')],
    datasets: [
      {
        data: combinedData,
        backgroundColor: combinedColors,
        hoverBackgroundColor: combinedColors,
      },
    ],
  };

  const handleChartClick = (event, elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const causeIndex = index % filteredCauses.length;
      const cause = filteredCauses[causeIndex];
      const team = index < filteredCauses.length ? 'Our Team' : 'Opponent';
      onChartClick(event, elements, "penalty_cause", [{ descriptor: "INFRACTION_TYPE", value: cause }]);
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%', // Agrandar el anillo
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          generateLabels: (chart) => {
            return [
              {
                text: 'Our Team',
                fillStyle: 'rgba(255, 99, 132, 1)',
                hidden: false,
                index: 0,
              },
              {
                text: 'Opponent',
                fillStyle: 'rgba(54, 162, 235, 1)',
                hidden: false,
                index: 1,
              },
            ];
          },
        },
      },
      title: {
        display: true,
        text: 'Penalties by Cause',
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
      datalabels: {
        color: 'grey',
        formatter: (value) => value > 0 ? value : '',
        font: {
          weight: 'bold',
        },
      },
    },
    onClick: handleChartClick,
  };

  return (
    <div style={{ position: 'relative', minHeight: '500px' }}>
      <Doughnut data={data} options={pieChartOptions} plugins={[ChartDataLabels]} />
      <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <span style={{ color: 'rgba(54, 162, 235, 1)', fontSize: '1.5em' }}>{totalRivalPenalties}</span>
        <span style={{ fontSize: '1.5em' }}> / </span>
        <span style={{ color: 'rgba(255, 99, 132, 1)', fontSize: '1.5em' }}>{totalTeamPenalties}</span> 
      </div>
    </div>
  );
};

export default PenaltiesCausePieChart;