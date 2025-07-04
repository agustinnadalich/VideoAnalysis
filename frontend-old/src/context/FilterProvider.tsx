import React, { useState, useEffect } from 'react';
import FilterContext from './FilterContext';

const FilterProvider = ({ children, initialResponse }) => {
  const [filterCategory, setFilterCategory] = useState([]);
  const [filterDescriptors, setFilterDescriptors] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [events, setEvents] = useState(initialResponse?.events || []);
  const [filteredEvents, setFilteredEvents] = useState(initialResponse?.events || []);
  const [matchInfo, setMatchInfo] = useState(initialResponse?.header || {});

  useEffect(() => {
    if (initialResponse) {
      setEvents(initialResponse.events);
      setFilteredEvents(initialResponse.events);
      setMatchInfo(initialResponse.header);
    }
  }, [initialResponse]);

  return (
    <FilterContext.Provider
      value={{
        filterCategory,
        setFilterCategory,
        filterDescriptors,
        setFilterDescriptors,
        selectedTeam,
        setSelectedTeam,
        events,
        setEvents,
        filteredEvents,
        setFilteredEvents,
        matchInfo,
        setMatchInfo,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export default FilterProvider;