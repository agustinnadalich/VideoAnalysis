import React, { useState, useEffect, useContext } from 'react';
import Select from 'react-select';
import FilterContext from '../context/FilterContext';

const Sidebar = ({ events }) => {
  const { filterCategory, setFilterCategory, filterDescriptors, setFilterDescriptors, selectedTeam, setSelectedTeam } = useContext(FilterContext);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [descriptorOptions, setDescriptorOptions] = useState([]);
  const [valueOptions, setValueOptions] = useState([]);
  const [selectedDescriptor, setSelectedDescriptor] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const [teamOptions, setTeamOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState([]);

  const excludeKeys = ["COORDENADA X", "COORDENADA Y", "DURACION", "ID", "CATEGORÍA", "EQUIPO", "PUNTOS (VALOR)", "SEGUNDO", "TIEMPO(VIDEO)"];

  const updateDescriptorOptions = (filteredEvents) => {
    const descriptors = filteredEvents.reduce((acc, event) => {
      Object.keys(event).forEach((key) => {
        if (!excludeKeys.includes(key) && event[key] !== null) {
          acc[key] = true;
        }
      });
      return acc;
    }, {});

    const descriptorOptions = Object.keys(descriptors).map((key) => ({ value: key, label: key }));
    setDescriptorOptions(descriptorOptions);

    const teams = [
      ...new Set(filteredEvents.map((event) => event.EQUIPO).filter((team) => team !== null)),
    ].map((team) => ({ value: team, label: team }));
    setTeamOptions(teams);
  };

  useEffect(() => {
    const filteredEvents = filterCategory.length > 0 
      ? events.filter(event => filterCategory.includes(event.CATEGORÍA))
      : events;
    updateDescriptorOptions(filteredEvents);
  }, [events, filterCategory]);

  const categoryOptions = [
    ...new Set(events.map((event) => event.CATEGORÍA).filter((category) => category !== null)),
  ].map((category) => ({ value: category, label: category }));

  const handleCategoryChange = (selectedOptions) => {
    const selectedCategories = selectedOptions.map((option) => option.value);
    setFilterCategory(selectedCategories);

    const filteredEvents = selectedCategories.length > 0 
      ? events.filter(event => selectedCategories.includes(event.CATEGORÍA))
      : events;
    updateDescriptorOptions(filteredEvents);
  };

  const handleDescriptorChange = (selectedOption) => {
    setSelectedDescriptor(selectedOption);
    if (selectedOption) {
      const values = [
        ...new Set(events.map((event) => event[selectedOption.value]).filter((value) => value !== null)),
      ].map((value) => ({ value, label: value }));
      setValueOptions(values);
    } else {
      setValueOptions([]);
    }
  };

  const handleValueChange = (selectedOption) => {
    setSelectedValue(selectedOption);
  };

  const handleTeamChange = (selectedOption) => {
    if (selectedOption){
      setSelectedTeam(selectedOption.value);
    }
    else{
      setSelectedTeam(selectedOption);

    }
    setSelectedOption(selectedOption);
  };

  const handleApplyFilter = () => {
    if (selectedDescriptor && selectedValue) {
      const newFilter = {
        descriptor: selectedDescriptor.value,
        value: selectedValue.value,
      };
      setSelectedFilters([...selectedFilters, newFilter]);
      setFilterDescriptors([...filterDescriptors, newFilter]);
      setSelectedDescriptor(null);
      setSelectedValue(null);
    }
  };

  const handleRemoveFilter = (filterToRemove) => {
    const updatedFilters = selectedFilters.filter(
      (filter) => filter.descriptor !== filterToRemove.descriptor || filter.value !== filterToRemove.value
    );
    setSelectedFilters(updatedFilters);
    setFilterDescriptors(updatedFilters);
  };

  // useEffect(() => {
  //   onApplyFilters(filterCategory, filterDescriptors, filterValue, selectedTeam ? selectedTeam.value : null);
  // }, [filterCategory, filterDescriptors, filterValue, selectedTeam, onApplyFilters]);

  return (
    <div className="sidebar">
      <label>
        Categorías:
        <Select
          isMulti
          options={categoryOptions}
          value={categoryOptions.filter(option => Array.isArray(filterCategory) && filterCategory.includes(option.value))}
          onChange={handleCategoryChange}
          styles={{
            control: (base) => ({
              ...base,
              fontSize: "12px",
              flexDirection: "column",
            }),
            menu: (base) => ({
              ...base,
              fontSize: "12px",
            }),
            multiValueLabel: (base) => ({
              ...base,
              fontSize: "12px",
            }),
            valueContainer: (base) => ({
              ...base,
              display: "flex",
              flexWrap: "wrap",
              width: "100%",
              justifyContent: "flex-end",
            }),
            dropdownIndicator: (base) => ({
              ...base,
              padding: "2px",
            }),
            clearIndicator: (base) => ({
              ...base,
              padding: "2px",
            }),
            indicatorsContainer: (base) => ({
              ...base,
              justifyContent: "flex-end",
            }),
          }}
        />
      </label>
      <label>
        Equipo:
        <Select
          options={teamOptions}
          value={selectedOption}
          onChange={handleTeamChange}
          isClearable
          styles={{
            control: (base) => ({
              ...base,
              fontSize: "12px",
              flexDirection: "column",
            }),
            menu: (base) => ({
              ...base,
              fontSize: "12px",
            }),
            valueContainer: (base) => ({
              ...base,
              display: "flex",
              flexWrap: "wrap",
              width: "100%",
              justifyContent: "flex-end",
            }),
            dropdownIndicator: (base) => ({
              ...base,
              padding: "2px",
            }),
            clearIndicator: (base) => ({
              ...base,
              padding: "2px",
            }),
            indicatorsContainer: (base) => ({
              ...base,
              justifyContent: "flex-end",
            }),
          }}
        />
      </label>
      <label>
        Descriptores:
        <Select
          options={descriptorOptions}
          value={selectedDescriptor}
          onChange={handleDescriptorChange}
          isClearable
          styles={{
            control: (base) => ({
              ...base,
              fontSize: "12px",
              flexDirection: "column",
            }),
            menu: (base) => ({
              ...base,
              fontSize: "12px",
            }),
            valueContainer: (base) => ({
              ...base,
              display: "flex",
              flexWrap: "wrap",
              width: "100%",
              justifyContent: "flex-end",
            }),
            dropdownIndicator: (base) => ({
              ...base,
              padding: "2px",
            }),
            clearIndicator: (base) => ({
              ...base,
              padding: "2px",
            }),
            indicatorsContainer: (base) => ({
              ...base,
              justifyContent: "flex-end",
            }),
          }}
        />
      </label>
      <label>
        Valores:
        <Select
          options={valueOptions}
          value={selectedValue}
          onChange={handleValueChange}
          styles={{
            control: (base) => ({
              ...base,
              fontSize: "12px",
              flexDirection: "column",
            }),
            menu: (base) => ({
              ...base,
              fontSize: "12px",
            }),
            valueContainer: (base) => ({
              ...base,
              display: "flex",
              flexWrap: "wrap",
              width: "100%",
              justifyContent: "flex-end",
            }),
            dropdownIndicator: (base) => ({
              ...base,
              padding: "2px",
            }),
            clearIndicator: (base) => ({
              ...base,
              padding: "2px",
            }),
            indicatorsContainer: (base) => ({
              ...base,
              justifyContent: "flex-end",
            }),
          }}
        />
      </label>
      <button onClick={handleApplyFilter}>Aplicar Filtro</button>
      <div className="applied-filters">
        {selectedFilters.map((filter, index) => (
          <div key={index} className="filter-tag">
            {filter.descriptor}: {filter.value}
            <button onClick={() => handleRemoveFilter(filter)}>x</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;