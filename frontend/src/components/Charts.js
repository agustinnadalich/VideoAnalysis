import React, { useContext, useEffect, useState, useCallback } from "react";
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
import FilterContext from "../context/FilterContext";

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

const columnsToInclude = ['ID', 'FECHA', 'OPPONENT', 'TEAM', 'CATEGORY', 'PLAYER', 'SECTOR','COORDINATE_X', ,'COORDINATE_Y', 'ADVANCE'];


ChartJS.register(backgroundImagePlugin);

const Charts = ({ onEventClick, onPlayFilteredEvents }) => {
  const { filteredEvents, setFilteredEvents, events } = useContext(FilterContext);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState([]);
  const [filterDescriptors, setFilterDescriptors] = useState([]);
  const [filterResult, setFilterResult] = useState([]);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [barData, setBarData] = useState(null);
  const [filteredJugador, setFilteredJugador] = useState(null); // Estado para almacenar el jugador filtrado


  useEffect(() => {
    if (Array.isArray(events)) {
      // Filtra los eventos de tipo "TACKLE"
      const tackles = events.filter(
        (event) => event.CATEGORY === "TACKLE" && event.PLAYER
      );

      // Agrupa los tackles por jugador
      const tacklesPorJugador = tackles.reduce((acc, event) => {
        const jugador = event.PLAYER;
        if (!acc[jugador]) {
          acc[jugador] = 0;
        }
        acc[jugador]++;
        return acc;
      }, {});

      // Prepara los datos para el gráfico de barras
      const labels = Object.keys(tacklesPorJugador);
      const data = Object.values(tacklesPorJugador);

      setBarData({
        labels,
        datasets: [
          {
            label: "tackles por Jugador",
            data,
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      });
    } else {
      setError(new Error("Invalid response format"));
    }
  }, [events]);

  const handleFilterChange = useCallback((selectedOptions, actionMeta) => {
    const { name } = actionMeta;
    const values = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    if (name === "type") {
      setFilterType(values);
    } else if (name === "descriptor") {
      setFilterDescriptors(values);
    } else if (name === "result") {
      setFilterResult(values);
    }
  }, []);

  const applyFilters = useCallback(() => {
    const filtered = events.filter(
      (event) =>
        (filterType.length ? filterType.includes(event.CATEGORY) : true) &&
        (filterDescriptors.length
          ? filterDescriptors.includes(event.PLAYER)
          : true) &&
        (filterResult.length ? filterResult.includes(event.SECOND) : true)
    );
    setFilteredEvents(filtered);
  }, [events, filterType, filterDescriptors, filterResult, setFilteredEvents]);

  const handleBarClick = useCallback(
    (elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const player = barData.labels[index];

        if (filteredJugador !== player) {
          setFilteredJugador(player); // Guardar el player filtrado
          const filtered = events.filter(
            // (event) => event.CATEGORY === "TACKLE" && event.TEAM !== "OPPONENT" && event.PLAYER === player
            (event) => event.CATEGORY === "TACKLE" && event.TEAM !== "OPPONENT" && event.PLAYER.toString() === player
          );
          setFilteredEvents(filtered);
        } else {
          // Mostrar todos los eventos de tipo "TACKLE"
            const filtered = events.filter(
            (event) => event.CATEGORY === "TACKLE" && event.TEAM !== "OPPONENT"
            );
          setFilteredJugador(null); // Resetear el player filtrado
          setFilteredEvents(filtered);
          
        }
      }
    },
    [barData, events, filteredJugador, setFilteredEvents]
  );

  const handleEventClick = useCallback(
    (event) => {
      const startTime = event.SECOND;
      const duration = event.DURATION + 5; // 5 segundos de duración
      onEventClick({ ...event, startTime, duration });
    },
    [onEventClick]
  );

  if (error) {
    return <div>Error fetching events: {error.message}</div>;
  }

  return (
    <div>
      <button onClick={() => setIsFiltersVisible(!isFiltersVisible)}>
        {isFiltersVisible ? "Ocultar Filtros" : "Mostrar Filtros"}
      </button>
      {isFiltersVisible && (
        <div>
          <Select
            isMulti
            name="type"
            options={[
              ...new Set(
                events.map((event) => ({
                  value: event.CATEGORY,
                  label: event.CATEGORY,
                }))
              ),
            ]}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={handleFilterChange}
          />
          <Select
            isMulti
            name="descriptor"
            options={[
              ...new Set(
                events.map((event) => ({
                  value: event.PLAYER,
                  label: event.PLAYER,
                }))
              ),
            ]}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={handleFilterChange}
          />
          <Select
            isMulti
            name="result"
            options={[
              ...new Set(
                events.map((event) => ({
                  value: event.SECOND,
                  label: event.SECOND,
                }))
              ),
            ]}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={handleFilterChange}
          />
          <button onClick={applyFilters}>Aplicar Filtros</button>
        </div>
      )}
      <button onClick={() => onPlayFilteredEvents(filteredEvents)}>
        Reproducir Eventos Filtrados
      </button>
      {barData && (
        <div>
          <h2>tackles por Jugador</h2>
          <Bar
            data={barData}
            options={{
              onClick: (event, elements) => handleBarClick(elements),
            }}
          />
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
      <style jsx>{`
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
      `}</style>
      {/* <ul>
        {Array.isArray(filteredEvents) && filteredEvents.map((event, index) => (
          <li key={index} onClick={() => handleEventClick(event)}>
            {event.CATEGORY} - {event.SECOND} - {event.PLAYER}
          </li>
        ))}
      </ul> */}
      {/* Comentamos los otros gráficos por ahora */}
      {/* <Pie data={pieData} /> */}
      {/* <Scatter data={scatterData} /> */}
      {/* <HeatMap data={heatMapData} /> */}
    </div>
  );
};

export default Charts;
