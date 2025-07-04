import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

const PointsTypeChart = ({ events, onChartClick }) => {
  const pointTypes = [...new Set(events.map(event => event.POINTS))];

  const teamPointsByType = pointTypes.map(type => events.filter(event => event.POINTS === type && event.TEAM !== 'OPPONENT').length);
  const rivalPointsByType = pointTypes.map(type => events.filter(event => event.POINTS === type && event.TEAM === 'OPPONENT').length);

  const filteredPointTypes = pointTypes.filter((_, index) => teamPointsByType[index] > 0 || rivalPointsByType[index] > 0);
  const filteredTeamPointsByType = teamPointsByType.filter((count, index) => count > 0 || rivalPointsByType[index] > 0);
  const filteredRivalPointsByType = rivalPointsByType.filter((count, index) => count > 0 || teamPointsByType[index] > 0);

  const totalTeamPoints = filteredTeamPointsByType.reduce((a, b) => a + b, 0);
  const totalRivalPoints = filteredRivalPointsByType.reduce((a, b) => a + b, 0);

  const combinedData = [
    ...filteredTeamPointsByType.map((count, index) => count > 0 ? count : null).filter(count => count !== null),
    ...filteredRivalPointsByType.map((count, index) => count > 0 ? count : null).filter(count => count !== null)
  ];
  const combinedColors = [
    ...filteredTeamPointsByType.map((count, index) => count > 0 ? `rgba(${30 + index * 30}, ${144 + index * 10}, 255, 0.8)` : null).filter(color => color !== null),
    ...filteredRivalPointsByType.map((count, index) => count > 0 ? `rgba(255, ${100 + index * 30}, ${100 + index * 30}, 0.8)` : null).filter(color => color !== null)
  ];

  const data = {
    labels: [
      ...filteredPointTypes.map((type, index) => filteredTeamPointsByType[index] > 0 ? type + ' (Our Team)' : null).filter(label => label !== null),
      ...filteredPointTypes.map((type, index) => filteredRivalPointsByType[index] > 0 ? type + ' (Opponent)' : null).filter(label => label !== null)
    ],
    datasets: [
      {
        data: [
          ...filteredPointTypes.map((type, index) => filteredTeamPointsByType[index] > 0 ? events.filter(event => event.POINTS === type && event.TEAM !== 'OPPONENT').reduce((sum, event) => sum + event["POINTS(VALUE)"], 0) : null).filter(value => value !== null),
          ...filteredPointTypes.map((type, index) => filteredRivalPointsByType[index] > 0 ? events.filter(event => event.POINTS === type && event.TEAM === 'OPPONENT').reduce((sum, event) => sum + event["POINTS(VALUE)"], 0) : null).filter(value => value !== null)
        ],
        backgroundColor: combinedColors,
        hoverBackgroundColor: combinedColors,
      },
    ],
  };

  const handleChartClick = (event, elements) => {
    if (elements.length > 0) {
      const chart = elements[0].element.$context.chart;
      const label = chart.data.labels[elements[0].index];
      const type = label.includes(' (Our Team)') ? label.replace(' (Our Team)', '') : label.replace(' (Opponent)', '');      
      onChartClick(event, elements, chart, "points_type", "points-tab", [{ descriptor: "POINTS", value: type }]);
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%',
    plugins: {
      legend: {
        display: true,
        position: 'top',
        onClick: (e, legendItem, legend) => {
          const index = legendItem.index;
          const chart = legend.chart;
          const meta = chart.getDatasetMeta(0);
          const start = index === 0 ? 0 : filteredTeamPointsByType.length;
          const end = index === 0 ? filteredTeamPointsByType.length : meta.data.length;
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
                fillStyle: 'rgba(54, 162, 235, 1)',
                hidden: false,
                index: 0,
              },
              {
                text: 'Opponent',
                fillStyle: 'rgba(255, 99, 132, 1)',
                hidden: false,
                index: 1,
              },
            ];
            },
          },
          },
          title: {
          display: true,
          text: 'Points by Type',
          },
          tooltip: {
          callbacks: {
            label: (context) => {
            const label = context.label;
            const value = context.raw;
            const eventsCount = events.filter(event => {
              const type = label.includes(' (Our Team)') ? label.replace(' (Our Team)', '') : label.replace(' (Opponent)', '');
              return event.POINTS === type && ((label.includes(' (Our Team)') && event.TEAM !== 'OPPONENT') || (label.includes(' (Opponent)') && event.TEAM === 'OPPONENT'));
            }).length;
            return ` ${value} Points - (Events: ${eventsCount})`;
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
        <span style={{ color: 'rgba(255, 99, 132, 1)', fontSize: '1.5em' }}>{totalRivalPoints}</span>
        <span style={{ fontSize: '1.5em' }}> / </span>
        <span style={{ color: 'rgba(54, 162, 235, 1)', fontSize: '1.5em' }}>{totalTeamPoints}</span> 
      </div>
    </div>
  );
};

export default PointsTypeChart;