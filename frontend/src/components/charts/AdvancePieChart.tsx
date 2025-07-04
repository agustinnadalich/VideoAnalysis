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
        label: `Advance by ${category.toLowerCase()}`,
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

      // Pass filter data to the onChartClick function in New-charts.js
      onChartClick(event, elements,chart, "advance-chart", "tackles-tab", [
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
        text: `Advance Distribution - ${category}`,
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
          const dataElement = meta.data[context.dataIndex];
          const hidden = dataElement ? dataElement.hidden : false;
          return hidden || value === 0 ? '' : value;
        },
        font: {
          weight: 'bold',
        },
      },
    },
    onClick: handleChartClick,
  };

  return <Pie data={pieChartData} options={pieChartOptions} />;
};

export default AdvancePieChart;