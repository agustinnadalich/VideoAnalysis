import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';

const TurnoversPlayerBarChart = ({ events, onChartClick }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const playersPlus = events.filter(event => event.CATEGORY === 'TURNOVER+' && event.PLAYER).map(event => event.PLAYER);
  const playersMinus = events.filter(event => event.CATEGORY === 'TURNOVER-' && event.PLAYER).map(event => event.PLAYER);

  const uniquePlayersPlus = [...new Set(playersPlus)];
  const uniquePlayersMinus = [...new Set(playersMinus)];

  const recoversByPlayer = uniquePlayersPlus.map(player => events.filter(event => event.PLAYER === player && event.CATEGORY === 'TURNOVER+').length);
  const lostByPlayer = uniquePlayersMinus.map(player => events.filter(event => event.PLAYER === player && event.CATEGORY === 'TURNOVER-').length);

  // const handleClick = (event, elements, chartType) => {
  //   if (elements.length > 0) {
  //     const index = elements[0].index;
  //     const player = chartType === 'plus' ? uniquePlayersPlus[index] : uniquePlayersMinus[index];
  //     // setSelectedPlayer(player);
  //     onChartClick(event, elements, "player", [{ descriptor: "PLAYER", value: player }]);
  //   }
  // };

  const handleClick = (event, elements) => {
    onChartClick(event, elements, "player");
  };
  

  const dataPlus = {
    labels: uniquePlayersPlus,
    datasets: [
      {
        label: 'Recovers by Player',
        data: recoversByPlayer,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
      },
    ],
  };

  const dataMinus = {
    labels: uniquePlayersMinus,
    datasets: [
      {
        label: 'Lost by Player',
        data: lostByPlayer,
        backgroundColor: 'rgba(255,99,132,0.4)',
        borderColor: 'rgba(255,99,132,1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      {uniquePlayersPlus.length > 0 && (
        <Bar data={dataPlus} options={{ onClick: (event, elements) => handleClick(event, elements, 'plus') }} />
      )}
      {uniquePlayersMinus.length > 0 && (
        <Bar data={dataMinus} options={{ onClick: (event, elements) => handleClick(event, elements, 'minus') }} />
      )}
      {selectedPlayer}
    </div>
  );
};

export default TurnoversPlayerBarChart;