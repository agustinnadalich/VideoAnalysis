import React, { useState, useEffect, useCallback, useContext } from "react";
import { getEvents } from "../services/api";
import Select from "react-select";
import { Chart, registerables, CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from 'react-chartjs-2';
import HeatMap from "./HeatMap"; // Importa el componente HeatMap
import FilterContext from '../context/FilterContext';
import TacklesBarChart from './charts/TacklesBarChart';
import MissedTacklesBarChart from './charts/MissedTacklesBarChart';
import PieChart from './charts/PieChart';
import ScatterChart from './charts/ScatterChart';
import TimelineChart from './charts/TimelineChart';

Chart.register(...registerables);
Chart.register(zoomPlugin);

Chart.register(
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

Chart.register(backgroundImagePlugin);

const columnsToTooltip = [
  "EQUIPO",
  "JUGADOR",
  "RESULTADO SCRUM",
  "AVANCE",
  "RESULTADO LINE",
  "CANTIDAD LINE",
  "POSICION LINE",
  "TIRADOR LINE",
  "TIPO QUIEBRE",
  "CANAL QUIEBRE",
  "PERDIDA",
  "TIPO DE INFRACCIÓN",
  "TIPO DE PIE",
  "ENCUADRE",
  "TIEMPO RUCK",
  "PUNTOS",
  "PALOS",
];

const columnsToInclude = [
  "ID",
  "ENCUADRE",
  "FECHA",
  "RIVAL",
  "EQUIPO",
  "CATEGORÍA",
  "JUGADOR",
  "SECTOR",
  "COORDENADA X",
  "COORDENADA Y",
  "AVANCE",
];



const Charts = ({ onEventClick, onPlayFilteredEvents, events }) => {
  const [chartTacklesData, setChartTacklesData] = useState(null);
  const [chartMissedData, setChartMissedData] = useState(null); // Corrige el nombre aquí
  const { filterType, filterDescriptors, filterResult } = useContext(FilterContext);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  
  
  


  const uniqueCategories = [
    ...new Set(events.map((event) => event.CATEGORÍA)),
  ].filter((category) => category !== "FIN");
  const colors = uniqueCategories.reduce((acc, category, index) => {
    const color = `hsl(${
      (index * 360) / uniqueCategories.length
    }, 70%, 50%)`;
    acc[category] = color;
    return acc;
  }, {});


  const tackleEvents = filteredEvents.filter(
    (event) => event.CATEGORÍA === "PLACCAGGIO"
  );

  const playerLabels = [
    ...new Set(tackleEvents.map((event) => event.JUGADOR)),
  ].sort((a, b) => a - b);

  const avanceLabels = ["POSITIVO", "NEUTRO", "NEGATIVO"];


  const avanceData = avanceLabels.map(
    (result) =>
      tackleEvents.filter((event) => event.AVANCE === result).length
  );

  

  const updateCharts = useCallback(
    (events, types, descriptors, result) => {
      if (!events) return;
      const filtered = events.filter(event => {
        const typeMatch = types.length === 0 || types.includes(event.CATEGORÍA);
        const descriptorMatch = descriptors.length === 0 || descriptors.some(descriptor => event[descriptor] !== undefined);
        const resultMatch = result.length === 0 || result.includes(event.AVANCE);
        return typeMatch && descriptorMatch && resultMatch;
      });

      setFilteredEvents(filtered);
      
    },
    [filterType, filterDescriptors, filterResult]
  );

  const fetchData = useCallback(async () => {
    try {
      updateCharts(events, filterType, filterDescriptors, filterResult);
    } catch (error) {
      setError(error);
    }
  }, [updateCharts, events, filterType, filterDescriptors, filterResult]);

  useEffect(() => {
    const barTacklesData = {
      labels: playerLabels,
      datasets: ["NEGATIVO", "NEUTRO", "POSITIVO"].map((avance, index) => {
        const colors = ["rgba(255, 99, 132, 0.6)", "rgba(201, 203, 207, 0.6)", "rgba(75, 192, 192, 0.6)"];
        return {
          label: `Tackles ${avance}`,
          data: playerLabels.map((player) => {
            const count = tackleEvents.filter(
              (event) => event.JUGADOR === player && event.AVANCE === avance
            ).length;
            return {
              x: player,
              y: count,
              id: player,
            };
          }),
          backgroundColor: colors[index],
        };
      }),
    };


    setChartTacklesData(barTacklesData);


    fetchData();
  }, [fetchData, events, filterType, filterDescriptors, filterResult]);

  const filteredCategories = [
    ...new Set(filteredEvents.map((event) => event.CATEGORÍA)),
  ];

  const handleEventClick = useCallback(
    (event) => {
      // console.log("Event dataC:", event.SEGUNDO);
      const startTime = event.SEGUNDO;
      const duration = event.DURACION; // 5 segundos de duración
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

  const handleChartClick = (event, elements) => {
    if (elements.length > 0) {
      const chart = elements[0].element.$context.chart;
      const datasetIndex = elements[0].datasetIndex;
      const index = elements[0].index;
      const clickedEventLabel = chart.data.labels[index];

      // console.log("Clicked Event Label:", clickedEventLabel);

      // Buscar todos los eventos correspondientes al grupo seleccionado
      const clickedEvents = events.filter(
        (event) => event.JUGADOR === clickedEventLabel
      );

      if (clickedEvents.length > 0) {
        // console.log("Clicked Events:", clickedEvents);

        // Alternar el filtrado de eventos
        const isAlreadySelected = selectedEvents.some(
          (event) => event.JUGADOR === clickedEventLabel
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


  const handleTimelineClick = (eventData) => {
    onEventClick(eventData);
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

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {error ? (
        <p>{error}</p>
      ) : 
        chartTacklesData
        // chartMissedData &&
        // pieData &&
        // TimelineChart 
        // &&
        // scatterData 
        ? (
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
              <TimelineChart events={filteredEvents} columnsToTooltip={columnsToTooltip} colors={colors} onEventClick={handleTimelineClick} />

              
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
                      <TacklesBarChart events={filteredEvents} filterType={filterType} filterDescriptors={filterDescriptors} filterResult={filterResult} onEventClick={handleChartClick} />

            </div>

            <div style={{ width: "50%", marginBottom: "20px" }}>
                                    <MissedTacklesBarChart events={filteredEvents} filterType={filterType} filterDescriptors={filterDescriptors} filterResult={filterResult} onEventClick={handleChartClick} />

            </div>
          </div>
          <div style={{ width: "90%", marginBottom: "20px" }}>
            <div style={{ width: "40%" }}>
            <PieChart events={filteredEvents} filterType={filterType} filterDescriptors={filterDescriptors} filterResult={filterResult} onEventClick={handleChartClick}/>
            </div>
          </div>

          <div style={{ width: "90%", marginBottom: "20px" }}>

            <ScatterChart events={filteredEvents} columnsToTooltip={columnsToTooltip} colors={colors} onChartClick={handleScatterClick} width={800} height={600} />
            
          </div>
          {/* <div style={{ width: "90%", marginBottom: "20px" }}>
            <HeatMap
              data={filteredEvents.map((event) => [event.y, event.x, 1])}
            />
          </div> */}
          {/* <button onClick={() => setIsFiltersVisible(!isFiltersVisible)}>
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
          </button> */}
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
