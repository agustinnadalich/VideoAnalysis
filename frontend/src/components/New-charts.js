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
import TacklesPieChart from './charts/TacklesPieChart';
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
  const { filterCategory, filterDescriptors, selectedTeam} = useContext(FilterContext);  
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


  

  // const updateCharts = useCallback(
  //   (events, categories, descriptors, value, team) => {
  //     if (!events) return;
  //     const filtered = events.filter(event => {
  //       const categoryMatch = categories.length === 0 || categories.includes(event.CATEGORÍA);
  //       const descriptorMatch = descriptors.length === 0 || descriptors.some(descriptor => event[descriptor] !== undefined);
  //       const valueMatch = value.length === 0 || descriptors.some(descriptor => value.includes(event[descriptor]));
  //       const teamMatch = !team || event.EQUIPO === team;
        
  //       return categoryMatch && descriptorMatch && valueMatch && teamMatch;
  //     });
      
  //     console.log(team);
  //     setFilteredEvents(filtered);
  //   },
  //   []
  // );


  const updateCharts = useCallback(
    (events, categories, filters, team) => {
      if (!events) return;
      const filtered = events.filter(event => {
        const categoryMatch = categories.length === 0 || categories.includes(event.CATEGORÍA);
        const filterMatch = filters.length === 0 || filters.every(filter => event[filter.descriptor] === filter.value);
        const teamMatch = !team || event.EQUIPO === team;
        
        return categoryMatch && filterMatch && teamMatch;
      });
      
      console.log(team);
      setFilteredEvents(filtered);
    },
    []
  );
  

  const fetchData = useCallback(async () => {
    try {
      updateCharts(events, filterCategory, filterDescriptors, selectedTeam);
    } catch (error) {
      setError(error);
    }
  }, [updateCharts, events, filterCategory, filterDescriptors, selectedTeam]);

  useEffect(() => {
    fetchData();
  }, [fetchData, events, filterCategory, filterDescriptors, selectedTeam]);

  const filteredCategories = [
    ...new Set(filteredEvents.map((event) => event.CATEGORÍA)),
  ];

  useEffect(() => {
    updateCharts(events, filterCategory, filterDescriptors, selectedTeam);
  }, [events, filterCategory, filterDescriptors, selectedTeam, updateCharts]);



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

  const handleChartClick = (event, elements, chartType) => {
    if (elements.length > 0) {
      const chart = elements[0].element.$context.chart;
      const index = elements[0].index;
      let clickedEvents = [];
  
      if (chartType === "tackle-advance") {
        const clickedLabel = chart.data.labels[index];
        clickedEvents = events.filter(
          (event) => event.CATEGORÍA === "PLACCAGGIO" && event.AVANCE === clickedLabel
        );
      } else if (chartType === "player") {
        const clickedLabel = chart.data.labels[index];
        clickedEvents = events.filter(
          (event) => event.JUGADOR === clickedLabel
        );
      } 
      // else if (chartType === "scatter") {
      //   const datasetIndex = elements[0].datasetIndex;
      //   const clickedEventId = chart.data.datasets[datasetIndex].data[index].id;
      //   clickedEvents = events.filter(
      //     (event) => event.ID === clickedEventId
      //   );
      // }
  
      if (clickedEvents.length > 0) {
        // Alternar el filtrado de eventos
        const isAlreadySelected = selectedEvents.some(
          (event) => event.ID === clickedEvents[0].ID
        );
        const updatedEvents = isAlreadySelected ? events : clickedEvents;
  
        // Usar updateCharts para actualizar los gráficos con los eventos seleccionados
        updateCharts(
          updatedEvents,
          filterCategory,
          filterDescriptors,
        );
  
        // Actualizar el estado de los eventos seleccionados
        setSelectedEvents(isAlreadySelected ? [] : clickedEvents);
  
        // Iniciar la reproducción del video del evento seleccionado solo si no es un grupo de eventos
        if (!isAlreadySelected && clickedEvents.length === 1) {
          onEventClick(clickedEvents[0]);
        }
      } else {
        console.error("No events found for the selected category and advance.");
      }
    }
  };

  // const handleEventIdFilter = (eventId) => {
  //   setFilteredEvents((prev) => {
  //     if (prev.length === 1 && prev[0].id === eventId) {
  //       // Si el filtro actual es el mismo evento, quitar el filtro
  //       updateCharts(events, filterCategory, filterDescriptors, filterValue);
  //       return events;
  //     } else {
  //       // Si no, filtrar por el nuevo evento
  //       const filtered = events.filter((event) => event.id === eventId);
  //       updateCharts(filtered, filterCategory, filterDescriptors, filterValue);
  //       return filtered;
  //     }
  //   });
  // };


  const handleTimelineClick = (eventData) => {
    onEventClick(eventData);
  };

  const handleScatterClick = (eventData) => {
    if (eventData) {
      onEventClick(eventData);
    }
      
      const updatedEvents = eventData ? [eventData] : events;

  
      updateCharts(
        updatedEvents,
        filterCategory,
        filterDescriptors
            );
    };

  return (
    <div className="charts" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {error ? (
        <p>{error}</p>
      ) : (
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
              <TimelineChart               events={events}
              filteredEvents={filteredEvents}
              columnsToTooltip={columnsToTooltip}
              colors={colors}
              onEventClick={handleEventClick}
              updateCharts={updateCharts}
              filterCategory={filterCategory}
              filterDescriptors={filterDescriptors}
              setFilteredEvents={setFilteredEvents}/>

              
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
                      <TacklesBarChart events={filteredEvents} filterCategory={filterCategory} filterDescriptors={filterDescriptors}  onChartClick={handleChartClick} />

            </div>

            <div style={{ width: "50%", marginBottom: "20px" }}>
                                    <MissedTacklesBarChart events={filteredEvents} filterCategory={filterCategory} filterDescriptors={filterDescriptors}  onChartClick={handleChartClick} />

            </div>
          </div>
          <div style={{ width: "90%", marginBottom: "20px" }}>
            <div style={{ width: "40%" }}>
            <TacklesPieChart events={filteredEvents} filterCategory={filterCategory} filterDescriptors={filterDescriptors} onChartClick={handleChartClick}/>
            </div>
          </div>

          <div style={{ width: "90%", marginBottom: "20px" }}>

          <ScatterChart events={filteredEvents} columnsToTooltip={columnsToTooltip} colors={colors} setSelectedEvents={setSelectedEvents} selectedEvents={selectedEvents} onChartClick={handleChartClick} onEventClick={handleScatterClick} width={800} height={600} />
            
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
                    filterCategory.includes(option.value)
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
                    filterValue.includes(option.value)
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
      )}
    </div>
  );
};

export default Charts;
