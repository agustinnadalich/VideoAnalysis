import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const LineoutEffectivityChart = ({ events, title, onChartClick }) => {
  const won = events.filter(event => event.LINE_RESULT === "CLEAN" || event.LINE_RESULT === "DIRTY").length;
  const lost = events.filter(event => event.LINE_RESULT === "LOST L" || event.LINE_RESULT === "NOT-STRAIGHT").length;
  const total = won + lost;
  const effectiveness = total > 0 ? ((won / total) * 100).toFixed(1) : 0;

  const data = {
    labels: ['Won', 'Lost'],
    datasets: [
      {
        data: [won, lost],
        backgroundColor: ['#36A2EB', '#FF6384'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384'],
      },
    ],
  };

  const handleChartClick = (event, elements) => {
    if (elements.length > 0) {
      const chart = elements[0].element.$context.chart;
      const label = chart.data.labels[elements[0].index];
      const category = 'LINEOUT';
      onChartClick(event, elements, chart, category, "set-pieces-tab", [{ descriptor: "CATEGORY", value: category }]);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Permite que el gráfico ocupe todo el contenedor
    plugins: {
      legend: { display: false },
      title: { display: true, text: title },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            const label = tooltipItem.label || '';
            const value = tooltipItem.raw || 0;
            return `${label}: ${value} (${((value / total) * 100).toFixed(1)}%)`;
          },
        },
      },
    },
    onClick: handleChartClick,
  };

const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: (chart) => {
        const { width } = chart;
        const { height } = chart;
        const ctx = chart.ctx;
        ctx.restore();

        // Set font size and style for the "Effectiveness" label
        const labelFontSize = (height / 400).toFixed(2);
        ctx.font = `${labelFontSize}em sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';

        const labelText = 'Effectiveness';
        const labelX = Math.round((width - ctx.measureText(labelText).width) / 2);
        const labelY = height / 2 - 10; // Position above the value
        ctx.fillText(labelText, labelX, labelY);

        // Set font size and style for the value
        const valueFontSize = (height / 300).toFixed(2);
        ctx.font = `${valueFontSize}em sans-serif`;

        const valueText = `${effectiveness}%`;
        const valueX = Math.round((width - ctx.measureText(valueText).width) / 2);
        const valueY = height / 2 + 15; // Position below the label
        ctx.fillText(valueText, valueX, valueY);

        ctx.save();
    },
};

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
    </div>
  );
};

export default LineoutEffectivityChart;