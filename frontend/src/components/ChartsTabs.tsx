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
import TacklesEffectivityChart from "./charts/TacklesEffectivityChart";
import TacklesTimeChart from "./charts/TacklesTimeChart";
import AdvancePieChart from "./charts/AdvancePieChart";
// import TimelineChart from "./charts/TimelineChart";
// import ScatterChart from "./charts/ScatterChart";
// Aquí luego podrás importar los otros charts
import { useFilterContext } from "../context/FilterContext";
import type { MatchEvent } from "@/types";


const ChartsTabs = (_props: any) => {
  const {
    events,
    filteredEvents,
    filterDescriptors,
    setFilterDescriptors,
    setFilteredEvents,
  } = useFilterContext() as {
    events: MatchEvent[];
    filteredEvents: MatchEvent[];
    filterDescriptors: any[];
    setFilterDescriptors: (filters: any[]) => void;
    setFilteredEvents: (events: any[]) => void;
  };



  console.log("🔍 ChartsTabs - Total events:", filteredEvents?.length || 0);
  console.log("🔍 ChartsTabs - Tackle events:", filteredEvents?.filter(e => e.event_type === 'TACKLE').length || 0);

  // Función para manejar clicks en gráficos y agregar filtros
  const handleChartClick = (...args: any[]) => {
    let chartType: string, value: string, descriptor: string;
    
    // Detectar la firma del callback
    if (args.length === 3 && typeof args[0] === 'string') {
      // Firma simple: (chartType, value, descriptor)
      [chartType, value, descriptor] = args;
    } else if (args.length >= 6) {
      // Firma completa: (event, elements, chart, chartType, tabId, additionalFilters)
      const [, , , type, , additionalFilters] = args;
      chartType = type;
      
      if (additionalFilters && additionalFilters.length > 0) {
        const filter = additionalFilters[0];
        descriptor = filter.descriptor;
        value = filter.value;
      } else {
        console.warn("No additional filters provided in chart click");
        return;
      }
    } else {
      console.warn("Unexpected handleChartClick arguments:", args);
      return;
    }
    
    console.log("🎯 handleChartClick processed:", { chartType, value, descriptor });
    
    // Crear el nuevo filtro
    const newFilter = { descriptor, value };
    
    // Verificar si el filtro ya existe
    const existingFilterIndex = filterDescriptors.findIndex(
      (filter) => filter.descriptor === descriptor && filter.value === value
    );
    
    if (existingFilterIndex >= 0) {
      // Si el filtro ya existe, lo removemos (toggle)
      const updatedFilters = filterDescriptors.filter(
        (_, index) => index !== existingFilterIndex
      );
      setFilterDescriptors(updatedFilters);
      console.log("🔄 Filtro removido:", newFilter);
    } else {
      // Si no existe, lo agregamos
      const updatedFilters = [...filterDescriptors, newFilter];
      setFilterDescriptors(updatedFilters);
      console.log("➕ Filtro agregado:", newFilter);
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
          const timeInSeconds = event.timestamp_sec || event.Game_Time || 0;
          let eventQuarterGroup;
          
          if (timeInSeconds < 1200) eventQuarterGroup = "0'- 20'";      // 0-20 minutos
          else if (timeInSeconds < 2400) eventQuarterGroup = "20' - 40'";    // 20-40 minutos
          else if (timeInSeconds < 3600) eventQuarterGroup = "40' - 60'";    // 40-60 minutos
          else eventQuarterGroup = "60' - 80'";                        // 60+ minutos
          
          console.log("🔍 Checking event", event.id, "for Quarter_Group =", value, "-> calculated:", eventQuarterGroup);
          return eventQuarterGroup === value;
        }
        
        // Buscar el valor en diferentes lugares del evento
        let eventValue = event[descriptor];
        
        // Si no está en el nivel principal, buscar en extra_data
        if (eventValue === undefined && event.extra_data) {
          eventValue = event.extra_data[descriptor];
        }

        console.log("🔍 Checking event", event.id, "for", descriptor, "=", value, "-> found:", eventValue);
        
        // Si es un array, verificar si contiene el valor
        if (Array.isArray(eventValue)) {
          return eventValue.includes(value);
        }
        
        // Comparación normal
        const matches = eventValue === value;
        console.log("🔍 Match result:", matches);
        return matches;
      });
    });

    console.log("🔄 Filtered result:", filtered.length, "events from", events.length);
    setFilteredEvents(filtered);
  }, [events, filterDescriptors, setFilteredEvents]);

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

            {/* Efectividad de tackles */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Efectividad de Tackles</h4>
              <div className="h-80">
                <TacklesEffectivityChart 
                  events={filteredEvents}
                  team="OUR_TEAM"
                  onChartClick={(chartType, value, descriptor) => {
                    handleChartClick(chartType, value, descriptor);
                  }}
                />
              </div>
            </div>

            {/* Comparación por equipos */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Tackles por Equipo</h4>
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
