import { useFilterContext } from "../context/FilterContext";
import TimelineChart from "./charts/TimelineChart";

const Charts = () => {
  const { filteredEvents } = useFilterContext(); // ✅ SOLO AQUÍ ADENTRO

  return (
    <div className="charts">
      <div className="w-full h-48">
        <TimelineChart
          filteredEvents={filteredEvents}
          columnsToTooltip={["CATEGORY", "PLAYER", "SECOND"]}
          colors={{}}
          onEventClick={() => {}}
        />
      </div>
      <h1>Eventos</h1>
    </div>
  );
};

export default Charts;
