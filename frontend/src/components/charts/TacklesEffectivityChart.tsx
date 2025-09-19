import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const TacklesEffectivityChart = ({ events, team, onChartClick }) => {
  console.log("🎯 TacklesEffectivityChart - Received events:", events?.length || 0);
  console.log("🎯 TacklesEffectivityChart - Team filter:", team);
  console.log("🎯 TacklesEffectivityChart - Sample event:", events?.[0]);
  
  const teamEvents = team === "OPPONENT" 
    ? events.filter(event => event.TEAM === "OPPONENT")
    : events.filter(event => event.TEAM !== "OPPONENT");

  console.log("🎯 TacklesEffectivityChart - Filtered team events:", teamEvents.length);

  const successfulTackles = teamEvents.filter(event => event.event_type === "TACKLE").length; 
  const missedTackles = teamEvents.filter(event => event.event_type === "MISSED-TACKLE").length;

  const totalAttempts = successfulTackles + missedTackles;
  const effectiveness = totalAttempts > 0 ? (successfulTackles / totalAttempts) * 100 : 0;

  const data = {
    labels: ['Successful Tackles', 'Missed Tackles'],
    datasets: [
      {
        data: [successfulTackles, missedTackles],
        backgroundColor: ['#36A2EB', '#FF6384'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384'],
      },
    ],
  };

  console.log("🎯 TacklesEffectivityChart - Final data:", data);
  console.log("🎯 TacklesEffectivityChart - Effectiveness:", effectiveness);
  console.log("🎯 TacklesEffectivityChart - Total attempts:", totalAttempts);

  const handleChartClick = (event, elements) => {
    if (elements.length > 0) {
      const chart = elements[0].element.$context.chart;
      const label = chart.data.labels[elements[0].index];
      const category = label === 'Successful Tackles' ? 'TACKLE' : 'MISSED-TACKLE';
      onChartClick(event, elements, chart, category, "tackles-tab", [{ descriptor: "event_type", value: category }]);
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${team} Tackles Effectivity`,
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
    },
    onClick: handleChartClick,
  };

  return (
    <div>
      <h3>{team} Tackles Effectivity: {effectiveness.toFixed(2)}%</h3>
      <Pie data={data} options={pieChartOptions} style={{ maxHeight: '600px' }}/>
    </div>
  );
};

export default TacklesEffectivityChart;