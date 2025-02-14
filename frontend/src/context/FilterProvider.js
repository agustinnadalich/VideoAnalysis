import React, { useState, useEffect } from 'react';
import FilterContext from './FilterContext';

const FilterProvider = ({ children, initialEvents }) => {
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

export default FilterProvider;