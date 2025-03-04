import React from 'react';
import { Bar } from 'react-chartjs-2';

const PenaltiesPlayerBarChart = ({ events }) => {
  const players = [...new Set(events.map(event => event.PLAYER).filter(player => player !== null))];
  const penaltiesByPlayer = players.map(player => events.filter(event => event.PLAYER === player).length);

  const data = {
    labels: players,
    datasets: [
      {
        label: 'Penalties by Player',
        data: penaltiesByPlayer,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
      },
    ],
  };

  return <Bar data={data} />;
};

export default PenaltiesPlayerBarChart;