import React from 'react';
import { Pie } from 'react-chartjs-2';

const TacklesEffectivityChart = ({ events, team }) => {
  const teamEvents = team === "OPPONENT" 
    ? events.filter(event => event.TEAM === "OPPONENT")
    : events.filter(event => event.TEAM !== "OPPONENT");

  const successfulTackles = teamEvents.filter(event => event.CATEGORY === "TACKLE").length; 
  const missedTackles = teamEvents.filter(event => event.CATEGORY === "MISSED-TACKLE").length;
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

  return (
    <div>
      <h3>{team} Tackles Effectivity: {effectiveness.toFixed(2)}%</h3>
      <Pie data={data} />
    </div>
  );
};

export default TacklesEffectivityChart;