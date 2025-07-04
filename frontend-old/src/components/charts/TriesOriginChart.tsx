import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

const TriesOriginChart = ({ events, onChartClick }) => {
  const [triesOriginChartData, setTriesOriginChartData] = useState(null);

  useEffect(() => {
    console.log("Eventos recibidos:", events);

    const triesEvents = events.filter(event => event.POINTS === "TRY");
    console.log("Eventos de tries:", triesEvents);

    const originCategories = ["TURNOVER+", "SCRUM", "LINEOUT", "KICKOFF"];

    const originCounts = originCategories.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {});
    console.log("Contadores de origen inicializados:", originCounts);

    const opponentCounts = { ...originCounts };
    const teamCounts = { ...originCounts };

    triesEvents.forEach(tryEvent => {
      const origin = tryEvent.TRY_ORIGIN;
      if (origin) {
        if (tryEvent.TEAM === "OPPONENT") {
          opponentCounts[origin]++;
        } else {
          teamCounts[origin]++;
        }
      }
    });

    const data = {
      labels: originCategories,
      datasets: [
        {
          label: "Origen de los Tries (OPPONENT)",
          data: originCategories.map(category => opponentCounts[category]),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
        {
          label: "Origen de los Tries (TEAM)",
          data: originCategories.map(category => teamCounts[category]),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
      ],
    };
    console.log("Datos del gráfico:", data);

    setTriesOriginChartData(data);
  }, [events]);

  const handleChartClick = (event, elements) => {
    if (elements.length > 0) {
      const chart = elements[0].element.$context.chart;
      const label = chart.data.labels[elements[0].index];
      const filteredEvents = events.filter(event => event.CATEGORY === "POINTS" && event.TRY_ORIGIN === label);
      onChartClick(event, elements, chart, "origin", "tries-tab", [{ descriptor: "CATEGORY", value: "POINTS" }, { descriptor: "TRY_ORIGIN", value: label }], filteredEvents);
    }
  };

  const triesOriginChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Origen de los Tries',
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
        formatter: (value, context) => {
          const meta = context.chart.getDatasetMeta(context.datasetIndex);
          const hidden = meta.data[context.dataIndex].hidden;
          return hidden || value === 0 ? '' : value;
        },
        font: {
          weight: 'bold',
        },
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
    maintainAspectRatio: false,
    onClick: handleChartClick,
  };

  return triesOriginChartData ? (
    <Bar data={triesOriginChartData} options={triesOriginChartOptions} />
  ) : null;
};

export default TriesOriginChart;