import React from "react";
import { useFilterContext } from "../context/FilterContext";
import TimelineChart from "./charts/TimelineChart";
import EventsTable from "./EventsTable";
import TacklesBarChart from "./charts/TacklesBarChart";
import AdvancePieChart from "./charts/AdvancePieChart";
import TacklesEffectivityChart from "./charts/TacklesEffectivityChart";
import { getTeamFromEvent, detectOurTeams, normalizeString } from "../utils/teamUtils";

interface ChartsProps {
  events?: any[];
  filteredEvents?: any[];
  setFilteredEvents?: (events: any[]) => void;
  filterDescriptors?: any[];
  setFilterDescriptors?: (filters: any[]) => void;
  onEventClick?: (event: any) => void;
  onPlayFilteredEvents?: (events: any[]) => void;
  currentTime?: number;
}

const Charts: React.FC<ChartsProps> = ({
  events = [],
  filteredEvents = [],
  onEventClick = () => {},
  onPlayFilteredEvents = () => {},
  currentTime = 0,
  setFilterDescriptors
}) => {
  const { filteredEvents: contextFilteredEvents, ourTeamsList } = useFilterContext();
  
  // Usar los eventos del contexto si están disponibles, sino usar los props
  const eventsToDisplay = contextFilteredEvents.length > 0 ? contextFilteredEvents : filteredEvents;

  console.log("Charts - Events to display:", eventsToDisplay.length);
  console.log("Charts - First few events:", eventsToDisplay.slice(0, 3));

  // Función helper para determinar si hay datos de tackles de nuestros equipos
  const hasTacklesBarChartData = (events: any[]) => {
    if (!events || events.length === 0) return false;

    // Determinar lista de "nuestros equipos" preferida: contexto si existe, sino detectarla a partir
    // del conjunto completo de eventos (prop `events`) para evitar falsos positivos cuando se filtra.
    let ourTeams = (ourTeamsList && ourTeamsList.length > 0) ? ourTeamsList : detectOurTeams(events || []);
    if (!ourTeams || ourTeams.length === 0) return false;

    // Normalizar nombres para comparaciones robustas y excluir placeholders
    const normalizedOurTeams = ourTeams
      .map(t => normalizeString(t).toLowerCase())
      .filter(t => t && !/^(unknown|desconocido|rival|opponent|our_team|opponent|home|away|opp)$/i.test(t));

    // Filtrar eventos de tipo TACKLE que pertenezcan a alguno de nuestros equipos
    const ourTackleEvents = (events || []).filter((e) => {
      const isTackle = (e.CATEGORY === 'TACKLE' || e.event_type === 'TACKLE');
      if (!isTackle) return false;
      const team = getTeamFromEvent(e);
      if (!team) return false;
      return normalizedOurTeams.includes(normalizeString(team).toLowerCase());
    });

    return ourTackleEvents.length > 0;
  };

  const handleChartClick = (event: any, elements: any, chart: any, chartType: string, tabId?: string, additionalFilters?: any[]) => {
    console.log("Chart clicked:", chartType, elements, additionalFilters);
    
    if (additionalFilters && additionalFilters.length > 0 && setFilterDescriptors) {
      // Aplicar filtros adicionales desde el chart
      setFilterDescriptors(additionalFilters);
    }
  };

  return (
    <div className="charts w-full space-y-6">
      <div className="debug-info">
        <h3>DEBUG INFO</h3>
        <p>Events to display: {eventsToDisplay.length}</p>
        <p>Context events: {contextFilteredEvents.length}</p>
        <p>Prop events: {filteredEvents.length}</p>
      </div>
      <div className="chart-section">
        <h2 className="text-xl font-semibold mb-4">Timeline de Eventos</h2>
        <div className="w-full h-48 border rounded-lg">
          <TimelineChart
            filteredEvents={eventsToDisplay}
            onEventClick={onEventClick}
          />
        </div>
      </div>
      
      <div className="statistics-section">
        <h2 className="text-xl font-semibold mb-4">Estadísticas del Partido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {hasTacklesBarChartData(eventsToDisplay) && (
            <div className="border rounded-lg p-4">
              <TacklesBarChart
                events={eventsToDisplay}
                onBarClick={(category, player) => {
                  console.log("Tackles bar clicked:", category, player);
                  // Implementar filtrado por jugador/categoría
                }}
              />
            </div>
          )}
          
          <div className="border rounded-lg p-4">
            <AdvancePieChart
              events={eventsToDisplay}
              category="TACKLE"
              onChartClick={handleChartClick}
            />
          </div>

          <div className="border rounded-lg p-4">
            <TacklesEffectivityChart
              events={events}
              onChartClick={handleChartClick}
            />
          </div>

          <div className="border rounded-lg p-4">
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-2">Resumen de Eventos</h3>
              <div className="space-y-2">
                {(() => {
                  const eventCounts: Record<string, number> = {};
                  eventsToDisplay.forEach(event => {
                    const type = event.event_type || event.CATEGORY || 'Unknown';
                    eventCounts[type] = (eventCounts[type] || 0) + 1;
                  });
                  
                  return Object.entries(eventCounts)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 8)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center py-1 border-b">
                        <span className="text-sm font-medium">{type}</span>
                        <span className="text-sm bg-blue-100 px-2 py-1 rounded">{count}</span>
                      </div>
                    ));
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="events-section">
        <h2 className="text-xl font-semibold mb-4">Lista de Eventos</h2>
        <div className="w-full">
          <EventsTable
            events={eventsToDisplay}
            columns={["event_type", "player_name", "timestamp_sec", "extra_data"]}
            onRowClick={onEventClick}
          />
        </div>
      </div>
    </div>
  );
};

export default Charts;
