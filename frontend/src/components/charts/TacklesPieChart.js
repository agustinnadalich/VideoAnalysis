import React, { useContext } from 'react';
import { Pie } from 'react-chartjs-2';
import FilterContext from "../../context/FilterContext";

const TacklesPieChart = ({ events, onChartClick }) => {
  const { setFilterDescriptors, filterDescriptors } = useContext(FilterContext);

  const tackleEvents = events.filter(
    (event) => event.CATEGORÍA === "PLACCAGGIO"
  );

  const tackleAdvanceLabels = [
    ...new Set(tackleEvents.map((event) => event.AVANCE).filter((avance) => avance !== null)),
  ].sort((a, b) => a - b);

  const tackleAdvanceData = tackleAdvanceLabels.map(
    (result) =>
      tackleEvents.filter((event) => event.AVANCE === result).length
  );

  const tacklesPieChartData = {
    labels: tackleAdvanceLabels,
    datasets: [
      {
        label: "Tackles por avance",
        data: tackleAdvanceData,
        backgroundColor: tackleAdvanceLabels.map((label) => {
          if (label === "POSITIVO") {
            return "rgba(75, 192, 192, 0.6)";
          } else if (label === "NEGATIVO") {
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
        { descriptor: "CATEGORÍA", value: "PLACCAGGIO" },
        { descriptor: "AVANCE", value: clickedLabel }
      ]);
    }
  };
  

  const tacklesPieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Distribución de Avances',
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

  return <Pie data={tacklesPieChartData} options={tacklesPieChartOptions} />;
};

export default TacklesPieChart;