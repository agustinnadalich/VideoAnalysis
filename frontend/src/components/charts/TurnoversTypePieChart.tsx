import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

const TurnoversTypePieChart = ({ events, onChartClick }) => {
  const recoveries = events.filter(event => event.CATEGORY === 'TURNOVER+');
  const losses = events.filter(event => event.CATEGORY === 'TURNOVER-');

  const recoveryTypes = [...new Set(recoveries.map(event => event.TURNOVER_TYPE).filter(type => type !== null))];
  const lossTypes = [...new Set(losses.map(event => event.TURNOVER_TYPE).filter(type => type !== null))];

  const turnoversByRecoveryType = recoveryTypes.map(type => recoveries.filter(event => event.TURNOVER_TYPE === type).length);
  const turnoversByLossType = lossTypes.map(type => losses.filter(event => event.TURNOVER_TYPE === type).length);

  const filteredRecoveryTypes = recoveryTypes.filter((_, index) => turnoversByRecoveryType[index] > 0);
  const filteredLossTypes = lossTypes.filter((_, index) => turnoversByLossType[index] > 0);
  const filteredTurnoversByRecoveryType = turnoversByRecoveryType.filter(count => count > 0);
  const filteredTurnoversByLossType = turnoversByLossType.filter(count => count > 0);

  const totalRecoveries = filteredTurnoversByRecoveryType.reduce((a, b) => a + b, 0);
  const totalLosses = filteredTurnoversByLossType.reduce((a, b) => a + b, 0);

  const combinedData = [...filteredTurnoversByRecoveryType, ...filteredTurnoversByLossType];
  const combinedColors = [
    ...filteredTurnoversByRecoveryType.map((_, index) => `rgba(30, ${144 + index * 10}, 255, 0.8)`),
    ...filteredTurnoversByLossType.map((_, index) => `rgba(255, ${69 + index * 20}, 0, 0.8)`)
  ];

  const data = {
    labels: [...filteredRecoveryTypes.map(type => type + ' (TURNOVER+)'), ...filteredLossTypes.map(type => type + ' (TURNOVER-)')],
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
      const chart = elements[0].element.$context.chart;
      onChartClick(event, elements, chart, "turnover_type", "turnovers-tab");
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
          const start = index === 0 ? 0 : filteredTurnoversByRecoveryType.length;
          const end = index === 0 ? filteredTurnoversByRecoveryType.length : meta.data.length;
          for (let i = start; i < end; i++) {
            meta.data[i].hidden = !meta.data[i].hidden;
          }
          chart.update();
        },
        labels: {
          generateLabels: (chart) => {
            return [
              {
                text: 'Recovered',
                fillStyle: 'rgba(30, 144, 255, 1)',
                hidden: false,
                index: 0,
              },
              {
                text: 'Lost',
                fillStyle: 'rgba(255, 69, 0, 1)',
                hidden: false,
                index: 1,
              },
            ];
          },
        },
      },
      title: {
        display: true,
        text: 'Turnovers by Type',
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
          
          if (!meta || !meta.data || !meta.data[context.dataIndex]) {
            return ''; // Si no hay datos, evita el error
          }      
          const hidden = meta.data[context.dataIndex]?.hidden;
          return hidden ? '' : value;
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
  <Doughnut data={data} options={pieChartOptions as any} plugins={[ChartDataLabels]} />
      <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <span style={{ color: 'rgba(30, 144, 255, 1)', fontSize: '1.5em' }}>{totalRecoveries}</span>
        <span style={{ fontSize: '1.5em' }}> / </span>
        <span style={{ color: 'rgba(255, 69, 0, 1)', fontSize: '1.5em' }}>{totalLosses}</span> 
      </div>
    </div>
  );
};

export default TurnoversTypePieChart;