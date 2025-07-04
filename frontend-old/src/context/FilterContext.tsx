import { createContext } from 'react';

const FilterContext = createContext({
  filterCategory: [],
  setFilterCategory: () => {},
  filterDescriptors: [],
  setFilterDescriptors: () => {},
  selectedTeam: null,
  setSelectedTeam: () => {},
  events: [],
  setEvents: () => {},
  filteredEvents: [],
  setFilteredEvents: () => {},
  matchInfo: {},
  setMatchInfo: () => {},
});

export default FilterContext;