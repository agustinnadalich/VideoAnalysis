import React, { useState, useEffect, useCallback, useContext } from "react";
import { Chart, registerables, CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import ChartDataLabels from "chartjs-plugin-datalabels";
import FilterContext from '../context/FilterContext';
import TacklesBarChart from './charts/TacklesBarChart';
import MissedTacklesBarChart from './charts/MissedTacklesBarChart';
import AdvancePieChart from './charts/AdvancePieChart';
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
  "CATEGORIA",
  "JUGADOR",
  "SECTOR",
  "COORDENADA X",
  "COORDENADA Y",
  "AVANCE",
];

const Charts = ({ onEventClick, onPlayFilteredEvents }) => {
  const { filterCategory, setFilterCategory, filterDescriptors, selectedTeam, events, filteredEvents, setFilteredEvents, setFilterDescriptors } = useContext(FilterContext);
  const [error, setError] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);

  const uniqueCategories = [
    ...new Set(events.map((event) => event.CATEGORIA)),
  ].filter((category) => category !== "FIN");
  const colors = uniqueCategories.reduce((acc, category, index) => {
    const color = `hsl(${
      (index * 360) / uniqueCategories.length
    }, 70%, 50%)`;
    acc[category] = color;
    return acc;
  }, {});

  const tackleEvents = filteredEvents.filter(
    (event) => event.CATEGORIA === "PLACCAGGIO"
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
    (events, categories, filters, team) => {
      if (!events) return;
      const filtered = events.filter(event => {
        const categoryMatch = categories.length === 0 || categories.includes(event.CATEGORIA);
        const filterMatch = filters.length === 0 || filters.every(filter => event[filter.descriptor] === filter.value);
        const teamMatch = !team || event.EQUIPO === team;
        
        return categoryMatch && filterMatch && teamMatch;
      });
      
      setFilteredEvents(filtered);
  
      // console.log("Filtered en updateCharts:", filtered);
    },
    [setFilteredEvents]
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

  useEffect(() => {
    // console.log("filteredEvents en New-charts.js:", filteredEvents);
  }, [filteredEvents]);

  const filteredCategories = [
    ...new Set(filteredEvents.map((event) => event.CATEGORIA)),
  ];

  const handleEventClick = useCallback(
    (event) => {
      const startTime = event.SEGUNDO;
      const duration = event.DURACION; // 5 segundos de duración
      onEventClick({
        ...event,
        startTime,
        duration,
        isPlayingFilteredEvents: false,
      });
    },
    [onEventClick]
  );

  const handleChartClick = (event, elements, chartType, additionalFilters = []) => {
    if (elements.length > 0) {
      const chart = elements[0].element.$context.chart;
      const index = elements[0].index;
      let clickedEvents = [];
      let newFilter = null;
  
      if (chartType === "advance-chart") {
        const clickedLabel = chart.data.labels[index];
        clickedEvents = filteredEvents.filter(
          (event) => event.AVANCE === clickedLabel
        );
        const newFilterCategory = additionalFilters.find(filter => filter.descriptor === "CATEGORIA").value;
        if (filterCategory.includes(newFilterCategory)) {
          setFilterCategory(filterCategory.filter(category => category !== newFilterCategory));
        } else {
          setFilterCategory([...filterCategory, newFilterCategory]);
        }
      } else if (chartType === "player") {
        const clickedLabel = chart.data.labels[index];
        clickedEvents = events.filter(
          (event) => event.JUGADOR === clickedLabel
        );
        newFilter = { descriptor: "JUGADOR", value: clickedLabel };
      }
  
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
  
        // Actualizar los filtros en el contexto
        if (newFilter || additionalFilters.length > 0) {
          const filtersToAdd = newFilter
            ? [newFilter, ...additionalFilters.filter(filter => filter.descriptor !== "CATEGORIA")]
            : additionalFilters.filter(filter => filter.descriptor !== "CATEGORIA");
          setFilterDescriptors((prevFilters) => {
            const updatedFilters = isAlreadySelected
              ? prevFilters.filter(
            (filter) =>
              !filtersToAdd.some(
                (newFilter) =>
            filter.descriptor === newFilter.descriptor &&
            filter.value === newFilter.value
              )
          )
              : [...prevFilters, ...filtersToAdd];
            return updatedFilters;
          });
        }
      } else {
        console.error("No events found for the selected category and advance.");
      }
    }
  };

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
      {error && <div>Error: {error.message}</div>}

      <div style={{ width: "100%", overflowX: "auto", marginBottom: "20px" }}>
        <div style={{ width: "1500px", height: `${Math.max(150, filteredCategories.length * 30)}px` }}>
          <TimelineChart
            events={events}
            filteredEvents={filteredEvents}
            columnsToTooltip={columnsToTooltip}
            colors={colors}
            onEventClick={handleEventClick}
            updateCharts={updateCharts}
            filterCategory={filterCategory}
            filterDescriptors={filterDescriptors}
            setFilteredEvents={setFilteredEvents}
            setFilterDescriptors={setFilterDescriptors} // Pasar setFilterDescriptors como prop
          />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
        {filteredEvents.some(event => event.CATEGORIA === "PLACCAGGIO") && (
          <div style={{ width: "50%", marginBottom: "20px" }}>
            <TacklesBarChart events={filteredEvents} filterCategory={filterCategory} filterDescriptors={filterDescriptors} onChartClick={handleChartClick} />
          </div>
        )}
        {filteredEvents.some(event => event.CATEGORIA === "PLAC-SBAGLIATTO") && (
          <div style={{ width: "50%", marginBottom: "20px" }}>
            <MissedTacklesBarChart events={filteredEvents} filterCategory={filterCategory} filterDescriptors={filterDescriptors} onChartClick={handleChartClick} />
          </div>
        )}
      </div>
      <div style={{ width: "90%", marginBottom: "20px", display: "flex", justifyContent: "space-around" }}>
        {filteredEvents.some(event => event.CATEGORIA === "PLACCAGGIO") && (
          <div style={{ width: "40%" }}>
            <AdvancePieChart events={filteredEvents} onChartClick={handleChartClick} category="PLACCAGGIO" />
          </div>
        )}
        {filteredEvents.some(event => event.CATEGORIA === "MISCHIA") && (
          <div style={{ width: "40%" }}>
            <AdvancePieChart events={filteredEvents} onChartClick={handleChartClick} category="MISCHIA" />
          </div>
        )}
      </div>
      {filteredEvents.some(event => event["COORDENADA X"] !== null) && (
        <div style={{ width: "90%", marginBottom: "20px" }}>
          <ScatterChart events={filteredEvents} columnsToTooltip={columnsToTooltip} colors={colors} setSelectedEvents={setSelectedEvents} selectedEvents={selectedEvents} onChartClick={handleChartClick} onEventClick={handleScatterClick} width={800} height={600} />
        </div>
      )}
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
      <style jsx="true">{`
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
    </div>
  );
};

export default Charts;
