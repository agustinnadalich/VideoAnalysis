import React, { createContext, useState, useEffect } from "react";

const FilterContext = createContext();

export const FilterProvider = ({ children, initialEvents }) => {
  const [filterCategory, setFilterCategory] = useState([]);
  const [filterDescriptors, setFilterDescriptors] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState(initialEvents || []);

  useEffect(() => {
    setFilteredEvents(initialEvents);
  }, [initialEvents]);

  return (
    <FilterContext.Provider
      value={{
        filterCategory,
        setFilterCategory,
        filterDescriptors,
        setFilterDescriptors,
        selectedTeam,
        setSelectedTeam,
        filteredEvents,
        setFilteredEvents,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export default FilterContext;