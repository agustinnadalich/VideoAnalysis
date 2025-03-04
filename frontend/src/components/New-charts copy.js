import React, { useState, useEffect, useCallback } from "react";
import { getEvents } from "../services/api";
import { Bar, Pie, Scatter } from "react-chartjs-2";
import Select from "react-select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import HeatMap from "./HeatMap"; // Importa el componente HeatMap
import { Chart, registerables } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

Chart.register(...registerables);
Chart.register(zoomPlugin);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
);

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

ChartJS.register(backgroundImagePlugin);

const Charts = ({ onEventClick, onPlayFilteredEvents }) => {
  const [chartTacklesData, setChartTacklesData] = useState(null);
  const [chartMissedData, setChartMissedData] = useState(null); // Corrige el nombre aquí
  const [pieData, setPieData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [scatterData, setScatterData] = useState(null);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState([]);
  const [filterDescriptors, setFilterDescriptors] = useState([]);
  const [filterResult, setFilterResult] = useState([]);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);

  const columnsToInclude = [
    "ID",
    "ENCUADRE",
    "FECHA",
    "OPPONENT",
    "TEAM",
    "CATEGORY",
    "PLAYER",
    "SECTOR",
    "COORDINATE_X",
    "COORDINATE_Y",
    "ADVANCE",
  ];
  const columnsToTooltip = [
    "TEAM",
    "PLAYER",
    "SCRUM_RESULT",
    "ADVANCE",
    "LINE_RESULT",
    "CANTIDAD LINE",
    "LINE_POSITION",
    "LINE_THROWER",
    "BREAK_TYPE",
    "CANAL QUIEBRE",
    "PERDIDA",
    "TIPO DE INFRACCIÓN",
    "TIPO DE PIE",
    "ENCUADRE",
    "TIEMPO RUCK",
    "PUNTOS",
    "GOAL_KICK",
  ];

  const updateCharts = useCallback(
    (events, types, descriptors, result) => {
      const filteredEvents = events.filter((event) =>
        types.length ? types.includes(event.CATEGORY) : true
      );

      // console.log("Filtered Events:", filteredEvents);

      const tackleEvents = filteredEvents.filter(
        (event) => event.CATEGORY === "TACKLE"
      );

      const playerLabels = [
        ...new Set(tackleEvents.map((event) => event.PLAYER)),
      ].sort((a, b) => a - b);

      const resultLabels = ["POSITIVE", "NEUTRAL", "NEGATIVE"];

      const positiveTackles = playerLabels.map(
        (player) =>
          tackleEvents.filter(
            (event) => event.PLAYER === player && event.ADVANCE === "POSITIVE"
          ).length
      );

      const neutralTackles = playerLabels.map(
        (player) =>
          tackleEvents.filter(
            (event) => event.PLAYER === player && event.ADVANCE === "NEUTRAL"
          ).length
      );

      const negativeTackles = playerLabels.map(
        (player) =>
          tackleEvents.filter(
            (event) => event.PLAYER === player && event.ADVANCE === "NEGATIVE"
          ).length
      );

      const resultData = resultLabels.map(
        (result) =>
          tackleEvents.filter((event) => event.ADVANCE === result).length
      );

      const pieData = {
        labels: resultLabels,
        datasets: [
          {
            label: "Cantidad de tackles por avance",
            data: resultData,
            backgroundColor: resultLabels.map((label) => {
              if (label === "POSITIVE") {
                return "rgba(75, 192, 192, 0.6)";
              } else if (label === "NEGATIVE") {
                return "rgba(255, 99, 132, 0.6)";
              } else {
                return "rgba(201, 203, 207, 0.6)";
              }
            }),
          },
        ],
      };

      const barTacklesData = {
        labels: playerLabels,
        datasets: [
          {
            label: "Tackles Negativos",
            data: playerLabels.map((player) => {
              const count = tackleEvents.filter(
                (event) =>
                  event.PLAYER === player && event.ADVANCE === "NEGATIVE"
              ).length;
              return {
                x: player,
                y: count,
                id: player,
              };
            }),
            backgroundColor: "rgba(255, 99, 132, 0.6)",
          },
          {
            label: "Tackles Neutros",
            data: playerLabels.map((player) => {
              const count = tackleEvents.filter(
                (event) => event.PLAYER === player && event.ADVANCE === "NEUTRAL"
              ).length;
              return {
                x: player,
                y: count,
                id: player,
              };
            }),
            backgroundColor: "rgba(201, 203, 207, 0.6)",
          },
          {
            label: "Tackles Positivos",
            data: playerLabels.map((player) => {
              const count = tackleEvents.filter(
                (event) =>
                  event.PLAYER === player && event.ADVANCE === "POSITIVE"
              ).length;
              return {
                x: player,
                y: count,
                id: player,
              };
            }),
            backgroundColor: "rgba(75, 192, 192, 0.6)",
          },
        ],
      };

      setChartTacklesData(barTacklesData);

      const barMissedData = {
        labels: playerLabels,
        datasets: [
          {
            label: "Tackles Errados",
            data: playerLabels.map((player) => {
              const count = events.filter(
                (event) =>
                  event.PLAYER === player &&
                  event.CATEGORY === "MISSED-TACKLE" &&
                  event.TEAM !== "OPPONENT"
              ).length;
              return {
                x: player,
                y: count,
                id: player,
              };
            }),
            backgroundColor: "rgba(255, 99, 132, 0.6)",
          },
        ],
      };

      setChartMissedData(barMissedData);

      const uniqueCategories = [
        ...new Set(events.map((event) => event.CATEGORY)),
      ].filter((category) => category !== "END");
      const colors = uniqueCategories.reduce((acc, category, index) => {
        const color = `hsl(${
          (index * 360) / uniqueCategories.length
        }, 70%, 50%)`;
        acc[category] = color;
        return acc;
      }, {});

      const filteredCategories = [
        ...new Set(filteredEvents.map((event) => event.CATEGORY)),
      ];

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
                x: [event.SECOND, event.SECOND + event.DURATION], // Usar un array para representar el rango
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

      const scatterOptions = {
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                const data = context.raw;
                return data.descriptor;
              },
            },
          },
        },
      };

      const scatterData = {
        datasets: filteredEvents
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
                  x: Number(event["COORDINATE_Y"]),
                  y: Number(event["COORDINATE_X"]),
                  category: event.CATEGORY,
                  id: event.ID,
                  descriptor: descriptor,
                },
              ],
              backgroundColor: colors[event.CATEGORY],
            };
          }),
      };

      setChartTacklesData(barTacklesData);
      setChartMissedData(barMissedData);
      setPieData(pieData);
      setTimelineData(timelineData);
      setScatterData(scatterData);
      setFilteredEvents(filteredEvents);
      // console.log("Filtered Events:", filteredEvents);
      // console.log("Timeline Data:", timelineData);
    },
    [filterType, filterDescriptors, filterResult]
  );

  const fetchData = useCallback(async () => {
    try {
      const response = await getEvents();
      if (response.data && Array.isArray(response.data)) {
        const allEvents = response.data.map((event) => ({
          ...event,
          "COORDINATE_X": parseFloat(event["COORDINATE_X"]),
          "COORDINATE_Y": parseFloat(event["COORDINATE_Y"]),
          SECOND: event["SECOND"], // Asegúrate de que estos campos estén presentes
          DURATION: event["DURATION"], // Asegúrate de que estos campos estén presentes
        }));
        setEvents(allEvents);
        setFilteredEvents(allEvents);
        updateCharts(allEvents, filterType, filterDescriptors, filterResult);
      } else {
        console.error("Unexpected response format:", response);
        setError("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to fetch events");
    }
  }, [updateCharts, filterType, filterDescriptors, filterResult]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = () => {
    updateCharts(events, filterType, filterDescriptors, filterResult);
  };

  const handleTypeChange = useCallback(
    (selectedOptions) => {
      setFilterType(
        selectedOptions ? selectedOptions.map((option) => option.value) : []
      );
      handleFilterChange();
    },
    [filterDescriptors, filterResult, filterType]
  ); // Asegúrate de incluir todas las dependencias necesarias

  const handleDescriptorChange = useCallback(
    (selectedOptions) => {
      setFilterDescriptors(
        selectedOptions ? selectedOptions.map((option) => option.value) : []
      );
      handleFilterChange();
    },
    [filterDescriptors, filterResult, filterType]
  ); // Asegúrate de incluir todas las dependencias necesarias

  const handleResultChange = (selectedOptions) => {
    setFilterResult(
      selectedOptions ? selectedOptions.map((option) => option.value) : []
    );
    handleFilterChange();
  };

  const handleEventClick = useCallback(
    (event) => {
      // console.log("Event dataC:", event.SECOND);
      const startTime = event.SECOND;
      const duration = event.DURATION; // 5 segundos de duración
      // console.log("Setting tempTime and durationC:", startTime, duration);
      onEventClick({
        ...event,
        startTime,
        duration,
        isPlayingFilteredEvents: false,
      });
    },
    [onEventClick]
  );

  const typeOptions = [...new Set(events.map((event) => event.CATEGORY))].map(
    (type) => ({
      value: type,
      label: type,
    })
  );

  const descriptorOptions = [
    ...new Set(events.map((event) => event.PLAYER)),
  ].map((descriptor) => ({
    value: descriptor,
    label: descriptor,
  }));

  const resultOptions = [...new Set(events.map((event) => event.ADVANCE))].map(
    (result) => ({
      value: result,
      label: result,
    })
  );

  const handleChartClick = (event, elements) => {
    if (elements.length > 0) {
      const chart = elements[0].element.$context.chart;
      const datasetIndex = elements[0].datasetIndex;
      const index = elements[0].index;
      const clickedEventLabel = chart.data.labels[index];

      // console.log("Clicked Event Label:", clickedEventLabel);

      // Buscar todos los eventos correspondientes al grupo seleccionado
      const clickedEvents = events.filter(
        (event) => event.PLAYER === clickedEventLabel
      );

      if (clickedEvents.length > 0) {
        // console.log("Clicked Events:", clickedEvents);

        // Alternar el filtrado de eventos
        const isAlreadySelected = selectedEvents.some(
          (event) => event.PLAYER === clickedEventLabel
        );
        const updatedEvents = isAlreadySelected ? events : clickedEvents;

        // console.log("Updated Events:", updatedEvents);

        // Usar updateCharts para actualizar los gráficos con los eventos seleccionados
        updateCharts(
          updatedEvents,
          filterType,
          filterDescriptors,
          filterResult
        );

        // Actualizar el estado de los eventos seleccionados
        setSelectedEvents(isAlreadySelected ? [] : clickedEvents);
      } else {
        console.error("Events not found with label:", clickedEventLabel);
      }
    }
  };

  const handleScatterClick = (event, elements) => {
    if (elements.length > 0) {
      const chart = elements[0].element.$context.chart;
      const datasetIndex = elements[0].datasetIndex;
      const index = elements[0].index;
      const clickedEventId = chart.data.datasets[datasetIndex].data[index].id;

      // console.log("Clicked Event ID:", clickedEventId);

      // Buscar el evento completo utilizando el ID
      const clickedEvent = events.find((event) => event.ID === clickedEventId);

      if (clickedEvent) {
        // console.log("Clicked Event:", clickedEvent);

        // Alternar el filtrado de eventos
        const isAlreadySelected = selectedEvents.some(
          (event) => event.ID === clickedEventId
        );
        const updatedEvents = isAlreadySelected ? events : [clickedEvent];

        // console.log("Updated Events:", updatedEvents);

        // Usar updateCharts para actualizar los gráficos con el evento seleccionado
        updateCharts(
          updatedEvents,
          filterType,
          filterDescriptors,
          filterResult
        );

        // Actualizar el estado de los eventos seleccionados
        setSelectedEvents(isAlreadySelected ? [] : [clickedEvent]);

        // Iniciar la reproducción del video del evento seleccionado solo si no es un grupo de eventos
        if (!isAlreadySelected) {
          handleEventClick(clickedEvent);
        }
      } else {
        console.error("Event not found with ID:", clickedEventId);
      }
    }
  };

  const handleEventIdFilter = (eventId) => {
    setFilteredEvents((prev) => {
      if (prev.length === 1 && prev[0].id === eventId) {
        // Si el filtro actual es el mismo evento, quitar el filtro
        updateCharts(events, filterType, filterDescriptors, filterResult);
        return events;
      } else {
        // Si no, filtrar por el nuevo evento
        const filtered = events.filter((event) => event.id === eventId);
        updateCharts(filtered, filterType, filterDescriptors, filterResult);
        return filtered;
      }
    });
  };

  useEffect(() => {
    // console.log("Events loaded:", events); // Verifica que los eventos se carguen correctamente
  }, [events]);

  const handleTimelineClick = (event, elements) => {
    // console.log("handleTimelineClick called"); // Verifica que la función se llame
    // console.log("Events:", events); // Verifica que los eventos estén disponibles

    if (elements.length > 0) {
      const chart = elements[0].element.$context.chart;
      const datasetIndex = elements[0].datasetIndex;
      const index = elements[0].index;
      const clickedEventId = chart.data.datasets[datasetIndex].data[index].id;

      // console.log("Clicked Event ID:", clickedEventId);

      // Buscar el evento completo utilizando el ID
      const clickedEvent = events.find((event) => event.ID === clickedEventId);

      if (clickedEvent) {
        // console.log("Clicked Event:", clickedEvent);
        // console.log("Clicked Event:", clickedEvent.CATEGORY);

        // Filtrar todos los eventos de la misma CATEGORY
        // const filteredEvents = events.filter(event => event.CATEGORY === clickedEvent.CATEGORY);

        // console.log("Filtered Events:", filteredEvents);

        // Usar updateCharts para actualizar los gráficos con los eventos filtrados
        updateCharts(
          filteredEvents,
          filterType,
          filterDescriptors,
          filterResult
        );

        // Actualizar el estado de los eventos seleccionados
        setSelectedEvents(filteredEvents);

        // Iniciar la reproducción del video del evento seleccionado
        handleEventClick(clickedEvent);
      } else {
        console.error("Event not found with ID:", clickedEventId);
      }
    } else {
      // Manejar clics en las etiquetas del eje de la CATEGORY
      const yScale = event.chart.scales.y;
      if (yScale) {
        const yValue = yScale.getValueForPixel(event.y);
        const category = yScale.getLabelForValue(yValue);
        // // console.log("Clicked category:", category); // Agrega este console.log para depurar

        if (category) {
          // Verificar si ya estamos filtrando por esta CATEGORY
          const isAlreadyFiltered =
            filteredEvents.length > 0 &&
            filteredEvents[0].CATEGORY === category;

          if (isAlreadyFiltered) {
            // Si ya estamos filtrando por esta CATEGORY, desfiltrar y mostrar todos los eventos
            // console.log("Removing filter for category:", category);
            updateCharts(events, filterType, filterDescriptors, filterResult);
            setFilteredEvents(events);
          } else {
            // Si no, filtrar por la nueva CATEGORY
            // // console.log("All events:", events); // Agrega este console.log para ver todos los eventos
            const filtered = events.filter(
              (event) => event.CATEGORY === category
            );
            // // console.log("Filtered events:", filtered); // Agrega este console.log para depurar

            if (filtered.length > 0) {
              // Usar updateCharts para actualizar los gráficos con los eventos filtrados
              updateCharts(
                filtered,
                filterType,
                filterDescriptors,
                filterResult
              );

              // Actualizar el estado de los eventos filtrados
              setFilteredEvents(filtered);
            } else {
              console.error("No events found for category:", category);
            }
          }
        }
      } else {
        console.error("y scale is not defined.");
      }
    }
  };

  const categoryClickPlugin = {
    id: "categoryClick",
    afterEvent(chart, args) {
      const event = args.event;
      if (event.type === "click") {
        const yScale = chart.scales.y;
        if (yScale) {
          const yValue = yScale.getValueForPixel(event.y);
          const category = yScale.getLabelForValue(yValue);
          // // console.log("Clicked category:", category); // Agrega este console.log para depurar
          if (category) {
            handleTimelineClick(event, []);
          }
        } else {
          console.error("y scale is not defined.");
        }
      }
    },
  };

  ChartJS.register(categoryClickPlugin);

  const uniqueCategories = [
    ...new Set(events.map((event) => event.CATEGORY)),
  ].filter((category) => category !== "END");
  const colors = uniqueCategories.reduce((acc, category, index) => {
    const color = `hsl(${(index * 360) / uniqueCategories.length}, 70%, 50%)`;
    acc[category] = color;
    return acc;
  }, {});

  const filteredCategories = [
    ...new Set(filteredEvents.map((event) => event.CATEGORY)),
  ];

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
          text: "CATEGORY",
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

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {error ? (
        <p>{error}</p>
      ) : chartTacklesData &&
        chartMissedData &&
        pieData &&
        timelineData &&
        scatterData ? (
        <>
          <div
            style={{ width: "100%", overflowX: "auto", marginBottom: "20px" }}
          >
            <div
              style={{
                width: "1500px",
                height: `${Math.max(150, filteredCategories.length * 30)}px`,
              }}
            >
              {" "}
              {/* Ajusta el ancho y la altura según sea necesario */}
              <Bar data={timelineData} options={timelineOptions} />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div style={{ width: "50%", marginBottom: "20px" }}>
              <Bar
                data={chartTacklesData}
                options={{
                  onClick: handleChartClick,
                  scales: {
                    x: {
                      stacked: true,
                    },
                    y: {
                      stacked: true,
                    },
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.dataset.label;
                          const value = context.raw.y;
                          return `${label}: ${value}`;
                        },
                      },
                    },
                    datalabels: {
                      display: false,
                      // formatter: (value, context) => context.dataset.data[context.dataIndex].id // Mostrar solo el id del evento
                    },
                  },
                  maintainAspectRatio: false,
                  responsive: true,
                }}
              />
            </div>
            {/* </div>
            <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
            }}
          > */}
            <div style={{ width: "50%", marginBottom: "20px" }}>
              <Bar
                data={chartMissedData}
                options={{
                  onClick: handleChartClick,
                  scales: {
                    x: {
                      stacked: true,
                    },
                    y: {
                      stacked: true,
                    },
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.dataset.label;
                          const value = context.raw.y;
                          return `${label}: ${value}`;
                        },
                      },
                    },
                    datalabels: {
                      display: false,
                      // formatter: (value, context) => context.dataset.data[context.dataIndex].id // Mostrar solo el id del evento
                    },
                  },
                }}
              />
            </div>
          </div>
          <div style={{ width: "90%", marginBottom: "20px" }}>
            <div style={{ width: "40%" }}>
              <Pie data={pieData} options={{ onClick: handleChartClick }} />
            </div>
          </div>

          <div style={{ width: "90%", marginBottom: "20px" }}>
            <Scatter
              data={scatterData}
              options={{
                onClick: handleScatterClick, // Agregar el manejador de clics
                plugins: {
                  title: {
                    display: false, // Ocultar el título
                  },
                  legend: {
                    display: false, // Ocultar la leyenda
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const label = context.dataset.label;
                        const value = `${context.raw.x}, ${context.raw.y}`;
                        // const id = context.raw.id;
                        return `${label}: ${value} `;
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
                      display: false, // Ocultar el título del eje X
                    },
                    ticks: {
                      display: false, // Ocultar las etiquetas del eje X
                    },
                    grid: {
                      display: false, // Ocultar las líneas de la cuadrícula del eje X
                    },
                  },
                  y: {
                    type: "linear",
                    min: 0,
                    max: 70,
                    title: {
                      display: false, // Ocultar el título del eje Y
                    },
                    ticks: {
                      display: false, // Ocultar las etiquetas del eje Y
                    },
                    grid: {
                      display: false, // Ocultar las líneas de la cuadrícula del eje Y
                    },
                  },
                },
                maintainAspectRatio: false,
                backgroundImage: "/CANCHA-CORTADA.jpg", // Ruta a la imagen de la cancha
                elements: {
                  point: {
                    radius: 7, // Asignar radio 7 a los puntos
                  },
                },
              }}
              width={800}
              height={600}
            />
          </div>
          {/* <div style={{ width: "90%", marginBottom: "20px" }}>
            <HeatMap
              data={filteredEvents.map((event) => [event.y, event.x, 1])}
            />
          </div> */}
          <button onClick={() => setIsFiltersVisible(!isFiltersVisible)}>
            {isFiltersVisible ? "Ocultar Filtros" : "Mostrar Filtros"}
          </button>
          {isFiltersVisible && (
            <div style={{ marginTop: "20px" }}>
              <label>
                Tipo:
                <Select
                  isMulti
                  options={typeOptions}
                  value={typeOptions.filter((option) =>
                    filterType.includes(option.value)
                  )}
                  onChange={handleTypeChange}
                />
              </label>
              <label>
                Descriptores:
                <Select
                  isMulti
                  options={descriptorOptions}
                  value={descriptorOptions.filter((option) =>
                    filterDescriptors.includes(option.value)
                  )}
                  onChange={handleDescriptorChange}
                />
              </label>
              <label>
                Resultado:
                <Select
                  isMulti
                  options={resultOptions}
                  value={resultOptions.filter((option) =>
                    filterResult.includes(option.value)
                  )}
                  onChange={handleResultChange}
                />
              </label>
            </div>
          )}
          <button onClick={() => onPlayFilteredEvents(filteredEvents)}>
            Reproducir eventos filtrados
          </button>
          {/* <ul style={{ maxHeight: "200px", overflowY: "auto" }}>
            {filteredEvents.map((event, index) => (
              <li key={index} onClick={() => onEventClick(event)}>
                {event.type} - {event.descriptor} - Result: {event.result} :
                Second:{event.time}
              </li>
            ))}
          </ul> */}
          <h1>Eventos</h1>
          <table className="styled-table">
            <thead>
              <tr>
                {columnsToInclude.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event, index) => (
                <tr key={index} onClick={() => handleEventClick(event)}>
                  {columnsToInclude.map((col) => (
                    <td key={col}>{event[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <style jsx>{`
            .styled-table {
              border-collapse: collapse;
              margin: 25px 0;
              font-size: 0.9em;
              font-family: "Arial", sans-serif;
              min-width: 400px;
              box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
            }
            .styled-table thead tr {
              background-color: #009879;
              color: #ffffff;
              text-align: left;
            }
            .styled-table th,
            .styled-table td {
              padding: 12px 15px;
            }
            .styled-table tbody tr {
              border-bottom: 1px solid #dddddd;
            }
            .styled-table tbody tr:nth-of-type(even) {
              background-color: #f3f3f3;
            }
            .styled-table tbody tr:last-of-type {
              border-bottom: 2px solid #009879;
            }
            .styled-table tbody tr.active-row {
              font-weight: bold;
              color: #009879;
            }
          `}</style>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Charts;
