import React, { useContext } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import FilterContext from "../../context/FilterContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TimelineChart = ({ events, columnsToTooltip, colors, onEventClick, filteredEvents, updateCharts }) => {
  const { filterCategory, setFilterCategory, filterDescriptors, setFilterDescriptors, setFilteredEvents } = useContext(FilterContext);

  if (!filteredEvents || filteredEvents.length === 0) {
    return null; // Manejar el caso donde filteredEvents es undefined o está vacío
  }

  const filteredCategories = [
    ...new Set(filteredEvents.map((event) => event.CATEGORIA)),
  ];

  const timelineData = {
    labels: filteredCategories,
    datasets: filteredCategories.map((category) => ({
      label: category,
      data: filteredEvents
        .filter((event) => event.CATEGORIA === category)
        .map((event) => {
          let descriptor = "";
          columnsToTooltip.forEach((column) => {
            if (
              event[column] !== null &&
              event[column] !== "" &&
              event[column] !== "N/A" &&
              column !== "SEGUNDO" &&
              column !== "DURACION"
            ) {
              descriptor += `${descriptor ? ", " : ""}${column}: ${
                event[column]
              }`;
            }
          });
          return {
            x: [event.SEGUNDO, event.SEGUNDO + event.DURACION], // Usar un array para representar el rango
            y: category,
            id: event.ID,
            descriptor: descriptor,
            SEGUNDO: event["SEGUNDO"],
            DURACION: event["DURACION"],
          };
        }),
      backgroundColor: colors[category],
      barPercentage: 1.0, // Asegura que las barras ocupen todo el espacio disponible
      categoryPercentage: 1.0, // Asegura que las barras se centren en sus CATEGORIAs
    })),
  };

  const handleTimelineClick = (event, elements) => {
    if (elements.length > 0) {
      const element = elements[0];
      const datasetIndex = element.datasetIndex;
      const index = element.index;
      const eventData = filteredEvents[index];
      onEventClick(eventData);
    } else {
      // Manejar clics en las etiquetas del eje de la CATEGORIA
      const yScale = event.chart.scales.y;
      if (yScale) {
        const yValue = yScale.getValueForPixel(event.y);
        const category = yScale.getLabelForValue(yValue);

        if (category) {
          // Verificar si ya estamos filtrando por esta CATEGORIA
          const isAlreadyFiltered =
            filterCategory.includes(category);

          if (isAlreadyFiltered) {
            // Si ya estamos filtrando por esta CATEGORIA, desfiltrar y mostrar todos los eventos
            const newFilterCategory = filterCategory.filter(cat => cat !== category);
            setFilterCategory(newFilterCategory);
            updateCharts(events, newFilterCategory, filterDescriptors);
            setFilteredEvents(events);
          } else if (events) {
            // Si no, filtrar por la nueva CATEGORIA
            const filtered = events.filter(
              (event) => event.CATEGORIA === category
            );

            if (filtered.length > 0) {
              // Usar updateCharts para actualizar los gráficos con los eventos filtrados
              const newFilterCategory = [...filterCategory, category];
              setFilterCategory(newFilterCategory);
              updateCharts(
                filtered,
                newFilterCategory,
                filterDescriptors,
              );

              // Actualizar el estado de los eventos filtrados
              setFilteredEvents(filtered);
            } else {
              console.error("No events found for category:", category);
            }
          } else {
            console.error("Events data is not defined.");
          }
        }
      } else {
        console.error("y scale is not defined.");
      }
    }
  };

  const timelineOptions = {
    onClick: handleTimelineClick,
    onHover: (event, elements) => {
      const chart = event.chart;
      if (elements.length > 0) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const index = element.index;

        // Aumentar el grosor de la barra al pasar el cursor
        chart.data.datasets[datasetIndex].barThickness = 30;
        chart.update();
      } else {
        // Restablecer el grosor de la barra cuando el cursor no está sobre ella
        chart.data.datasets.forEach((dataset) => {
          dataset.data.forEach((data) => {
            dataset.barThickness = Math.max(20, 40 / filteredCategories.length);
          });
        });
        chart.update();
      }
    },
    indexAxis: "y", // Configurar el gráfico de barras para que sea horizontal
    scales: {
      x: {
        beginAtZero: false,
        type: "linear",
        position: "bottom",
        title: {
          display: true,
          text: "Tiempo (segundos)",
        },
        ticks: {
          callback: function (value, index, values) {
            const hours = Math.floor(value / 3600);
            const minutes = Math.floor((value % 3600) / 60);
            const seconds = value % 60;
            return `${hours > 0 ? hours + ":" : ""}${minutes}:${
              seconds < 10 ? "0" : ""
            }${seconds}`;
          },
        },
      },
      y: {
        type: "category",
        labels: filteredCategories, // Usar las CATEGORIAs filtradas
        title: {
          display: true,
          text: "CATEGORIA",
        },
        ticks: {
          padding: 5, // Ajusta el espacio entre las etiquetas y las barras
          callback: function (value, index, values) {
            return filteredCategories[value]; // Mostrar las CATEGORIAs originales
          },
        },
        stacked: true, // Asegura que las barras se apilen correctamente
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const data = context.raw;
            return data.descriptor;
          },
        },
      },
      legend: {
        display: false, // Quitar la leyenda
      },
      datalabels: {
        display: false, // Quitar etiquetas de datos dentro de las barras
      },
      categoryClick: {},
      zoom: {
        pan: {
          enabled: true,
          modifierKey: "shift",
          mode: "x",
        },
        zoom: {
          wheel: {
            enabled: true, // Deshabilitar el zoom con la rueda del ratón
            modifierKey: "shift", // Habilitar el zoom con la rueda del ratón + tecla Shift
            speed: 0.05, // Ajustar la velocidad del zoom
          },
          pinch: {
            enabled: true, // Habilitar el zoom por pellizco
          },
          mode: "x",
          drag: {
            enabled: true,
            modifierKey: "alt", // Habilitar el arrastre con la tecla Ctrl
          },
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    barThickness: Math.max(20, 40 / filteredCategories.length), // Ajusta el grosor de las barras dinámicamente
  };

  return <Bar data={timelineData} options={timelineOptions} />;
};

export default TimelineChart;
