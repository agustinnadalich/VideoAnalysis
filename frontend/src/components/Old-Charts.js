import React, { useEffect, useState, useCallback } from "react";
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
  const [chartData, setChartData] = useState(null);
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

  const updateCharts = useCallback(
    (events, types, descriptors, result) => {
      const filteredEvents = events.filter(
        (event) =>
          (types.length ? types.includes(event.type) : true) &&
          (descriptors.length
            ? descriptors.includes(event.descriptor)
            : true) &&
          (result.length ? result.includes(event.result) : true)
      );

      const tackleEvents = filteredEvents.filter(
        (event) => event.type === "Tackle"
      );
      const playerLabels = [
        ...new Set(tackleEvents.map((event) => event.descriptor)),
      ];
      const resultLabels = ["Success", "Failure"];

      const successData = playerLabels.map(
        (player) =>
          tackleEvents.filter(
            (event) => event.descriptor === player && event.result === "Success"
          ).length
      );

      const failureData = playerLabels.map(
        (player) =>
          tackleEvents.filter(
            (event) => event.descriptor === player && event.result === "Failure"
          ).length
      );

      const resultData = resultLabels.map(
        (result) =>
          tackleEvents.filter((event) => event.result === result).length
      );

      const pieData = {
        labels: resultLabels,
        datasets: [
          {
            label: "Resultados de Tackles",
            data: resultData,
            backgroundColor: resultLabels.map((label) => {
              if (label === "Success") {
                return "rgba(75, 192, 192, 0.6)";
              } else if (label === "Failure") {
                return "rgba(255, 99, 132, 0.6)";
              } else {
                return "rgba(201, 203, 207, 0.6)";
              }
            }),
          },
        ],
      };
    const barData = {
      labels: playerLabels,
      datasets: [
        {
        label: "Tackles Exitosos",
        data: tackleEvents
          .filter((event) => event.result === "Success")
          .map((event) => ({
            x: playerLabels.indexOf(event.descriptor),
            y: successData[playerLabels.indexOf(event.descriptor)],
            id: event.id,
          })),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
        {
        label: "Tackles Fallidos",
        data: tackleEvents
          .filter((event) => event.result === "Failure")
          .map((event) => ({
            x: playerLabels.indexOf(event.descriptor),
            y: failureData[playerLabels.indexOf(event.descriptor)],
            id: event.id,
          })),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };

      const colors = {
        Tackle: "rgba(75, 192, 192, 0.6)",
        Ruck: "rgba(255, 159, 64, 0.6)",
        // Add more event types and their corresponding colors here
      };

      const timelineData = {
        labels: ["Tackle", "Ruck"],
        datasets: Object.keys(colors).map((type) => ({
          label: type,
          data: filteredEvents
            .filter((event) => event.type === type)
            .map((event) => ({
              x: [event.time, event.time + event.duration], // Inicio y fin de la barra
              y: event.type,
              id: event.id,
              descriptor: event.descriptor,
              result: event.result,
            })),
          backgroundColor: colors[type],
          barThickness: 25, // Ajusta el grosor de las barras
        })),
      };

      const scatterData = {
        datasets: filteredEvents.map((event) => ({
          label: `${event.type} - ${event.descriptor}`,
          data: [{ x: event.x, y: event.y, descriptor: event.descriptor , id: event.id}],
          backgroundColor:
            event.result === "Success"
              ? "rgba(75, 192, 192, 0.6)"
              : "rgba(255, 99, 132, 0.6)",
        })),
      };

      setChartData(barData);
      setPieData(pieData);
      setTimelineData(timelineData);
      setScatterData(scatterData);
      setFilteredEvents(filteredEvents);
    },
    [filterType, filterDescriptors, filterResult]
  );

  const fetchData = useCallback(async () => {
    try {
      const response = await getEvents();
      if (response.data && Array.isArray(response.data)) {
        setEvents(response.data);
        setFilteredEvents(response.data);
        updateCharts(
          response.data,
          filterType,
          filterDescriptors,
          filterResult
        );
      } else {
        console.error("Unexpected response format:", response);
        setError("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to fetch events");
    }
  }, [updateCharts]);

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

  const typeOptions = [...new Set(events.map((event) => event.type))].map(
    (type) => ({
      value: type,
      label: type,
    })
  );

  const descriptorOptions = [
    ...new Set(events.map((event) => event.descriptor)),
  ].map((descriptor) => ({
    value: descriptor,
    label: descriptor,
  }));

  const resultOptions = [...new Set(events.map((event) => event.result))].map(
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
      const label = chart.data.labels[index];

      if (
        chart.data.datasets[datasetIndex].label === "Tackles Exitosos" ||
        chart.data.datasets[datasetIndex].label === "Tackles Fallidos"
      ) {
        setFilterDescriptors((prev) =>
          prev.includes(label)
            ? prev.filter((item) => item !== label)
            : [...new Set([...prev, label])]
        );
      } else if (
        chart.data.datasets[datasetIndex].label === "Resultados de Tackles"
      ) {
        setFilterResult((prev) =>
          prev.includes(label)
            ? prev.filter((item) => item !== label)
            : [...new Set([...prev, label])]
        );
      }

      handleFilterChange();
    }
  };

  const handleTimelineClick = (event, elements) => {
    if (elements.length > 0) {
        const chart = elements[0].element.$context.chart;
        const datasetIndex = elements[0].datasetIndex;
        const index = elements[0].index;
        const clickedEventId = chart.data.datasets[datasetIndex].data[index].id;

        handleEventIdFilter(clickedEventId);
    }
};

const handleScatterClick = (event, elements) => {
    if (elements.length > 0) {
        const chart = elements[0].element.$context.chart;
        const datasetIndex = elements[0].datasetIndex;
        const index = elements[0].index;
        const clickedEventId = chart.data.datasets[datasetIndex].data[index].id;

        handleEventIdFilter(clickedEventId);
    }
};


const handleEventIdFilter = (eventId) => {
    setFilteredEvents(prev => {
        if (prev.length === 1 && prev[0].id === eventId) {
            // Si el filtro actual es el mismo evento, quitar el filtro
            updateCharts(events, filterType, filterDescriptors, filterResult);
            return events;
        } else {
            // Si no, filtrar por el nuevo evento
            const filtered = events.filter(event => event.id === eventId);
            updateCharts(filtered, filterType, filterDescriptors, filterResult);
            return filtered;
        }
    });
};

return (
    <div
        style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
        {error ? (
            <p>{error}</p>
        ) : chartData && pieData && timelineData && scatterData ? (
            <>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        width: "100%",
                    }}
                >
                    <div style={{ width: "40%", marginBottom: "20px" }}>
                        <Bar
                            data={chartData}
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
                                                const event = context.raw;
                                                return `${event.id}: ${event.result}`;
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
                    <div style={{ width: "40%" }}>
                        <Pie data={pieData} options={{ onClick: handleChartClick }} />
                    </div>
                </div>
                <div style={{ width: "90%", marginBottom: "20px" }}>
                    <Bar
                        data={timelineData}
                        options={{
                            onClick: handleTimelineClick,
                            indexAxis: "y", // Configurar el gráfico de barras para que sea horizontal
                            scales: {
                                x: {
                                    type: "linear",
                                    position: "bottom",
                                    min: 0,
                                    max: 60,
                                    title: {
                                        display: true,
                                        text: "Tiempo (segundos)",
                                    },
                                },
                                y: {
                                    type: "category",
                                    labels: (event) => event.typ,
                                    title: {
                                        display: false,
                                        text: "Jugador",
                                    },
                                },
                            },
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: (context) => {
                                            const event = context.raw;
                                            return `${event.id}: ${event.result}`;
                                        },
                                    },
                                },
                                datalabels: {
                                    display: false,
                                    // formatter: (value, context) => context.dataset.data[context.dataIndex].id // Mostrar solo el id del evento
                                },
                            },
                            maintainAspectRatio: false, // Permitir que el gráfico ocupe solo el espacio necesario
                        }}
                        height={130} // Ajustar el alto del gráfico según el número de eventos
                    />
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
                                            const event = context.raw;
                                            return `${event.descriptor}`;
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
                                    min: 0,
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
                                    max: 100,
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
                <div style={{ width: "90%", marginBottom: "20px" }}>
                    <HeatMap data={filteredEvents.map(event => [event.y, event.x, 1])} />
                </div>
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
                <ul style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {filteredEvents.map((event, index) => (
                        <li key={index} onClick={() => onEventClick(event)}>
                            {event.type} - {event.descriptor} - Result: {event.result} :
                            Second:{event.time}
                        </li>
                    ))}
                </ul>
            </>
        ) : (
            <p>Loading...</p>
        )}
    </div>
);
};

export default Charts;
