import React, { useEffect, useState, useCallback } from "react";
import { getEvents } from "../services/api";
import { Bar } from "react-chartjs-2";
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
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState([]);
  const [filterDescriptors, setFilterDescriptors] = useState([]);
  const [filterResult, setFilterResult] = useState([]);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [barData, setBarData] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await getEvents();
        if (Array.isArray(response.data)) {
          console.log("Fetched events:", response.data);
          setEvents(response.data);
          setFilteredEvents(response.data);

          // Filtra los eventos de tipo "PLACCAGGIO"
          const placcaggios = response.data.filter(event => event.CATEGORÍA === 'PLACCAGGIO' && event.JUGADOR);
          console.log("Filtered placcaggios:", placcaggios);

          // Agrupa los placcaggios por jugador
          const placcaggiosPorJugador = placcaggios.reduce((acc, event) => {
            const jugador = event.JUGADOR;
            if (!acc[jugador]) {
              acc[jugador] = 0;
            }
            acc[jugador]++;
            return acc;
          }, {});
          console.log("Placcaggios por jugador:", placcaggiosPorJugador);

          // Prepara los datos para el gráfico de barras
          const labels = Object.keys(placcaggiosPorJugador);
          const data = Object.values(placcaggiosPorJugador);

          setBarData({
            labels,
            datasets: [
              {
                label: 'Placcaggios por Jugador',
                data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
            ],
          });
        } else {
          setError(new Error("Invalid response format"));
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        setError(error);
      }
    };

    fetchEvents();
  }, []);

  const handleFilterChange = useCallback((selectedOptions, actionMeta) => {
    const { name } = actionMeta;
    const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
    if (name === 'type') {
      setFilterType(values);
    } else if (name === 'descriptor') {
      setFilterDescriptors(values);
    } else if (name === 'result') {
      setFilterResult(values);
    }
  }, []);

  const applyFilters = useCallback(() => {
    const filtered = events.filter(
      (event) =>
        (filterType.length ? filterType.includes(event.CATEGORÍA) : true) &&
        (filterDescriptors.length ? filterDescriptors.includes(event.JUGADOR) : true) &&
        (filterResult.length ? filterResult.includes(event.SEGUNDO) : true)
    );
    console.log("Filtered events after applying filters:", filtered);
    setFilteredEvents(filtered);
  }, [events, filterType, filterDescriptors, filterResult]);

  const handleBarClick = useCallback((elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const jugador = barData.labels[index];
      console.log("Clicked jugador:", jugador);
      const filtered = events.filter(event => event.CATEGORÍA === 'PLACCAGGIO' && event.JUGADOR == jugador);
      console.log("Filtered events for jugador:", filtered);
      setFilteredEvents(filtered);
    }
  }, [barData, events]);

  const handleEventClick = useCallback((event) => {
    console.log("Event data:", event.SEGUNDO);
    const startTime = event.SEGUNDO;
    const duration = 5; // 5 segundos de duración
    console.log("Setting tempTime and duration:", startTime, duration);
    onEventClick({ ...event, startTime, duration });
  }, [onEventClick]);

  if (error) {
    return <div>Error fetching events: {error.message}</div>;
  }

  return (
    <div>
      <button onClick={() => setIsFiltersVisible(!isFiltersVisible)}>
        {isFiltersVisible ? 'Ocultar Filtros' : 'Mostrar Filtros'}
      </button>
      {isFiltersVisible && (
        <div>
          <Select
            isMulti
            name="type"
            options={[...new Set(events.map(event => ({ value: event.CATEGORÍA, label: event.CATEGORÍA })))]}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={handleFilterChange}
          />
          <Select
            isMulti
            name="descriptor"
            options={[...new Set(events.map(event => ({ value: event.JUGADOR, label: event.JUGADOR })))]}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={handleFilterChange}
          />
          <Select
            isMulti
            name="result"
            options={[...new Set(events.map(event => ({ value: event.SEGUNDO, label: event.SEGUNDO })))]}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={handleFilterChange}
          />
          <button onClick={applyFilters}>Aplicar Filtros</button>
        </div>
      )}
      <button onClick={() => onPlayFilteredEvents(filteredEvents)}>Reproducir Eventos Filtrados</button>
      {barData && (
        <div>
          <h2>Placcaggios por Jugador</h2>
          <Bar
            data={barData}
            options={{
              onClick: (event, elements) => handleBarClick(elements),
            }}
          />
        </div>
      )}
      <h1>Eventos</h1>
      <ul>
        {Array.isArray(filteredEvents) && filteredEvents.map((event, index) => (
          <li key={index} onClick={() => handleEventClick(event)}>
            {event.CATEGORÍA} - {event.SEGUNDO} - {event.JUGADOR}
          </li>
        ))}
      </ul>
      {/* Comentamos los otros gráficos por ahora */}
      {/* <Pie data={pieData} /> */}
      {/* <Scatter data={scatterData} /> */}
      {/* <HeatMap data={heatMapData} /> */}
    </div>
  );
};

export default Charts;