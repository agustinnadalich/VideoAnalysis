import React, { useState } from 'react';
import FilterContext from './FilterContext';

const FilterProvider = ({ children }) => {
  const [filterType, setFilterType] = useState([]);
  const [filterDescriptors, setFilterDescriptors] = useState([]);
  const [filterResult, setFilterResult] = useState([]);

  return (
    <FilterContext.Provider value={{ filterType, setFilterType, filterDescriptors, setFilterDescriptors, filterResult, setFilterResult }}>
      {children}
    </FilterContext.Provider>
  );
};

export default FilterProvider;