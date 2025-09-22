import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import TacklesBarChart from "./charts/TacklesBarChart";
import MissedTacklesBarChart from "./charts/MissedTacklesBarChart";
import TacklesByTeamChart from "./charts/TacklesByTeamChart";
import TacklesTimeChart from "./charts/TacklesTimeChart";
import AdvancePieChart from "./charts/AdvancePieChart";
// import TimelineChart from "./charts/TimelineChart";
// import ScatterChart from "./charts/ScatterChart";
// Aquí luego podrás importar los otros charts
import { useFilterContext } from "../context/FilterContext";
import { getTeamFromEvent, normalizeString, isOurTeam } from "../utils/teamUtils";
import type { MatchEvent } from "@/types";


const ChartsTabs = (_props: any) => {
  const {
    events,
    filteredEvents,
    filterDescriptors,
    setFilterDescriptors,
    setFilteredEvents,
    matchInfo,
    ourTeamsList,
  } = useFilterContext() as {
    events: MatchEvent[];
    filteredEvents: MatchEvent[];
    filterDescriptors: any[];
    setFilterDescriptors: (filters: any[]) => void;
    setFilteredEvents: (events: any[]) => void;
    matchInfo?: any;
    ourTeamsList: string[];
  };
  



  console.log("🔍 ChartsTabs - Total events:", filteredEvents?.length || 0);
  console.log("🔍 ChartsTabs - Tackle events:", filteredEvents?.filter(e => e.event_type === 'TACKLE').length || 0);

  // Función para manejar clicks en gráficos y agregar filtros
  const handleChartClick = (...args: any[]) => {
    // Soportar varias firmas que usan los distintos charts:
    // 1) (chartType: string, value: string, descriptor: string)
    // 2) (event, elements, chart) -> firma nativa de Chart.js (react-chartjs-2)
    // 3) (event, elements, chart, chartType, tabId, additionalFilters)
    try {
      // Caso 1: firma simple (chartType, value, descriptor)
      if (args.length === 3 && typeof args[0] === 'string') {
        const [chartType, value, descriptor] = args;
        const newFilter = { descriptor, value };
        const existingIndex = filterDescriptors.findIndex(f => f.descriptor === descriptor && f.value === value);
        if (existingIndex >= 0) {
          setFilterDescriptors(filterDescriptors.filter((_, i) => i !== existingIndex));
          console.log('🔄 Filtro removido:', newFilter);
        } else {
          setFilterDescriptors([...filterDescriptors, newFilter]);
          console.log('➕ Filtro agregado:', newFilter);
        }
        return;
      }

      // Caso 2a: firma Chart.js (event, elements) - algunos wrappers pasan sólo 2 args
      if (args.length === 2) {
        const [event, elements] = args;
        const chart = undefined;
        if (!elements || elements.length === 0) return;
        const el = elements[0];
        const datasetIndex = el.datasetIndex ?? el.dataset?.datasetIndex ?? el.element?.$context?.datasetIndex ?? el.element?.datasetIndex;
        const dataIndex = el.index ?? el.element?.index ?? el.element?.$context?.dataIndex ?? el.element?.$context?.dataIndex;

        // Normalizar team usando matchInfo cuando sea posible
        let team = dataIndex === 0 ? 'OUR_TEAM' : 'OPPONENT';
        if (matchInfo) {
          const ourName = matchInfo.TEAM || matchInfo.team || matchInfo.home || matchInfo.team_name || null;
          const oppName = matchInfo.OPPONENT || matchInfo.opponent || matchInfo.away || matchInfo.opponent_name || null;
          if (team === 'OUR_TEAM' && ourName) team = ourName;
          if (team === 'OPPONENT' && oppName) team = oppName;
        }
        const tackleType = datasetIndex === 0 ? 'TACKLE' : 'MISSED-TACKLE';

        const hasEventType = filterDescriptors.some(f => f.descriptor === 'event_type' && f.value === tackleType);
        const hasTeam = filterDescriptors.some(f => f.descriptor === 'TEAM' && f.value === team);

        if (hasEventType && hasTeam) {
          const updated = filterDescriptors.filter(f => !( (f.descriptor === 'event_type' && f.value === tackleType) || (f.descriptor === 'TEAM' && f.value === team) ));
          setFilterDescriptors(updated);
          console.log('🔄 Filtros removidos:', [{ descriptor: 'event_type', value: tackleType }, { descriptor: 'TEAM', value: team }]);
        } else {
          const updated = [...filterDescriptors, { descriptor: 'event_type', value: tackleType }, { descriptor: 'TEAM', value: team }];
          setFilterDescriptors(updated);
          console.log('➕ Filtros agregados:', [{ descriptor: 'event_type', value: tackleType }, { descriptor: 'TEAM', value: team }]);
        }
        return;
      }

      // Caso 2b: firma Chart.js (event, elements, chart) - asumir cualquier llamada con 3 args
      if (args.length === 3) {
        const [event, elements, chart] = args;
        if (!elements || elements.length === 0) return;
        const el = elements[0];
        // Elemento puede venir en distintas formas; intentar normalizar
        const datasetIndex = el.datasetIndex ?? el.dataset?.datasetIndex ?? el.element?.$context?.datasetIndex ?? el.element?.datasetIndex;
        const dataIndex = el.index ?? el.element?.index ?? el.element?.$context?.dataIndex ?? el.element?.$context?.dataIndex;

        // Normalizar team usando matchInfo cuando sea posible
        let team = dataIndex === 0 ? 'OUR_TEAM' : 'OPPONENT';
        if (matchInfo) {
          const ourName = matchInfo.TEAM || matchInfo.team || matchInfo.home || matchInfo.team_name || null;
          const oppName = matchInfo.OPPONENT || matchInfo.opponent || matchInfo.away || matchInfo.opponent_name || null;
          if (team === 'OUR_TEAM' && ourName) team = ourName;
          if (team === 'OPPONENT' && oppName) team = oppName;
        }
        const tackleType = datasetIndex === 0 ? 'TACKLE' : 'MISSED-TACKLE';

        // Toggle: si ambos filtros existen, los removemos; si no, los agregamos
        const hasEventType = filterDescriptors.some(f => f.descriptor === 'event_type' && f.value === tackleType);
        const hasTeam = filterDescriptors.some(f => f.descriptor === 'TEAM' && f.value === team);

        if (hasEventType && hasTeam) {
          const updated = filterDescriptors.filter(f => !( (f.descriptor === 'event_type' && f.value === tackleType) || (f.descriptor === 'TEAM' && f.value === team) ));
          setFilterDescriptors(updated);
          console.log('🔄 Filtros removidos:', [{ descriptor: 'event_type', value: tackleType }, { descriptor: 'TEAM', value: team }]);
        } else {
          const updated = [...filterDescriptors, { descriptor: 'event_type', value: tackleType }, { descriptor: 'TEAM', value: team }];
          setFilterDescriptors(updated);
          console.log('➕ Filtros agregados:', [{ descriptor: 'event_type', value: tackleType }, { descriptor: 'TEAM', value: team }]);
        }
        return;
      }

      // Caso 3: firma extendida (event, elements, chart, chartType, tabId, additionalFilters)
      if (args.length >= 6) {
        const [, , , type, , additionalFilters] = args;
        if (!additionalFilters || additionalFilters.length === 0) {
          console.warn('No additional filters provided in chart click');
          return;
        }
        const filter = additionalFilters[0];
        const descriptor = filter.descriptor;
        const value = filter.value;

        const existingIndex = filterDescriptors.findIndex(f => f.descriptor === descriptor && f.value === value);
        if (existingIndex >= 0) {
          setFilterDescriptors(filterDescriptors.filter((_, i) => i !== existingIndex));
          console.log('🔄 Filtro removido:', { descriptor, value });
        } else {
          setFilterDescriptors([...filterDescriptors, { descriptor, value }]);
          console.log('➕ Filtro agregado:', { descriptor, value });
        }
        return;
      }

      console.warn('Unexpected handleChartClick arguments:', args);
    } catch (err) {
      console.error('Error procesando handleChartClick:', err);
    }
  };

  // Aplicar filtros cuando cambien
  useEffect(() => {
    console.log("🔄 Aplicando filtros - Current filterDescriptors:", filterDescriptors);
    console.log("🔄 Total events before filtering:", events.length);

    if (!events || events.length === 0) return;

    if (filterDescriptors.length === 0) {
      console.log("🔄 No filters, showing all events");
      setFilteredEvents(events);
      return;
    }

    // Aplicar todos los filtros
    const filtered = events.filter((event) => {
      return filterDescriptors.every((filter) => {
        const { descriptor, value } = filter;
        
        // Filtrado especial para grupos de tiempo
        if (descriptor === "Quarter_Group") {
          const timeInSeconds = parseFloat(event.timestamp_sec || event.Game_Time || event.time || 0) || 0;
          let eventQuarterGroup;
          
          if (timeInSeconds < 1200) eventQuarterGroup = "0'- 20'";      // 0-20 minutos
          else if (timeInSeconds < 2400) eventQuarterGroup = "20' - 40'";    // 20-40 minutos
          else if (timeInSeconds < 3600) eventQuarterGroup = "40' - 60'";    // 40-60 minutos
          else eventQuarterGroup = "60' - 80'";                        // 60+ minutos
          
          console.log("🔍 Checking event", event.id, "for Quarter_Group =", value, "-> time:", timeInSeconds, "(type:", typeof timeInSeconds, ") -> calculated:", eventQuarterGroup);
          return eventQuarterGroup === value;
        }
        
        // Filtrado especial para equipos (soporta categorías agregadas)
        if (descriptor === 'TEAM') {
          const eventTeam = getTeamFromEvent(event);
          
          // Normalizar el valor del filtro para aceptar diferentes variaciones
          const normalizedValue = value.toUpperCase().trim();
          
          if (normalizedValue === 'OUR_TEAM' || normalizedValue === 'OUR_TEAMS') {
            // Filtrar eventos de nuestros equipos
            const matches = isOurTeam(eventTeam || '', ourTeamsList);
            console.log("🔍 TEAM=OUR_TEAM/OUR_TEAMS check:", eventTeam, "in", ourTeamsList, "->", matches);
            return matches;
          } else if (normalizedValue === 'OPPONENTS' || normalizedValue === 'RIVAL' || normalizedValue === 'RIVALES') {
            // Filtrar eventos de rivales
            const matches = !isOurTeam(eventTeam || '', ourTeamsList);
            console.log("🔍 TEAM=OPPONENTS/RIVAL/RIVALES check:", eventTeam, "not in", ourTeamsList, "->", matches);
            return matches;
          } else {
            // Filtrado por nombre específico de equipo
            const normalizedEventTeam = normalizeString(eventTeam);
            const normalizedSearchValue = normalizeString(value);
            const matches = normalizedEventTeam === normalizedSearchValue;
            console.log("🔍 TEAM specific check:", normalizedEventTeam, "===", normalizedSearchValue, "->", matches);
            return matches;
          }
        }
        
        // Filtrado especial para avances (manejar tanto ADVANCE como AVANCE)
        if (descriptor === 'ADVANCE' || descriptor === 'AVANCE') {
          const eventAdvance = event.extra_data?.AVANCE || event.extra_data?.advance || event.advance || event.extra_data?.ADVANCE;
          const matches = eventAdvance === value;
          console.log("🔍 ADVANCE/AVANCE check:", descriptor, "=", eventAdvance, "===", value, "->", matches);
          return matches;
        }
        
        // Filtrado general por otros campos
        // Buscar en event[field] o event.extra_data[field]
        const eventValue = event[descriptor] || event.extra_data?.[descriptor] || event.extra_data?.[descriptor.toLowerCase()];
        const matches = eventValue === value;
        console.log("🔍 General filter check:", descriptor, "=", eventValue, "===", value, "->", matches);
        return matches;
      });
    });

    console.log("🔄 Filtered result:", filtered.length, "events from", events.length);
    console.log("🔄 Active filters:", filterDescriptors.map(f => `${f.descriptor}=${f.value}`));
    setFilteredEvents(filtered);
  }, [events, filterDescriptors, setFilteredEvents, ourTeamsList]);

  // Mostrar mensaje de carga si no hay eventos
  if (!filteredEvents || filteredEvents.length === 0) {
    return (
      <div className="w-full mt-4 p-4 border rounded">
        <p className="text-gray-500">Cargando eventos...</p>
        <p className="text-sm text-gray-400">Eventos encontrados: {filteredEvents?.length || 0}</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="w-full mt-4">
      <TabsList>
        <TabsTrigger value="overview">Resumen</TabsTrigger>
        <TabsTrigger value="tackles">Tackles</TabsTrigger>
        <TabsTrigger value="advances">Avances</TabsTrigger>
        <TabsTrigger value="scatter">Mapa</TabsTrigger>
        {/* Agrega más pestañas según los charts */}
      </TabsList>
      
      {/* Indicador de filtros activos */}
      {filterDescriptors.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-800">Filtros activos:</span>
              <div className="flex gap-2">
                {filterDescriptors.map((filter, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {filter.descriptor}: {filter.value}
                    <button
                      onClick={() => {
                        const updatedFilters = filterDescriptors.filter((_, i) => i !== index);
                        setFilterDescriptors(updatedFilters);
                      }}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setFilterDescriptors([])}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Limpiar todos
            </button>
          </div>
        </div>
      )}
      

      <TabsContent value="overview">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Resumen del partido</h3>
          <p>Eventos totales: {filteredEvents.length}</p>
          <p>Debug: {JSON.stringify(filteredEvents.slice(0, 2), null, 2)}</p>
        </div>
      </TabsContent>

      <TabsContent value="tackles">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Estadísticas de Tackles</h3>
          
          {/* Grid de gráficos - todos los gráficos de tackles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tackles por jugador (Nuestro equipo - barras apiladas por avance) */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Tackles por Jugador (Nuestro Equipo)</h4>
              <TacklesBarChart 
                events={filteredEvents} 
                onBarClick={(category, player) => {
                  console.log("Clicked on player:", player);
                  handleChartClick("player", player, "JUGADOR");
                }}
              />
            </div>

            {/* Distribución de Avances en Tackles */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Distribución de Avances en Tackles</h4>
              <AdvancePieChart 
                events={filteredEvents} 
                category="TACKLE" 
                onChartClick={(event, elements, chart, chartType, tabId, additionalFilters) => {
                  console.log("Advance pie clicked:", chartType, additionalFilters);
                  console.log("Additional filters details:", additionalFilters?.[0]);
                  if (additionalFilters && additionalFilters.length > 0) {
                    const advanceFilter = additionalFilters.find(f => f.descriptor === "ADVANCE");
                    if (advanceFilter) {
                      console.log("Found advance filter:", advanceFilter);
                      handleChartClick("advance", advanceFilter.value, "AVANCE"); // Usar AVANCE en español
                    }
                  }
                }}
              />
            </div>

            {/* Tackles por tiempo de juego */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Tackles por Tiempo de Juego</h4>
              <div className="h-80">
                <TacklesTimeChart 
                  events={filteredEvents} 
                  onChartClick={(chartType, value, descriptor) => {
                    handleChartClick(chartType, value, descriptor);
                  }}
                />
              </div>
            </div>

            {/* Tackles errados */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Tackles Errados</h4>
              <div className="h-80">
                <MissedTacklesBarChart 
                  events={filteredEvents} 
                  onChartClick={(chartType, value, descriptor) => {
                    handleChartClick(chartType, value, descriptor);
                  }}
                />
              </div>
            </div>

            {/* Comparación por equipos */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Tackles por Equipo - Efectividad</h4>
              <div className="h-80">
                <TacklesByTeamChart 
                  events={filteredEvents} 
                  onChartClick={(chartType, value, descriptor) => {
                    handleChartClick(chartType, value, descriptor);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="advances">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Distribución de Avances</h3>
          <AdvancePieChart events={filteredEvents} category="ADVANCE" />
        </div>
      </TabsContent>


      <TabsContent value="scatter">
        {/* <ScatterChart
          events={filteredEvents}
          columnsToTooltip={columnsToTooltip}
          colors={colors}
          selectedEvents={[]}
          setSelectedEvents={() => {}}
          onEventClick={onEventClick}
          width={800}
          height={600}
        /> */}
      </TabsContent>
    </Tabs>
  );
};

export default ChartsTabs;
