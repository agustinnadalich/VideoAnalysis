import { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface FilterContextType {
  matchInfo: any;
  setMatchInfo: (info: any) => void;
  events: any[];
  setEvents: (events: any[]) => void;
  filteredEvents: any[];
  setFilteredEvents: (events: any[]) => void;
  filterDescriptors: any[];
  setFilterDescriptors: (filters: any[]) => void;
  filterCategory: any[];
  setFilterCategory: (categories: any[]) => void;
  selectedTeam: string | null;
  setSelectedTeam: (team: string | null) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({
  children,
  initialResponse
}: {
  children: React.ReactNode;
  initialResponse?: any;
}) => {
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [events, setEventsState] = useState<any[]>([]);
  const [filteredEventsState, setFilteredEventsState] = useState<any[]>([]);
  const [filterDescriptors, setFilterDescriptors] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Inicializar con datos si existen
  useEffect(() => {
    if (initialResponse && initialResponse.events) {
      console.log("🔄 FilterProvider - Inicializando con:", initialResponse.events.length, "eventos");
      console.log("🔄 FilterProvider - Primer evento:", initialResponse.events[0]);
      setEventsState(initialResponse.events);
      const sortedEvents = [...initialResponse.events].sort((a, b) => (a.timestamp_sec ?? 0) - (b.timestamp_sec ?? 0));
      setFilteredEventsState(sortedEvents);
    } else {
      console.log("🔄 FilterProvider - No hay datos iniciales:", initialResponse);
    }
  }, [initialResponse]);

  // Función para establecer eventos sin crear bucles
  const setEventsAndFilter = useCallback((newEvents: any[]) => {
    console.log("🔄 setEventsAndFilter llamado con:", newEvents.length, "eventos");
    setEventsState(newEvents);
    const sortedEvents = [...newEvents].sort((a, b) => (a.timestamp_sec ?? 0) - (b.timestamp_sec ?? 0));
    setFilteredEventsState(sortedEvents);
  }, []);

  // Ordenar los eventos antes de establecerlos en el estado
  const setFilteredEvents = useCallback((events: any[]) => {
    console.log("🔄 setFilteredEvents llamado con:", events.length, "eventos");
    const sortedEvents = [...events].sort((a, b) => (a.timestamp_sec ?? 0) - (b.timestamp_sec ?? 0));
    setFilteredEventsState(sortedEvents);
  }, []);

  const value: FilterContextType = {
    matchInfo,
    setMatchInfo,
    events,
    setEvents: setEventsAndFilter,  // Usar la función que maneja ambos
    filteredEvents: filteredEventsState,
    setFilteredEvents,
    filterDescriptors,
    setFilterDescriptors,
    filterCategory,
    setFilterCategory,
    selectedTeam,
    setSelectedTeam,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilterContext debe usarse dentro de FilterProvider");
  }
  return context;
};

export default FilterContext;