import React, { useState, useEffect, useContext } from "react";
import Select from "react-select";
import FilterContext from "../context/FilterContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


const Sidebar = ({ events, onPlayFilteredEvents, toggleSidebar }) => {
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

  // console.log("Entrando a sidebar: ", filteredEvents);

  const excludeKeys = [
    "COORDENADA X",
    "COORDENADA Y",
    "DURACION",
    "ID",
    "CATEGORÍA",
    "EQUIPO",
    "PUNTOS (VALOR)",
    "SEGUNDO",
    "TIEMPO(VIDEO)",
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
          .map((event) => event.EQUIPO)
          .filter((team) => team !== null)
      ),
    ].map((team) => ({ value: team, label: team }));
    setTeamOptions(teams);
  };

  const categoryOptions = [
    ...new Set(
      events
        .map((event) => event.CATEGORÍA)
        .filter((category) => category !== null)
    ),
  ].map((category) => ({ value: category, label: category }));

  const handleCategoryChange = (selectedOptions) => {
    const selectedCategories = selectedOptions.map((option) => option.value);
    setFilterCategory(selectedCategories);

    const filteredEvents =
      selectedCategories.length > 0
        ? events.filter((event) => selectedCategories.includes(event.CATEGORÍA))
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
      setSelectedFilters([...selectedFilters, newFilter]);
      setFilterDescriptors([...filterDescriptors, newFilter]);
      setSelectedDescriptor(null);
      setSelectedValue(null);
    }

    let filteredEvents = events;

    if (filterCategory.length > 0) {
      filteredEvents = filteredEvents.filter((event) =>
        filterCategory.includes(event.CATEGORÍA)
      );
    }

    if (selectedTeam) {
      filteredEvents = filteredEvents.filter(
        (event) => event.EQUIPO === selectedTeam
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
    // console.log("Filtered events count AQUI:", filteredEvents.length);

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
  };

  return (
    <div className="sidebar">
      <div className="hide-icon" style={{ textAlign: "right" }}>
        <button onClick={toggleSidebar} >
          <FontAwesomeIcon icon="chevron-left" /> 
        </button>
      </div>

      <label>
        Categorías:
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
      <button onClick={handleClearFilters}>Limpiar Filtros</button>
      <div className="applied-filters">
        {selectedFilters.map((filter, index) => (
          <div key={index} className="filter-tag">
            {filter.descriptor}: {filter.value}
            <button onClick={() => handleRemoveFilter(filter)}>x</button>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          // console.log(
          //   "Filtered events count en Sidebar:",
          //   filteredEvents.length
          // );
          onPlayFilteredEvents(filteredEvents);
        }}
      >
        Reproducir eventos filtrados
      </button>
    </div>
  );
};

export default Sidebar;
