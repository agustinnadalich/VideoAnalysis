import { createContext, useContext, useState } from "react";

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

export const FilterProvider = ({ children }: { children: React.ReactNode }) => {
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEventsState, setFilteredEventsState] = useState<any[]>([]);
  const [filterDescriptors, setFilterDescriptors] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Ordenar los eventos antes de establecerlos en el estado
  const setFilteredEvents = (events: any[]) => {
    const sortedEvents = [...events].sort((a, b) => (a.timestamp_sec ?? 0) - (b.timestamp_sec ?? 0));
    setFilteredEventsState(sortedEvents);
  };

  const value: FilterContextType = {
    matchInfo,
    setMatchInfo,
    events,
    setEvents,
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