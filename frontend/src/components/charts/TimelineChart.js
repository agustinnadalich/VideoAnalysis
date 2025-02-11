import React from "react";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TimelineChart = ({ events, columnsToTooltip, colors, onEventClick }) => {
  if (!events || events.length === 0) {
    return null; // Manejar el caso donde events es undefined o está vacío
  }

  const filteredCategories = [
    ...new Set(events.map((event) => event.CATEGORÍA)),
  ];

  const timelineData = {
    labels: filteredCategories,
    datasets: filteredCategories.map((category) => ({
      label: category,
      data: events
        .filter((event) => event.CATEGORÍA === category)
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
      categoryPercentage: 1.0, // Asegura que las barras se centren en sus categorías
    })),
  };

  // const timelineOptions = {
  //   onClick: (event, elements) => {
  //     if (elements.length > 0) {
  //       const element = elements[0];
  //       const datasetIndex = element.datasetIndex;
  //       const index = element.index;
  //       const eventData = events[index];
  //       onEventClick(eventData);
  //     }
  //   },
  //   onHover: (event, elements) => {
  //     const chart = event.chart;
  //     if (elements.length > 0) {
  //       const element = elements[0];
  //       const datasetIndex = element.datasetIndex;
  //       const index = element.index;

  //       // Aumentar el grosor de la barra al pasar el cursor
  //       chart.data.datasets[datasetIndex].barThickness = 30;
  //       chart.update();
  //     } else {
  //       // Restablecer el grosor de la barra cuando el cursor no está sobre ella
  //       chart.data.datasets.forEach((dataset) => {
  //         dataset.data.forEach((data) => {
  //           dataset.barThickness = Math.max(20, 40 / filteredCategories.length);
  //         });
  //       });
  //       chart.update();
  //     }
  //   },
  //   indexAxis: "y", // Configurar el gráfico de barras para que sea horizontal
  //   scales: {
  //     x: {
  //       beginAtZero: false,
  //       type: "linear",
  //       position: "bottom",
  //       title: {
  //         display: true,
  //         text: "Tiempo (segundos)",
  //       },
  //       ticks: {
  //         callback: function (value, index, values) {
  //           const hours = Math.floor(value / 3600);
  //           const minutes = Math.floor((value % 3600) / 60);
  //           const seconds = value % 60;
  //           return `${hours > 0 ? hours + ":" : ""}${minutes}:${
  //             seconds < 10 ? "0" : ""
  //           }${seconds}`;
  //         },
  //       },
  //     },
  //     y: {
  //       type: "category",
  //       labels: filteredCategories, // Usar las categorías filtradas
  //       title: {
  //         display: true,
  //         text: "Categoría",
  //       },
  //       ticks: {
  //         padding: 5, // Ajusta el espacio entre las etiquetas y las barras
  //         callback: function (value, index, values) {
  //           return filteredCategories[value]; // Mostrar las categorías originales
  //         },
  //       },
  //       stacked: true, // Asegura que las barras se apilen correctamente
  //     },
  //   },
  //   plugins: {
  //     tooltip: {
  //       callbacks: {
  //         label: function (context) {
  //           const data = context.raw;
  //           return data.descriptor;
  //         },
  //       },
  //     },
  //     legend: {
  //       display: false, // Quitar la leyenda
  //     },
  //     datalabels: {
  //       display: false, // Quitar etiquetas de datos dentro de las barras
  //     },
  //     categoryClick: {},
  //     zoom: {
  //       pan: {
  //         enabled: true,
  //         modifierKey: "shift",
  //         mode: "x",
  //       },
  //       zoom: {
  //         wheel: {
  //           enabled: true, // Deshabilitar el zoom con la rueda del ratón
  //           modifierKey: "shift", // Habilitar el zoom con la rueda del ratón + tecla Shift
  //           speed: 0.05, // Ajustar la velocidad del zoom
  //         },
  //         pinch: {
  //           enabled: true, // Habilitar el zoom por pellizco
  //         },
  //         mode: "x",
  //         drag: {
  //           enabled: true,
  //           modifierKey: "alt", // Habilitar el arrastre con la tecla Ctrl
  //         },
  //       },
  //     },
  //   },
  //   maintainAspectRatio: false,
  //   responsive: true,
  //   barThickness: Math.max(20, 40 / filteredCategories.length), // Ajusta el grosor de las barras dinámicamente
  // };

  const handleTimelineClick = (event, elements) => {
    if (elements.length > 0) {
      const element = elements[0];
      const datasetIndex = element.datasetIndex;
      const index = element.index;
      const eventData = events[index];
      onEventClick(eventData);
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
        labels: filteredCategories, // Usar las categorías filtradas
        title: {
          display: true,
          text: "Categoría",
        },
        ticks: {
          padding: 5, // Ajusta el espacio entre las etiquetas y las barras
          callback: function (value, index, values) {
            return filteredCategories[value]; // Mostrar las categorías originales
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
