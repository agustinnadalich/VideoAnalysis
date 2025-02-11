import React from 'react';
import { Scatter } from 'react-chartjs-2';

const ScatterChart = ({ events, columnsToTooltip, colors, handleScatterClick }) => {
  if (!events || events.length === 0 || !columnsToTooltip) {
    return null; // Manejar el caso donde events o columnsToTooltip es undefined o está vacío
  }

  const scatterChartData = {
    datasets: events
      .filter((event) => {
        const x = parseFloat(event["COORDENADA X"]);
        const y = parseFloat(event["COORDENADA Y"]);
        return (
          !isNaN(x) &&
          !isNaN(y) &&
          event.CATEGORÍA !== "DIFESA" &&
          event.CATEGORÍA !== "ATTACCO" &&
          event.CATEGORÍA !== "PARTITA TAGLIATA"
        );
      })
      .map((event) => {
        let descriptor = event["TIEMPO(VIDEO)"];
        columnsToTooltip.forEach((column) => {
          if (event[column] !== null) {
            descriptor += `, ${column}: ${event[column]}`;
          }
        });
        return {
          label: `${event.CATEGORÍA}`,
          data: [
            {
              x: Number(event["COORDENADA Y"]),
              y: Number(event["COORDENADA X"]),
              category: event.CATEGORÍA,
              id: event.ID,
              descriptor: descriptor,
              ...columnsToTooltip.reduce((acc, column) => {
                acc[column] = event[column];
                return acc;
              }, {}),
            },
          ],
          backgroundColor: colors[event.CATEGORÍA],
        };
      }),
  };

  const scatterChartOptions = {
    onClick: handleScatterClick,
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label;
            const value = `${context.raw.x}, ${context.raw.y}`;
            const descriptores = columnsToTooltip
              .filter((column) => context.raw[column] !== null && context.raw[column] !== "N/A"  && context.raw[column] !== undefined)
              .map((column) => `${column}: ${context.raw[column]}`)
              .join(", ");
            // const id = context.raw.id;
            return `${label}: ${value}  ${descriptores}`;
          },
        },
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        min: -3,
        max: 100,
        title: {
          display: false,
        },
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        },
      },
      y: {
        type: "linear",
        min: 0,
        max: 70,
        title: {
          display: false,
        },
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        },
      },
    },
    maintainAspectRatio: false,
    backgroundImage: "/CANCHA-CORTADA.jpg",
    elements: {
      point: {
        radius: 7,
      },
    },
  };

  return <Scatter data={scatterChartData} options={scatterChartOptions}  width={800} height={600}/>;
};

export default ScatterChart;