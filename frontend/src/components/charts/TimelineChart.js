import React, { useContext, useEffect, useState } from "react";
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
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from 'chartjs-plugin-zoom';
import FilterContext from "../../context/FilterContext";

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    annotationPlugin,
    zoomPlugin // Asegúrate de registrar el plugin de zoom
  );

  const TimelineChart = ({ events, columnsToTooltip, colors, onEventClick, filteredEvents, updateCharts, currentTime }) => {
    const { filterCategory, setFilterCategory, filterDescriptors, setFilterDescriptors, setFilteredEvents } = useContext(FilterContext);
    const [chartInstance, setChartInstance] = useState(null);

    useEffect(() => {
      if (chartInstance) {
        chartInstance.options.plugins.annotation.annotations.currentTimeLine.value = currentTime;
        chartInstance.update();
      }
    }, [currentTime, chartInstance]);

    // useEffect(() => {
    //   // console.log("Chart instance set:", chartInstance);
    // }, [chartInstance]);

    if (!filteredEvents || filteredEvents.length === 0) {
      return null; // Manejar el caso donde filteredEvents es undefined o está vacío
    }

    const filteredCategories = [
      ...new Set(filteredEvents.map((event) => event.CATEGORY).filter(category => category !== 'END')),
    ].sort(); // Asegúrate de que las categorías estén ordenadas consistentemente

    const timelineData = {
      labels: filteredCategories,
      datasets: filteredCategories.map((category) => ({
        label: category,
        data: filteredEvents
          .filter((event) => event.CATEGORY === category)
          .map((event) => {
            let descriptor = "";
            columnsToTooltip.forEach((column) => {
              if (
                event[column] !== null &&
                event[column] !== "" &&
                event[column] !== "N/A" &&
                column !== "SECOND" &&
                column !== "DURATION"
              ) {
                descriptor += `${descriptor ? ", " : ""}${column}: ${
                  event[column]
                }`;
              }
            });
            return {
              x: [event.SECOND, event.SECOND + event.DURATION +5], // Usar un array para representar el rango
              y: category,
              id: event.ID,
              descriptor: descriptor,
              SECOND: event["SECOND"],
              DURATION: event["DURATION"],
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
        const category = filteredCategories[datasetIndex];
        const eventData = filteredEvents.find(
          (event) => event.CATEGORY === category && event.ID === timelineData.datasets[datasetIndex].data[index].id
        );
        onEventClick(eventData);
      } else {
        // Manejar clics en las etiquetas del eje de la CATEGORY
        const yScale = event.chart.scales.y;
        if (yScale) {
          const yValue = yScale.getValueForPixel(event.y);
          const category = yScale.getLabelForValue(yValue);
    
          if (category) {
            // Verificar si ya estamos filtrando por esta CATEGORY
            const isAlreadyFiltered = filterCategory.includes(category);
    
            if (isAlreadyFiltered) {
              // Si ya estamos filtrando por esta CATEGORY, desfiltrar y mostrar todos los eventos
              const newFilterCategory = filterCategory.filter(cat => cat !== category);
              setFilterCategory(newFilterCategory);
              updateCharts(events, newFilterCategory, filterDescriptors);
              setFilteredEvents(events);
            } else if (events) {
              // Si no, filtrar por la nueva CATEGORY
              const filtered = events.filter(
                (event) => event.CATEGORY === category
              );
    
              if (filtered.length > 0) {
                // Usar updateCharts para actualizar los gráficos con los eventos filtrados
                const newFilterCategory = [...filterCategory, category];
                setFilterCategory(newFilterCategory);
                console.log("Filtering by category:", newFilterCategory);
                  
                // Llamar a updateCharts después de actualizar filterCategory
                setTimeout(() => {
                  updateCharts(
                    filtered,
                    newFilterCategory,
                    filterDescriptors,
                  );
                }, 0);
    
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
          chart.data.datasets[datasetIndex].minBarLength = 8;
          chart.update();
        } else {
          // Restablecer el grosor de la barra cuando el cursor no está sobre ella
          chart.data.datasets.forEach((dataset) => {
            dataset.data.forEach((data) => {
              dataset.barThickness = Math.max(20, 40 / filteredCategories.length);
              dataset.minBarLength = 3;
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
            display: false,
            text: "CATEGORY",
          },
          ticks: {
            padding: 5, // Ajusta el espacio entre las etiquetas y las barras
            callback: function (value, index, values) {
              return filteredCategories[value]; // Mostrar las CATEGORIAs originales
            },
            align: "start", // Alinear las etiquetas al principio de las barras
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
        annotation: {
          annotations: {
            currentTimeLine: {
              type: 'line',
              mode: 'vertical',
              scaleID: 'x',
              value: currentTime,
              borderColor: 'red',
              borderWidth: 2,
              label: {
                content: 'Tiempo actual',
                enabled: true,
                position: 'top'
              }
            }
          }
        },
        zoom: {
          pan: {
            enabled: true,
            modifierKey: "shift",
            mode: "x",
            touchEvents: {
              requireTwoFingers: true, // Requiere dos dedos para hacer pan en dispositivos táctiles
            },
          },
          zoom: {
            wheel: {
              enabled: false, // Deshabilitar el zoom con la rueda del ratón
              modifierKey: "shift", // Habilitar el zoom con la rueda del ratón + tecla Shift
              speed: 0.05, // Ajustar la velocidad del zoom
            },
            pinch: {
              enabled: true, // Habilitar el zoom por pellizco
            },
            mode: "x",
            drag: {
              enabled: true,
              modifierKey: "alt", // Habilitar el arrastre con la tecla Alt
              backgroundColor: 'rgba(0, 0, 255, 0.1)', // Color de fondo del recuadro de zoom
              borderColor: 'rgba(0, 0, 255, 0.5)', // Color del borde del recuadro de zoom
            },
          },
        },
      },
      maintainAspectRatio: false,
      responsive: true,
      barThickness: Math.max(20, 40 / filteredCategories.length), // Ajusta el grosor de las barras dinámicamente
      minBarLength: 3, // Ancho mínimo para que las barras sean clickeables
    };

    return <Bar data={timelineData} options={timelineOptions} ref={setChartInstance} />;
  };

  export default TimelineChart;
