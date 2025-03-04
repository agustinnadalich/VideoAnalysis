import React, { useContext } from 'react';
import { Pie } from 'react-chartjs-2';
import FilterContext from "../../context/FilterContext";

const AdvancePieChart = ({ events, onChartClick, category }) => {
  const { setFilterDescriptors, filterDescriptors } = useContext(FilterContext);

  const filteredEvents = events.filter(
    (event) => event.CATEGORY === category
  );

  const advanceLabels = [
    ...new Set(filteredEvents.map((event) => event.ADVANCE).filter((avance) => avance !== null)),
  ].sort((a, b) => a - b);

  const advanceData = advanceLabels.map(
    (result) =>
      filteredEvents.filter((event) => event.ADVANCE === result).length
  );

  const pieChartData = {
    labels: advanceLabels,
    datasets: [
      {
        label: `Avance por ${category.toLowerCase()}`,
        data: advanceData,
        backgroundColor: advanceLabels.map((label) => {
          if (label === "POSITIVE") {
            return "rgba(75, 192, 192, 0.6)";
          } else if (label === "NEGATIVE") {
            return "rgba(255, 99, 132, 0.6)";
          } else {
            return "rgba(201, 203, 207, 0.6)";
          }
        }),
      },
    ],
  };

  const handleChartClick = (event, elements) => {
    if (elements.length > 0) {
      const chart = elements[0].element.$context.chart;
      const index = elements[0].index;
      const clickedLabel = chart.data.labels[index];

      // Pasar los datos de filtro a la función onChartClick en New-charts.js
      onChartClick(event, elements, "advance-chart", [
        { descriptor: "CATEGORY", value: category },
        { descriptor: "ADVANCE", value: clickedLabel }
      ]);
    }
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Distribución de Avances - ${category}`,
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
    onClick: handleChartClick,
  };

  return <Pie data={pieChartData} options={pieChartOptions} />;
};

export default AdvancePieChart;