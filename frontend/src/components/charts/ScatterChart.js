import React, { useContext, useMemo, useCallback } from 'react';
import { Scatter } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import FilterContext from "../../context/FilterContext";

Chart.register(...registerables);
Chart.register(ChartDataLabels);

const backgroundImagePlugin = {
  id: "backgroundImage",
  beforeDraw: (chart) => {
    if (chart.config.options.backgroundImage) {
      const ctx = chart.ctx;
      const { top, left, width, height } = chart.chartArea;
      const image = new Image();
      image.src = chart.config.options.backgroundImage;
      ctx.drawImage(image, left, top, width, height);
    }
  },
};

Chart.register(backgroundImagePlugin);

const ScatterChart = ({ events, columnsToTooltip, colors, setSelectedEvents, selectedEvents, onEventClick }) => {
  const { filterDescriptors, setFilterDescriptors } = useContext(FilterContext);

  const scatterChartData = useMemo(() => {
    if (!events || events.length === 0 || !columnsToTooltip) {
      return { datasets: [] }; // Retornar un objeto vacío si no hay datos
    }

    return {
      datasets: events
        .filter((event) => {
          const x = parseFloat(event["COORDINATE_X"]);
          const y = parseFloat(event["COORDINATE_Y"]);
          return (
            !isNaN(x) &&
            !isNaN(y) &&
            event.CATEGORY !== "DEFENCE" &&
            event.CATEGORY !== "ATTACK" &&
            event.CATEGORY !== "SHORT-MATCH"
          );
        })
        .map((event) => {
          let descriptor = event["TIME(VIDEO)"];
          columnsToTooltip.forEach((column) => {
            if (event[column] !== null) {
              descriptor += `, ${column}: ${event[column]}`;
            }
          });
          return {
            label: `${event.CATEGORY}`,
            data: [
              {
                x: -Number(event["COORDINATE_Y"]),
                y: -Number(event["COORDINATE_X"]),
                category: event.CATEGORY,
                id: event.ID,
                descriptor: descriptor,
                ...columnsToTooltip.reduce((acc, column) => {
                  acc[column] = event[column];
                  return acc;
                }, {}),
              },
            ],
            backgroundColor: colors[event.CATEGORY],
          };
        }),
    };
  }, [events, columnsToTooltip, colors]);

  const handleScatterClick = useCallback((event, elements) => {
    if (elements.length > 0) {
      const chart = elements[0].element.$context.chart;
      const datasetIndex = elements[0].datasetIndex;
      const index = elements[0].index;
      const clickedEventId = chart.data.datasets[datasetIndex].data[index].id;
  
      // Buscar el evento completo utilizando el ID
      const clickedEvent = events.find((event) => event.ID === clickedEventId);
  
      if (clickedEvent) {
        // Alternar el filtrado de eventos
        const isAlreadySelected = selectedEvents.some(
          (event) => event.ID === clickedEventId
        );
        const updatedEvents = isAlreadySelected ? events : [clickedEvent];
  
        // Actualizar el estado de los eventos seleccionados
        setSelectedEvents(isAlreadySelected ? [] : [clickedEvent]);
        
        // Iniciar la reproducción del video del evento seleccionado solo si no es un grupo de eventos
        if (!isAlreadySelected) {
          onEventClick(clickedEvent);
          // Actualizar los filtros en el contexto
          setFilterDescriptors([{ descriptor: "ID", value: clickedEventId }]);
        } else {
          // Si el evento ya estaba seleccionado, desfiltrar y actualizar los gráficos
          onEventClick(null);
          setFilterDescriptors([]);
        }
      } else {
        console.error("Event not found with ID:", clickedEventId);
      }
    }
  }, [events, selectedEvents, setSelectedEvents, onEventClick, setFilterDescriptors]);

  const scatterChartOptions = useMemo(() => ({
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
        min: 3,
        max: -100,
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
        min: -70,
        max: 0,
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
        radius: 5,
        hoverRadius: 10,
      },
    },
  }), [handleScatterClick, columnsToTooltip]);

  if (!events || events.length === 0 || !columnsToTooltip) {
    return null; // Manejar el caso donde events o columnsToTooltip es undefined o está vacío
  }

  return <Scatter data={scatterChartData} options={scatterChartOptions} width={800} height={600} />;
};

export default ScatterChart;