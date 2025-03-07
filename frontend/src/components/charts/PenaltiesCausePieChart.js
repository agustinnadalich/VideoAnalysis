import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

const PenaltiesCausePieChart = ({ events, onChartClick }) => {
  const causes = [...new Set(events.map(event => event.INFRACTION_TYPE))];  
  
  const teamPenaltiesByCause = causes.map(cause => events.filter(event => event.INFRACTION_TYPE === cause && event.TEAM !== 'OPPONENT').length);
  const rivalPenaltiesByCause = causes.map(cause => events.filter(event => event.INFRACTION_TYPE === cause && event.TEAM === 'OPPONENT').length);

  // Filtrar causas con al menos un evento
  const filteredCauses = causes.filter((_, index) => teamPenaltiesByCause[index] > 0 || rivalPenaltiesByCause[index] > 0);
  const filteredTeamPenaltiesByCause = teamPenaltiesByCause.filter((count, index) => count > 0 || rivalPenaltiesByCause[index] > 0);
  const filteredRivalPenaltiesByCause = rivalPenaltiesByCause.filter((count, index) => count > 0 || teamPenaltiesByCause[index] > 0);

  const totalTeamPenalties = filteredTeamPenaltiesByCause.reduce((a, b) => a + b, 0);
  const totalRivalPenalties = filteredRivalPenaltiesByCause.reduce((a, b) => a + b, 0);

  // Crear datos y colores combinados asegurando que los datos y colores estén alineados correctamente
  const combinedData = [
    ...filteredTeamPenaltiesByCause.map((count, index) => count > 0 ? count : null).filter(count => count !== null),
    ...filteredRivalPenaltiesByCause.map((count, index) => count > 0 ? count : null).filter(count => count !== null)
  ];
  const combinedColors = [
    ...filteredTeamPenaltiesByCause.map((count, index) => count > 0 ? `rgba(255, ${100 + index * 30}, ${100 + index * 30}, 0.8)` : null).filter(color => color !== null),
    ...filteredRivalPenaltiesByCause.map((count, index) => count > 0 ? `rgba(${30 + index * 30}, ${144 + index * 10}, 255, 0.8)` : null).filter(color => color !== null)
  ];

  const data = {
    labels: [
      ...filteredCauses.map((cause, index) => filteredTeamPenaltiesByCause[index] > 0 ? cause + ' (Our Team)' : null).filter(label => label !== null),
      ...filteredCauses.map((cause, index) => filteredRivalPenaltiesByCause[index] > 0 ? cause + ' (Opponent)' : null).filter(label => label !== null)
    ],
    datasets: [
      {
        data: combinedData,
        backgroundColor: combinedColors,
        hoverBackgroundColor: combinedColors,
      },
    ],
  };

  // const handleChartClick = (event, elements) => {
  //   if (elements.length > 0) {
  //     const index = elements[0].index;
  //     const causeIndex = index % filteredCauses.length;
  //     const cause = filteredCauses[causeIndex];
  //     const team = index < filteredCauses.length ? 'Our Team' : 'Opponent';
  //     onChartClick(event, elements, "penalty_cause", [{ descriptor: "INFRACTION_TYPE", value: cause }]);
  //   }
  // };

  const handleChartClick = (event, elements) => {
    onChartClick(event, elements, "penalty_cause");
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%', // Agrandar el anillo
    plugins: {
      legend: {
        display: true,
        position: 'top',
        onClick: (e, legendItem, legend) => {
          const index = legendItem.index;
          const chart = legend.chart;
          const meta = chart.getDatasetMeta(0);
          const start = index === 0 ? 0 : filteredTeamPenaltiesByCause.length;
          const end = index === 0 ? filteredTeamPenaltiesByCause.length : meta.data.length;
          for (let i = start; i < end; i++) {
            meta.data[i].hidden = !meta.data[i].hidden;
          }
          chart.update();
        },
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
        formatter: (value, context) => {
          const meta = context.chart.getDatasetMeta(context.datasetIndex);
          const element = meta.data[context.dataIndex];
          const hidden = element ? element.hidden : false;
          return hidden || value === 0 ? '' : value;
        },
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