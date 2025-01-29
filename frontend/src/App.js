import React, { useState, useCallback, useEffect, useRef } from "react";
import Select from 'react-select';
import VideoPlayer from "./components/VideoPlayer";
import Charts from "./components/New-charts.js";
import MatchReportLeft from "./components/MatchReportLeft";
import MatchReportRight from "./components/MatchReportRight";

const App = () => {
  const [data, setData] = useState([]);
  const [videoSrc] = useState("/SBvsLIONS.mp4");
  const [duration, setDuration] = useState(0);
  const [tempTime, setTempTime] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlayingFilteredEvents, setIsPlayingFilteredEvents] = useState(false);
  const videoRef = useRef(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDescriptors, setSelectedDescriptors] = useState([]);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [filterType, setFilterType] = useState([]);
  const [filterDescriptors, setFilterDescriptors] = useState([]);
  const [filterResult, setFilterResult] = useState([]);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleEventClick = (event) => {
    console.log("Event data1:", event.SEGUNDO, event.DURACION);
    setTempTime(null); // Resetea el tiempo temporal
    setTimeout(() => {
      console.log(
        "Setting tempTime and duration1:",
        event.SEGUNDO,
        event.DURACION
      );
      setTempTime(event.SEGUNDO || 0);
      setDuration(event.DURACION || 5); // Ajusta la duración a 5 segundos
      setIsPlayingFilteredEvents(true); // Asegúrate de que el video se reproduzca
    }, 10); // Espera un breve momento antes de establecer el tiempo correcto
  };

  const handlePlayFilteredEvents = (events) => {
    console.log("Playing filtered events:", events);
    setFilteredEvents(events);
    setCurrentEventIndex(0);
    setIsPlayingFilteredEvents(true);
    playNextEvent(events, 0);
  };

  const playNextEvent = (events, index) => {
    if (index < events.length) {
      const event = events[index];
      console.log("Playing next event3:", event);
      setTempTime(null); // Resetea el tiempo temporal
      setTimeout(() => {
        console.log(
          "Setting tempTime and duration for next event:",
          event.SEGUNDO,
          5
        );
        setTempTime(event.SEGUNDO || 0);
        setDuration(event.DURACION || 5); // Ajusta la duración a 5 segundos
        setIsPlayingFilteredEvents(true); // Asegúrate de que el video se reproduzca
      }, 10); // Espera un breve momento antes de establecer el tiempo correcto
    } else {
      setIsPlayingFilteredEvents(false);
    }
  };

  useEffect(() => {
    fetch("http://localhost:5001/events")
      .then((response) => response.json())
      .then((data) => {
        console.log("Data: ", data); // Verifica los datos en la consola del cliente
        setData(data);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    if (isPlayingFilteredEvents && tempTime !== null) {
      const timer = setTimeout(() => {
        setCurrentEventIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < filteredEvents.length) {
            playNextEvent(filteredEvents, nextIndex);
          } else {
            setIsPlayingFilteredEvents(false);
          }
          return nextIndex;
        });
      }, (duration + 1) * 1000); // Espera la duración del video más un segundo adicional

      return () => clearTimeout(timer);
    }
  }, [tempTime, isPlayingFilteredEvents, filteredEvents, duration]);

  const handleCategoryChange = (selectedOptions) => {
    const selected = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    setSelectedCategories(selected);
    updateCharts(selected, selectedDescriptors);
  };

  const handleDescriptorChange = (selectedOptions) => {
    const selected = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    setSelectedDescriptors(selected);
    updateCharts(selectedCategories, selected);
  };

  const updateCharts = (categories, descriptors) => {
    // Lógica para actualizar los gráficos según las categorías y descriptores seleccionados
    console.log(
      "Updating charts with categories:",
      categories,
      "and descriptors:",
      descriptors
    );
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

  const handleTypeChange = useCallback(
    (selectedOptions) => {
      setFilterType(
        selectedOptions ? selectedOptions.map((option) => option.value) : []
      );
      updateCharts(data, filterType, filterDescriptors, filterResult);
    },
    [filterDescriptors, filterResult, filterType]
  );

  const handleResultChange = (selectedOptions) => {
    setFilterResult(
      selectedOptions ? selectedOptions.map((option) => option.value) : []
    );
    updateCharts(data, filterType, filterDescriptors, filterResult);
  };

  return (
    <div style={{ display: "flex", overflow: "hidden" }}>
      {isSidebarVisible && (
        <div
          style={{
            width: "8%",
            padding: "15px",
            borderRight: "1px solid #ccc",
            overflowY: "auto",
            position: "fixed",
            top: 0,
            height: "100vh",
          }}
        >
          <h3>Filtros</h3>
          <div>
            <label htmlFor="categories">Categorías:</label>
            <Select
              id="categories"
              isMulti
              options={categoryOptions}
              onChange={handleCategoryChange}
              value={categoryOptions.filter((option) =>
                selectedCategories.includes(option.value)
              )}
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
          </div>
          <div>
            <label htmlFor="descriptors">Descriptores:</label>
            <Select
              id="descriptors"
              isMulti
              options={descriptorOptions}
              onChange={handleDescriptorChange}
              value={descriptorOptions.filter((option) =>
                selectedDescriptors.includes(option.value)
              )}
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
          </div>
          <button onClick={() => setIsFiltersVisible(!isFiltersVisible)}>
            {isFiltersVisible ? "Ocultar Filtros" : "Mostrar Filtros"}
          </button>
          {isFiltersVisible && (
            <div style={{ marginTop: "20px" }}>
              <label>
                Tipo:
                <Select
                  isMulti
                  options={categoryOptions}
                  value={categoryOptions.filter((option) =>
                    filterType.includes(option.value)
                  )}
                  onChange={handleTypeChange}
                />
              </label>
              <label>
                Descriptores:
                <Select
                  isMulti
                  options={descriptorOptions}
                  value={descriptorOptions.filter((option) =>
                    filterDescriptors.includes(option.value)
                  )}
                  onChange={handleDescriptorChange}
                />
              </label>
              <label>
                Resultado:
                <Select
                  isMulti
                  options={resultOptions}
                  value={resultOptions.filter((option) =>
                    filterResult.includes(option.value)
                  )}
                  onChange={handleResultChange}
                />
              </label>
            </div>
          )}
        </div>
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          marginLeft: isSidebarVisible ? "10%" : "0",
        }}
      >
        <button
          onClick={toggleSidebar}
          style={{ alignSelf: "flex-start", margin: "10px" }}
        >
          {isSidebarVisible ? "Ocultar Filtros" : "Mostrar Filtros"}
        </button>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "20px",
              flex: 1,
              boxSizing: "border-box",
            }}
          >
            <div style={{ width: "25%", overflowY: "auto" }}>
              <MatchReportLeft data={data} />
            </div>
            <div
              style={{
                width: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              <VideoPlayer
                ref={videoRef}
                src={videoSrc}
                tempTime={tempTime}
                duration={duration}
                isPlayingFilteredEvents={isPlayingFilteredEvents}
                onEnd={() => {
                  if (isPlayingFilteredEvents) {
                    setCurrentEventIndex((prevIndex) => {
                      const nextIndex = prevIndex + 1;
                      if (nextIndex < filteredEvents.length) {
                        playNextEvent(filteredEvents, nextIndex);
                      } else {
                        setIsPlayingFilteredEvents(false);
                      }
                      return nextIndex;
                    });
                  }
                }}
              />
            </div>
            <div style={{ width: "25%", overflowY: "auto" }}>
              <MatchReportRight data={data} />
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <Charts
              onEventClick={handleEventClick}
              onPlayFilteredEvents={handlePlayFilteredEvents}
              events={data}
              selectedCategories={selectedCategories}
              selectedDescriptors={selectedDescriptors}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
