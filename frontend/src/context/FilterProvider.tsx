import { useState } from "react";
import { FilterContext } from "./FilterContext";
import type { FilterContextType } from "./FilterContext";

export const FilterProvider = ({ children }: { children: React.ReactNode }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [filterDescriptors, setFilterDescriptors] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [matchInfo, setMatchInfo] = useState<any>(null); // ✅ NUEVO
  const [ourTeamsList, setOurTeamsList] = useState<string[]>([]); // ✅ NUEVO: Lista de nuestros equipos



  const value: FilterContextType = {
    events,
    setEvents,
    filteredEvents,
    setFilteredEvents,
    filterDescriptors,
    setFilterDescriptors,
    filterCategory,
    setFilterCategory,
    selectedTeam,
    setSelectedTeam,
    matchInfo,       // ✅ NUEVO
    setMatchInfo,    // ✅ NUEVO
    ourTeamsList,    // ✅ NUEVO
    setOurTeamsList, // ✅ NUEVO
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

export default FilterProvider;
