import React from 'react';
import { Pie } from 'react-chartjs-2';

const PenaltiesCausePieChart = ({ events }) => {
  const causes = [...new Set(events.map(event => event.INFRACTION_TYPE))];
  const penaltiesByCause = causes.map(cause => events.filter(event => event.INFRACTION_TYPE === cause).length);

  const data = {
    labels: causes,
    datasets: [
      {
        data: penaltiesByCause,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      },
    ],
  };

  return <Pie data={data} />;
};

export default PenaltiesCausePieChart;