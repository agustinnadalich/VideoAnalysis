import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

const CoustomTimeChart = ({ events, onChartClick }) => {
  const [coustomTimeChartData, setTacklesTimeChartData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Obtener las categorías únicas de los eventos
  // const categories = [...new Set(events.map(event => event.CATEGORIA))];
  const allowedCategories = ['PLACCAGGIO', 'PLAC-SBAGLIATTO', 'PUNTI', 'BREAK', 'CALCIO', 'FREE-KICK', 'FALLO', 'MAUL', 'MISCHIA', 'PALI', 'PERSA', 'RICUPERATA', 'TOUCHE'];
  // const filteredCategories = categories.filter(category => allowedCategories.includes(category));

  useEffect(() => {
    if (selectedCategory === "" && allowedCategories.length > 0) {
      setSelectedCategory(allowedCategories[0]);
    }
  }, [allowedCategories]);

  useEffect(() => {
    if (selectedCategory === "") return;

    const coustomEvents = events.filter(
      (event) => event.CATEGORIA === selectedCategory
    );

    const timeGroups = [
      "0'- 20'",
      "20' - 40'",
      "40' - 60'",
      "60' - 80'"
    ];

    const data = {
      labels: timeGroups,
      datasets: [
        {
          label: `Eventos por tiempo de juego (Equipo) - ${selectedCategory}`,
          data: timeGroups.map(group => {
            const groupEvents = coustomEvents.filter(event => event.Grupo_Tiempo === group && event.EQUIPO !== "RIVAL");
            const totalEvents = groupEvents.length;
            return totalEvents;
          }),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
        {
          label: `Eventos por tiempo de juego (Rival) - ${selectedCategory}`,
          data: timeGroups.map(group => {
            const groupEvents = coustomEvents.filter(event => event.Grupo_Tiempo === group && event.EQUIPO === "RIVAL");
            const totalEvents = groupEvents.length;
            return totalEvents;
          }),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };

    setTacklesTimeChartData(data);
  }, [events, selectedCategory]);

  const handleChartClick = (event, elements) => {
    onChartClick(event, elements, "time");
  };

  const coustomTimeChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Eventos por Tiempo de Juego',
      },
      // tooltip: {
      //   callbacks: {
      //     label: (context) => {
      //       const label = context.dataset.label;
      //       const value = context.raw;
      //       return `${label}: ${value}`;
      //     },
      //   },
      // },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: false,
      },
    },
    maintainAspectRatio: false,
    // onClick: handleChartClick,
  };

  return (
    <div>
      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
        {allowedCategories.map((category) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
      {coustomTimeChartData ? (
        <Bar data={coustomTimeChartData} options={coustomTimeChartOptions} />
      ) : null}
    </div>
  );
};

export default CoustomTimeChart;