import React, { useState, useEffect } from 'react';
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

const MissedTacklesBarChart = ({ events, onChartClick }) => {
  const [missedTacklesBarChartData, setMissedTacklesBarChartData] = useState(null);

  useEffect(() => {
    console.log("🎯 MissedTacklesBarChart - Received events:", events?.length || 0);
    console.log("🎯 MissedTacklesBarChart - Sample event:", events?.[0]);
    
    const missedTackleEvents = events.filter(
      (event) => event.event_type === "MISSED-TACKLE"
    );
    
    console.log("🎯 MissedTacklesBarChart - Filtered MISSED-TACKLE events:", missedTackleEvents.length);
    console.log("🎯 MissedTacklesBarChart - Sample MISSED-TACKLE event:", missedTackleEvents?.[0]);

    const playerLabels = [
      ...new Set(missedTackleEvents.map((event) => event.PLAYER)),
    ].filter(player => player != null).sort((a, b) => {
      const numA = typeof a === 'string' ? parseInt(a) || 0 : 0;
      const numB = typeof b === 'string' ? parseInt(b) || 0 : 0;
      return numA - numB;
    });

    const data = {
      labels: playerLabels,
      datasets: [
        {
          label: "Missed Tackles",
          data: playerLabels.map((player) => {
            const count = missedTackleEvents.filter(
              (event) => event.PLAYER === player  && event.TEAM !== "OPPONENT"
            ).length;
            return count;
          }),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };

    console.log("🎯 MissedTacklesBarChart - Final data:", data);
    setMissedTacklesBarChartData(data);
  }, [events]);

  console.log("🎯 MissedTacklesBarChart - Rendering with data:", {
    missedTacklesBarChartData,
    hasData: !!missedTacklesBarChartData,
    dataLength: missedTacklesBarChartData?.datasets?.[0]?.data?.length || 0
  });

  const handleChartClick = (event, elements) => {
    const chart = elements[0].element.$context.chart;
    onChartClick(event, elements, chart, "player", "tackles-tab"); 
  };


  const missedTacklesBarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Missed Tackles by Player',
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
          weight: 700,
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
    onClick: handleChartClick,
  };

  return missedTacklesBarChartData ? (
    <Bar data={missedTacklesBarChartData} options={missedTacklesBarChartOptions} />
  ) : null;
};

export default MissedTacklesBarChart;