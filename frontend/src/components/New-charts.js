import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import {
  Chart,
  registerables,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import ChartDataLabels from "chartjs-plugin-datalabels";
import FilterContext from "../context/FilterContext";
import TacklesBarChart from "./charts/TacklesBarChart";
import MissedTacklesBarChart from "./charts/MissedTacklesBarChart";
import AdvancePieChart from "./charts/AdvancePieChart";
import ScatterChart from "./charts/ScatterChart";
import TimelineChart from "./charts/TimelineChart";
import PlayerPointsChart from "./charts/PlayerPointsChart";
import PointsTimeChart from "./charts/PointsTimeChart";
import TacklesTimeChart from "./charts/TacklesTimeChart";
import CoustomTimeChart from "./charts/CoustomTimeChart";
import annotationPlugin from 'chartjs-plugin-annotation';
import FilterProvider from '../context/FilterProvider'; // Importa FilterProvider
import Carousel from './Carousel'; // Asegúrate de importar el componente Carousel

Chart.register(annotationPlugin);
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

const columnsToTooltip = ['TEAM', 'PLAYER', 'SCRUM_RESULT', 'ADVANCE', 'LINE_RESULT', 'LINE_QUANTITY', 'LINE_POSITION', 'LINE_THROWER', 'LINE_RECEIVER', 'BREAK_TYPE', 'BREAK_CHANNEL', 'TURNOVER_TYPE', 'INFRACTION_TYPE', 'KICK_TYPE', 'SQUARE', 'RUCK_SPEED', 'POINTS', 'POINTS(VALUE)', 'PERIODS', 'GOAL_KICK', 'TRY_ORIGIN']

const columnsToInclude = [
  "ID",
  // "SQUARE",
  "GAME",
  "OPPONENT",
  "TEAM",
  "CATEGORY",
  "PLAYER",
  // "SECTOR",
  // "COORDINATE_X",
  // "COORDINATE_Y",
  // "ADVANCE",
];

// Define initialResponse antes de usarlo
const initialResponse = {
  events: [], // Aquí puedes agregar los eventos iniciales si los tienes
  header: {}, // Aquí puedes agregar la información del partido inicial si la tienes
};

const Charts = ({ onEventClick, onPlayFilteredEvents, currentTime }) => {
  const {
    filterCategory,
    setFilterCategory,
    filterDescriptors,
    selectedTeam,
    events,
    filteredEvents,
    setFilteredEvents,
    setFilterDescriptors,
  } = useContext(FilterContext);
  const [error, setError] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const carouselRef = useRef(null);

  const uniqueCategories = useMemo(() => [
    ...new Set(events.map((event) => event.CATEGORY)),
  ].filter((category) => category !== "END"), [events]);

  const colors = useMemo(() => uniqueCategories.reduce((acc, category, index) => {
    const color = `hsl(${(index * 360) / uniqueCategories.length}, 70%, 50%)`;
    acc[category] = color;
    return acc;
  }, {}), [uniqueCategories]);

  const tackleEvents = useMemo(() => filteredEvents.filter(
    (event) => event.CATEGORY === "TACKLE"
  ), [filteredEvents]);

  const playerLabels = useMemo(() => [
    ...new Set(tackleEvents.map((event) => event.PLAYER)),
  ].sort((a, b) => a - b), [tackleEvents]);

  const avanceLabels = ["POSITIVE", "NEUTRAL", "NEGATIVE"];

  const avanceData = useMemo(() => avanceLabels.map(
    (result) => tackleEvents.filter((event) => event.ADVANCE === result).length
  ), [tackleEvents]);

  const updateCharts = useCallback(
    (events, categories, filters, team) => {
      if (!events) return;
      const filtered = events.filter((event) => {
        const categoryMatch =
          categories.length === 0 || categories.includes(event.CATEGORY);
        const filterMatch =
          filters.length === 0 ||
          filters.every((filter) => {
            const eventValue = event[filter.descriptor];
            // Verifica si el valor es un array y si incluye el valor buscado
            if (Array.isArray(eventValue)) {
              return eventValue.includes(filter.value);
            }
            // Comparación normal para valores no array
            return eventValue === filter.value;
          });
        const teamMatch = !team || event.TEAM === team;
  
        return categoryMatch && filterMatch && teamMatch;
      });
  
      setFilteredEvents(filtered);
  
      if (categories.length > 0) {
        const categoryTabId = `${categories[0].toLowerCase()}-tab`;
        const categoryTab = document.getElementById(categoryTabId);
        if (categoryTab) {
          categoryTab.scrollIntoView({ behavior: 'smooth' });
        }
      }
  
      setFilterCategory(categories); // Actualizar filterCategory aquí
    },
    [setFilteredEvents, setFilterCategory]
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
    ...new Set(filteredEvents.map((event) => event.CATEGORY)),
  ];

  const handleEventClick = useCallback(
    (event) => {
      const startTime = event.SECOND;
      const duration = event.DURATION; // 5 segundos de duración
      onEventClick({
        ...event,
        startTime,
        duration,
        isPlayingFilteredEvents: false,
      });
    },
    [onEventClick]
  );

  const parseTime = (timeString) => {
    const [minutes, seconds] = timeString.split(":").map(Number);
    return minutes + seconds / 60;
  };

  const handleChartClick = (
    event,
    elements,
    chart,
    chartType,
    tabId,
    additionalFilters = []
  ) => {

    if (!tabId) {
      return;
    }
    
    
    if (elements.length > 0) {
      const index = elements[0].index;
      let clickedEvents = [];
      let newFilter = null;
  
      if (chartType === "advance-chart") {
        const clickedLabel = chart.data.labels[index];
        clickedEvents = filteredEvents.filter(
          (event) => event.ADVANCE === clickedLabel
        );
      } else if (chartType === "player") {
        const clickedLabel = chart.data.labels[index];
        clickedEvents = filteredEvents.filter(
          (event) => event.PLAYER === clickedLabel
        );
        newFilter = { descriptor: "PLAYER", value: clickedLabel };
      } else if (chartType === "time") {
        const clickedLabel = chart.data.labels[index];
        clickedEvents = filteredEvents.filter(
          (event) => event.Time_Group === clickedLabel
        );
        newFilter = { descriptor: "Time_Group", value: clickedLabel };
      } else if (chartType === "turnover_type") {
        const clickedLabel = chart.data.labels[index].split(' (')[0];
        clickedEvents = filteredEvents.filter(
          (event) => event.TURNOVER_TYPE === clickedLabel
        );
        newFilter = { descriptor: "TURNOVER_TYPE", value: clickedLabel };
      } else if (chartType === "points_type") {                     
        const clickedLabel = chart.data.labels[index].split(' (')[0];
        clickedEvents = filteredEvents.filter(
          (event) => event.POINTS === clickedLabel
        );
        newFilter = { descriptor: "POINTS", value: clickedLabel };
      }
       else if (chartType === "penalty_cause") {
        const clickedLabel = chart.data.labels[index].split(' (')[0];
        clickedEvents = filteredEvents.filter(
          (event) => event.INFRACTION_TYPE === clickedLabel
        );
        newFilter = { descriptor: "INFRACTION_TYPE", value: clickedLabel };
      } else if (chartType === "TACKLE" || "MISSED_TACKLE") {
        const categoryFilter = additionalFilters.find(filter => filter.descriptor === "CATEGORY");
        const category = categoryFilter ? categoryFilter.value : chartType;
        clickedEvents = filteredEvents.filter(
          (event) => event.CATEGORY === category
        );
        newFilter = { descriptor: "CATEGORY", value: category };
      } 
      if (clickedEvents.length > 0) {
        const isAlreadySelected = selectedEvents.some(
          (event) => event.ID === clickedEvents[0].ID
        );
        const updatedEvents = isAlreadySelected ? events : clickedEvents;
  
        updateCharts(updatedEvents, filterCategory, filterDescriptors, selectedTeam);
        setSelectedEvents(isAlreadySelected ? [] : clickedEvents);
  
        if (!isAlreadySelected && clickedEvents.length === 1) {
          onEventClick(clickedEvents[0]);
        }
  
        if (newFilter || additionalFilters.length > 0) {
          const filtersToAdd = newFilter
            ? [
                newFilter,
                ...additionalFilters.filter(
                  (filter) => filter.descriptor !== "CATEGORY"
                ),
              ]
            : additionalFilters.filter(
                (filter) => filter.descriptor !== "CATEGORY"
              );
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
        
        // Mantener la pestaña activa al desfiltrar
        if (carouselRef.current) {
          // Buscar la pestaña basada en su `id`, no en su índice dinámico
          const tabButton = document.querySelector(`.tab-button[aria-controls="${tabId}"]`);
        
          if (tabButton) {
            const tabIndex = Array.from(document.querySelectorAll(".tab-button")).indexOf(tabButton);
            carouselRef.current.setActiveTab(tabIndex);
            setActiveTab(tabIndex); // Mantener la pestaña activa correctamente
          } else {
            console.error("No se encontró la pestaña, manteniendo la actual.");
          }
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

    updateCharts(updatedEvents, filterCategory, filterDescriptors);
  };

  return (
    <FilterProvider initialResponse={initialResponse}>
      <div
        className="charts"
        style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        {error && <div>Error: {error.message}</div>}

        <div style={{ width: "100%", marginBottom: "20px" }}>
          <div
            style={{
              width: "1500px",
              height: `${Math.max(150, filteredCategories.length * 30)}px`,
            }}
          >
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
              currentTime={currentTime}
            />
          </div>
        </div>
        <Carousel ref={carouselRef} filteredEvents={filteredEvents} handleChartClick={handleChartClick} activeTab={activeTab} setActiveTab={setActiveTab} />
        {filteredEvents.some((event) => event["COORDINATE_X"] !== null) && (
          <div style={{ width: "90%", marginBottom: "20px" }}>
            <ScatterChart
              events={filteredEvents}
              columnsToTooltip={columnsToTooltip}
              colors={colors}
              setSelectedEvents={setSelectedEvents}
              selectedEvents={selectedEvents}
              onChartClick={handleChartClick}
              onEventClick={handleScatterClick}
              width={800}
              height={600}
            />
          </div>
        )}
      <h1>Eventos</h1>
      <div className="table-container">
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
      </div>
        {/* <style jsx="true">{`
          .styled-table {
            border-collapse: collapse;
            margin: 25px 0;
            font-size: 0.9em;
            font-family: 'Arial', sans-serif;
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
          .table-container {
            overflow-x: auto;
            width: 95%;
            display: flex;
            justify-content: center;
          }
        `}</style> */}
      </div>
    </FilterProvider>
  );
};

export default Charts;
