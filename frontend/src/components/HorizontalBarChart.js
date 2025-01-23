// src/components/HorizontalBarChart.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const HorizontalBarChart = ({ data }) => {
  const { labels, datasets } = data;

  const total = datasets[0].data[0] + datasets[1].data[0];
  const percentages = datasets.map(dataset => ({
    ...dataset,
    data: [(dataset.data[0] / total) * 100],
    backgroundColor: dataset.isRival ? '#f44336' : '#4caf50', // Rojo para el rival, verde para nuestro equipo
  }));

  const chartData = {
    labels: labels,
    datasets: percentages,
  };

  const options = {
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        stacked: true,
        display: false, // Oculta el eje x
        grid: {
          display: false, // Oculta las líneas de la cuadrícula
        },
        max: 100, // Asegura que todas las barras representen el 100%
      },
      y: {
        stacked: true,
        display: false, // Oculta el eje y
        grid: {
          display: false, // Oculta las líneas de la cuadrícula
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Oculta la leyenda
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${value.toFixed(2)}%`;
          },
        },
      },
      datalabels: {
        display: false, // Oculta las etiquetas de los datos
      },
    },
    maintainAspectRatio: false, // Permite que el gráfico ocupe el ancho completo del contenedor
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '30px' }}>
      <Bar data={chartData} options={options} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
        {labels[0] === 'POSESIÓN DEL BALÓN' ? (
          <>
            <span>{Math.round(datasets[0].data[0])}%</span>
            <span>{Math.round(datasets[1].data[0])}%</span>
          </>
        ) : labels[0] === 'PALI' || labels[0] === 'FORMACIONES FIJAS' ? (
          <>
            <span>{datasets[0].label}</span>
            <span>{datasets[1].label}</span>
          </>
        ) : (
          <>
            <span>{datasets[0].data[0]}</span>
            <span>{datasets[1].data[0]}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default HorizontalBarChart;