import React, { useState, useEffect, useContext } from "react";
import Select from "react-select";
import FilterContext from "../context/FilterContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Sidebar.css'; // Asegúrate de importar el archivo CSS


const Sidebar = ({ events, onPlayFilteredEvents, toggleSidebar, onClearFilters, clearFiltersTrigger }) => {
  const {
    filterCategory,
    setFilterCategory,
    filterDescriptors,
    setFilterDescriptors,
    selectedTeam,
    setSelectedTeam,
    filteredEvents,
    setFilteredEvents,
  } = useContext(FilterContext);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [descriptorOptions, setDescriptorOptions] = useState([]);
  const [valueOptions, setValueOptions] = useState([]);
  const [selectedDescriptor, setSelectedDescriptor] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const [teamOptions, setTeamOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState([]);

  // Inicializar filteredEvents con todos los eventos al cargar el componente
  useEffect(() => {
    setFilteredEvents(events);
    updateDescriptorOptions(events); // Llamar a updateDescriptorOptions con todos los eventos
  }, [events, setFilteredEvents]);

  useEffect(() => {
    setSelectedFilters(filterDescriptors);
  }, [filterDescriptors]);

  useEffect(() => {
    console.log("FilterCategory changed:", filterCategory);
    setSelectedOption(filterCategory.map(category => ({ value: category, label: category })));
  }, [filterCategory]);

  // Escucha el cambio en clearFiltersTrigger para limpiar los filtros
  useEffect(() => {
    setFilterCategory([]);
    setFilterDescriptors([]);
    setSelectedTeam(null);
    setSelectedFilters([]);
    setSelectedDescriptor(null);
    setSelectedValue(null);
    setFilteredEvents(events); // Restablece los eventos filtrados a todos los eventos
    console.log("Filters cleared from Sidebar");
  }, [clearFiltersTrigger, events, setFilterCategory, setFilterDescriptors, setSelectedTeam, setFilteredEvents]);

  const excludeKeys = [
    "COORDINATE_X",
    "COORDINATE_Y",
    "DURATION",
    "ID",
    "CATEGORY",
    "TEAM",
    "POINTS(VALUE)",
    "SECOND",
    "TIME(VIDEO)",
  ];

  const updateDescriptorOptions = (filteredEvents) => {
    const descriptors = filteredEvents.reduce((acc, event) => {
      Object.keys(event).forEach((key) => {
        if (!excludeKeys.includes(key) && event[key] !== null) {
          acc[key] = true;
        }
      });
      return acc;
    }, {});

    const descriptorOptions = Object.keys(descriptors).map((key) => ({
      value: key,
      label: key,
    }));
    setDescriptorOptions(descriptorOptions);

    const teams = [
      ...new Set(
        filteredEvents
          .map((event) => event.TEAM)
          .filter((team) => team !== null)
      ),
    ].map((team) => ({ value: team, label: team }));
    setTeamOptions(teams);
  };

  const categoryOptions = [
    ...new Set(
      events
        .map((event) => event.CATEGORY)
        .filter((category) => category !== null)
    ),
  ].map((category) => ({ value: category, label: category }));

  const handleCategoryChange = (selectedOptions) => {
    const selectedCategories = selectedOptions.map((option) => option.value);
    setFilterCategory(selectedCategories);

    const filteredEvents =
      selectedCategories.length > 0
        ? events.filter((event) => selectedCategories.includes(event.CATEGORY))
        : events;
    setFilteredEvents(filteredEvents);
    updateDescriptorOptions(filteredEvents);
  };

  const handleDescriptorChange = (selectedOption) => {
    setSelectedDescriptor(selectedOption);
    if (selectedOption) {
      const values = [
        ...new Set(
          events
            .map((event) => event[selectedOption.value])
            .filter((value) => value !== null)
        ),
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
    if (selectedOption) {
      setSelectedTeam(selectedOption.value);
    } else {
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
      setSelectedFilters((prevFilters) => {
        const updatedFilters = [...prevFilters, newFilter];
        return [...new Set(updatedFilters.map(filter => JSON.stringify(filter)))].map(filter => JSON.parse(filter));
      });
      setFilterDescriptors((prevFilters) => {
        const updatedFilters = [...prevFilters, newFilter];
        return [...new Set(updatedFilters.map(filter => JSON.stringify(filter)))].map(filter => JSON.parse(filter));
      });
      setSelectedDescriptor(null);
      setSelectedValue(null);
    }

    let filteredEvents = events;

    if (filterCategory.length > 0) {
      filteredEvents = filteredEvents.filter((event) =>
        filterCategory.includes(event.CATEGORY)
      );
    }

    if (selectedTeam) {
      filteredEvents = filteredEvents.filter(
        (event) => event.TEAM === selectedTeam
      );
    }

    if (filterDescriptors.length > 0) {
      filteredEvents = filteredEvents.filter((event) =>
        filterDescriptors.every(
          (filter) => event[filter.descriptor] === filter.value
        )
      );
    }

    setFilteredEvents(filteredEvents);
    updateDescriptorOptions(filteredEvents);
  };

  const handleRemoveFilter = (filterToRemove) => {
    const updatedFilters = selectedFilters.filter(
      (filter) =>
        filter.descriptor !== filterToRemove.descriptor ||
        filter.value !== filterToRemove.value
    );
    setSelectedFilters(updatedFilters);
    setFilterDescriptors(updatedFilters);
  };

  const handleClearFilters = () => {
    setFilterCategory([]);
    setFilterDescriptors([]);
    setSelectedTeam(null);
    setSelectedFilters([]);
    setSelectedDescriptor(null);
    setSelectedValue(null);
    setSelectedOption(null); // Restablecer el select de Equipo
    setFilteredEvents(events);
    updateDescriptorOptions(events);

    // Llama a la función pasada como prop para sincronizar con App.js
    if (onClearFilters) {
      onClearFilters();
    }
  };

  return (
    <div className="sidebar">
      <div className="hide-icon" style={{ textAlign: "right" }}>
        <button onClick={toggleSidebar} >
          <FontAwesomeIcon icon="chevron-left" /> 
        </button>
      </div>

      <label>
        CATEGORY:
        <Select
          isMulti
          options={categoryOptions}
          value={categoryOptions.filter(
            (option) =>
              Array.isArray(filterCategory) &&
              filterCategory.includes(option.value)
          )}
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
        Team:
        <Select
          options={teamOptions}
          value={teamOptions.find(option => option.value === selectedTeam)}
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
        Descriptors:
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
        Values:
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
      <div className="filter-buttons">
        <button onClick={handleApplyFilter}>Apply filter</button>
        <div className="applied-filters">
          {selectedFilters.map((filter, index) => (
            <div key={index} className="filter-tag">
              {filter.descriptor}: {filter.value}
              <button onClick={() => handleRemoveFilter(filter)} className="tag-button">x</button>
            </div>
          ))}
        </div>
        <button onClick={handleClearFilters}>Clean filters</button>
        <button
          onClick={() => {
            onPlayFilteredEvents(filteredEvents);
          }}
        >
          Play filtered events
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
