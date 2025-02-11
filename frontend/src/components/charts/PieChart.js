import React from 'react';
import { Pie } from 'react-chartjs-2';

const PieChart = ({ events }) => {
  const avanceLabels = ["POSITIVO", "NEUTRO", "NEGATIVO"];

  const avanceData = avanceLabels.map(
    (result) =>
      events.filter((event) => event.AVANCE === result).length
  );

  const pieChartData = {
    labels: avanceLabels,
    datasets: [
      {
        label: "Cantidad de tackles por avance",
        data: avanceData,
        backgroundColor: avanceLabels.map((label) => {
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

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Distribución de Categorías',
      },
    },
  };

  return <Pie data={pieChartData} options={pieChartOptions} />;
};

export default PieChart;