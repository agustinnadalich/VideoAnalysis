import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TacklesByTeamChart = ({ events, onChartClick }) => {
  console.log("🎯 TacklesByTeamChart - Received events:", events?.length || 0);
  console.log("🎯 TacklesByTeamChart - Sample event:", events?.[0]);
  
  // Filtrar eventos de tackles
  const tackleEvents = events.filter((event) => 
    event.CATEGORY === "TACKLE" || event.event_type === "TACKLE"
  );

  console.log("🎯 TacklesByTeamChart - Filtered TACKLE events:", tackleEvents.length);

  // Contar tackles por equipo
  const ourTeamTackles = tackleEvents.filter(event => event.TEAM !== "OPPONENT").length;
  const opponentTackles = tackleEvents.filter(event => event.TEAM === "OPPONENT").length;

  const data = {
    labels: ['Nuestro Equipo', 'Rival'],
    datasets: [
      {
        label: 'Tackles por Equipo',
        data: [ourTeamTackles, opponentTackles],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const handleChartClick = (event, elements) => {
    if (elements.length > 0 && onChartClick) {
      const chart = elements[0].element.$context.chart;
      const index = elements[0].index;
      const teamName = index === 0 ? 'OUR_TEAM' : 'OPPONENT';
      onChartClick(event, elements, chart, 'team_tackles', 'tackles-tab');
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Tackles por Equipo',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label;
            const value = context.raw;
            return `${label}: ${value}`;
          },
        },
      },
      datalabels: {
        color: 'grey',
        formatter: (value) => value > 0 ? value : '',
        font: {
          weight: 700,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    onClick: handleChartClick,
  };

  console.log("🎯 TacklesByTeamChart - Final data:", data);
  console.log("🎯 TacklesByTeamChart - Team counts:", {
    ourTeamTackles,
    opponentTackles,
    totalTackles: ourTeamTackles + opponentTackles
  });

  return (
    <div className="w-full">
      <Bar data={data} options={options} height={300} />
    </div>
  );
};

export default TacklesByTeamChart;
