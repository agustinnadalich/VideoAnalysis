import React, { useState } from 'react';
import FilterContext from './FilterContext';

const FilterProvider = ({ children }) => {
  const [filterCategory, setFilterCategory] = useState([]);
  const [filterDescriptors, setFilterDescriptors] = useState([]);
  // const [filterValue, setFilterValue] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);


  return (
    <FilterContext.Provider value={{ filterCategory, setFilterCategory, filterDescriptors, setFilterDescriptors, selectedTeam, setSelectedTeam }}>
      {children}
    </FilterContext.Provider>
  );
};

export default FilterProvider;