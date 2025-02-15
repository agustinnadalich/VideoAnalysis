import React, { useState, useEffect, useRef } from "react";
import Select from 'react-select';
import VideoPlayer from "./components/VideoPlayer";
import Charts from "./components/New-charts.js";
import MatchReportLeft from "./components/MatchReportLeft";
import MatchReportRight from "./components/MatchReportRight";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import FilterProvider from "./context/FilterProvider";

const App = () => {
  const [data, setData] = useState({ events: [], header: {} });
  const [videoSrc] = useState("/SBvsLIONS.mp4");
  const [duration, setDuration] = useState(0);
  const [tempTime, setTempTime] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlayingFilteredEvents, setIsPlayingFilteredEvents] = useState(false);
  const [isUserInteracted, setIsUserInteracted] = useState(false);
  const videoRef = useRef(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

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
    console.log("Filtered events count received:", events.length);
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

  const handleStop = () => {
    setIsPlayingFilteredEvents(false);
  };

  const handleNext = () => {
    if (currentEventIndex < filteredEvents.length - 1) {
      playNextEvent(filteredEvents, currentEventIndex + 1);
      setCurrentEventIndex(currentEventIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentEventIndex > 0) {
      playNextEvent(filteredEvents, currentEventIndex - 1);
      setCurrentEventIndex(currentEventIndex - 1);
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

  const handleUserInteraction = () => {
    setIsUserInteracted(true);
    if (filteredEvents.length > 0) {
      playNextEvent(filteredEvents, 0);
    }
  };

  return (
    <FilterProvider initialResponse={data}>
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
            <Sidebar events={data.events} onPlayFilteredEvents={handlePlayFilteredEvents} toggleSidebar={toggleSidebar} />
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
          <Header />
          {!isSidebarVisible && (
            <button
              onClick={toggleSidebar}
              style={{ alignSelf: "flex-start", marginLeft: "10px" }}
            >
              Mostrar Filtros
            </button>
          )}
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
                paddingLeft: "20px",
                paddingRight: "20px",
                flex: 1,
                boxSizing: "border-box",
              }}
            >
              <div style={{ width: "25%", overflowY: "auto" }}>
                <MatchReportLeft data={filteredEvents.length > 0 ? filteredEvents : data.events} />
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
                  onStop={handleStop}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                />
              </div>
              <div style={{ width: "25%", overflowY: "auto" }}>
                <MatchReportRight data={data.events} />
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <Charts
                onEventClick={handleEventClick}
                onPlayFilteredEvents={handlePlayFilteredEvents}
              />
            </div>
          </div>
        </div>
      </div>
    </FilterProvider>
  );
};

export default App;
