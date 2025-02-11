import React, { useContext } from 'react';
import Select from 'react-select';
import FilterContext from '../context/FilterContext';

const Sidebar = ({ data }) => {
  const { filterType, setFilterType, filterDescriptors, setFilterDescriptors, filterResult, setFilterResult } = useContext(FilterContext);

  const handleTypeChange = (selectedOptions) => {
    setFilterType(selectedOptions.map(option => option.value));
  };

  const handleDescriptorChange = (selectedOptions) => {
    setFilterDescriptors(selectedOptions.map(option => option.value));
  };

  const handleResultChange = (selectedOptions) => {
    setFilterResult(selectedOptions.map(option => option.value));
  };

  const categoryOptions = [
    ...new Set(data.map((event) => event.CATEGORÍA)),
  ].map((category) => ({
    value: category,
    label: category,
  }));

  const descriptorOptions = [
    ...new Set(data.flatMap((event) => Object.keys(event))),
  ].map((descriptor) => ({
    value: descriptor,
    label: descriptor,
  }));

  const resultOptions = [...new Set(data.map((event) => event.AVANCE))].map(
    (result) => ({
      value: result,
      label: result,
    })
  );

  return (
    <div className="sidebar">
      <label>
        Categorías:
        <Select
          isMulti
          options={categoryOptions}
          value={categoryOptions.filter(option => Array.isArray(filterType) && filterType.includes(option.value))}
          onChange={handleTypeChange}
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
        Descriptores:
        <Select
          isMulti
          options={descriptorOptions}
          value={descriptorOptions.filter(option => Array.isArray(filterDescriptors) && filterDescriptors.includes(option.value))}
          onChange={handleDescriptorChange}
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
        Resultado:
        <Select
          isMulti
          options={resultOptions}
          value={resultOptions.filter(option => Array.isArray(filterResult) && filterResult.includes(option.value))}
          onChange={handleResultChange}
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
    </div>
  );
};

export default Sidebar;





