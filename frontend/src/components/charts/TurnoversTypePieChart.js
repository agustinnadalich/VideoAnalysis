import React from 'react';
import { Pie } from 'react-chartjs-2';

const TurnoversTypePieChart = ({ events, onChartClick }) => {
  const recoveries = events.filter(event => event.CATEGORY === 'TURNOVER+');
  const losses = events.filter(event => event.CATEGORY === 'TURNOVER-');

  const recoveryTypes = [...new Set(recoveries.map(event => event.TURNOVER_TYPE).filter(type => type !== null))];
  const lossTypes = [...new Set(losses.map(event => event.TURNOVER_TYPE).filter(type => type !== null))];

  const turnoversByRecoveryType = recoveryTypes.map(type => recoveries.filter(event => event.TURNOVER_TYPE === type).length);
  const turnoversByLossType = lossTypes.map(type => losses.filter(event => event.TURNOVER_TYPE === type).length);

  const dataRecoveries = {
    labels: recoveryTypes,
    datasets: [
        {
            data: turnoversByRecoveryType,
            backgroundColor: ['#1E90FF', '#00BFFF', '#87CEFA', '#4682B4', '#5F9EA0'],
            hoverBackgroundColor: ['#1E90FF', '#00BFFF', '#87CEFA', '#4682B4', '#5F9EA0'],
        },
    ],
  };

  const dataLosses = {
    labels: lossTypes,
    datasets: [
        {
            data: turnoversByLossType,
            backgroundColor: ['#FF4500', '#FF6347', '#FF7F50', '#FF8C00', '#FFA07A'],
            hoverBackgroundColor: ['#FF4500', '#FF6347', '#FF7F50', '#FF8C00', '#FFA07A'],
        },
    ],
  };

  const handleChartClick = (event, elements, chartType) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const type = chartType === 'recoveries' ? recoveryTypes[index] : lossTypes[index];
      onChartClick(event, elements, "turnover_type", [{ descriptor: "TURNOVER_TYPE", value: type }]);
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: (context) => context.chart.config.type === 'recoveries' ? 'Recoveries by Type' : 'Losses by Type',
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
            display: false,
        },
    },
  };

  return (
    <div>
        {recoveryTypes.length > 0 && (
            <>
                <div style={{ height: '300px' }}>
                    <Pie data={dataRecoveries} options={{ ...pieChartOptions, onClick: (event, elements) => handleChartClick(event, elements, 'recoveries') }} />
                </div>
            </>
        )}
        {lossTypes.length > 0 && (
            <>
                <div style={{ height: '300px' }}>
                    <Pie data={dataLosses} options={{ ...pieChartOptions, onClick: (event, elements) => handleChartClick(event, elements, 'losses') }} />
                </div>
            </>
        )}
    </div>
  );
};

export default TurnoversTypePieChart;