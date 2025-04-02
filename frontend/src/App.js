import React, { useState, useEffect, useRef } from "react";
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBars, faTimes, faPlay, faPause, faStop, faForward, faBackward, faExternalLinkAlt, faStepBackward, faStepForward, faChevronLeft, faFilter, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import VideoPlayer from "./components/VideoPlayer";
import Charts from "./components/New-charts.js";
import MatchReportLeft from "./components/MatchReportLeft";
import MatchReportRight from "./components/MatchReportRight";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import FilterProvider from "./context/FilterProvider";
import './App.css';

library.add(faBars, faTimes, faPlay, faPause, faStop, faForward, faBackward,faStepBackward, faStepForward, faChevronLeft, faExternalLinkAlt, faFilter, faSpinner);

const App = () => {
  const [data, setData] = useState({ events: [], header: {} });
  // const [videoSrc] = useState("8ZRkzy6mXDs");
  const [videoSrc] = useState("NFanFDZIUFE");
  // const [videoSrc] = useState("/SBvsLIONS.mp4");
  // const [videoSrc] = useState("/Siena_compressed.mp4");
  // const [videoSrc] = useState("https://cone-videoanalysis.s3.us-east-1.amazonaws.com/Siena_compressed.mp4");
  // const [videoSrc] = useState("https://cone-videoanalysis.s3.us-east-1.amazonaws.com/SBvsLIONS.mp4");

  const [duration, setDuration] = useState(0);
  const [tempTime, setTempTime] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlayingFilteredEvents, setIsPlayingFilteredEvents] = useState(false);
  const [isUserInteracted, setIsUserInteracted] = useState(false);
  const videoRef = useRef(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isLoading, setIsLoading] = useState(true); // Estado de carga

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleEventClick = (event) => {
    console.log("Event data:", event.SECOND, event.DURATION+3);
    setTempTime(null);
    setTimeout(() => {
      const minutes = Math.floor(event.SECOND / 60);
      const seconds = event.SECOND % 60;
      console.log(`Setting tempTime and duration: ${minutes}:${seconds}, ${event.DURATION + 5}`);
      setTempTime(event.SECOND || 0);
      setDuration(event.DURATION+5 || 5);
      setIsPlayingFilteredEvents(true);
    }, 10);
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
      console.log("Playing next event:", event);
      setTempTime(null);
      setTimeout(() => {
        console.log("Setting tempTime and duration for next event:", event.SECOND, event.DURATION+5);
        setTempTime(event.SECOND || 0);
        setDuration(event.DURATION+5 || 5);
        setIsPlayingFilteredEvents(true);
      }, 10);
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

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handlePrevious = () => {
    if (currentEventIndex > 0) {
      playNextEvent(filteredEvents, currentEventIndex - 1);
      setCurrentEventIndex(currentEventIndex - 1);
    }
  };

  const [clearFiltersTrigger, setClearFiltersTrigger] = useState(false);

  const handleClearFilters = () => {
    console.log("Filters cleared from App.js");
    setFilteredEvents(data.events); // Restablece los eventos filtrados a todos los eventos
    setClearFiltersTrigger((prev) => !prev); // Cambia el estado para notificar a Sidebar
  };

  useEffect(() => {
    const fetchData = async () => {
      const url = process.env.NODE_ENV === 'development' 
        ? "http://localhost:5001/events" 
        : "https://videoanalysis-back.onrender.com/events";
      try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Data: ", data);
        setData(data);
        setIsLoading(false); // Datos cargados, detener la animación de carga
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false); // En caso de error, detener la animación de carga
      }
    };

    fetchData();
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
      }, (duration + 1) * 1000);

      return () => clearTimeout(timer);
    }
  }, [tempTime, isPlayingFilteredEvents, filteredEvents, duration]);

  const handleUserInteraction = () => {
    setIsUserInteracted(true);
    if (filteredEvents.length > 0) {
      playNextEvent(filteredEvents, 0);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <FilterProvider initialResponse={data}>
      <div className="app-container">
        <Header />
          <button
            className={`toggle-sidebar-button ${!isSidebarVisible ? 'visible' : 'hidden'}`}
            onClick={toggleSidebar}
            style={{ width: '100px', margin: '5px', padding: '5px' }}
          >
            <FontAwesomeIcon icon="fa-solid fa-filter" /> Filters
          </button>
          <button
            className={`toggle-sidebar-button ${!isSidebarVisible ? 'visible' : 'hidden'}`}
            onClick={handleClearFilters} // Llama a la función directamente
            style={{ width: '100px', margin: '5px', padding: '5px' }}
          >
Clear Filters
          </button>
        <div className="content-container">
          {isLoading ? (
            <div className="loading-container">
              <FontAwesomeIcon icon="spinner" spin size="3x" />
              <p>Loading match events...</p>
            </div>
          ) : (
            <>
              <div className={`sidebar-container ${isSidebarVisible ? 'visible' : ''}`}>
                <Sidebar events={data.events} onPlayFilteredEvents={handlePlayFilteredEvents} toggleSidebar={toggleSidebar}   onClearFilters={handleClearFilters}   clearFiltersTrigger={clearFiltersTrigger}  />
              </div>
              <div className="main-content">
                <div className="stats-container">
                  <div className="left">
                    <MatchReportLeft data={filteredEvents.length > 0 ? filteredEvents : data.events} />
                  </div>
                  <div className="video">
                    <VideoPlayer
                      ref={videoRef}
                      src={videoSrc}
                      tempTime={tempTime}
                      duration={duration}
                      isPlayingFilteredEvents={isPlayingFilteredEvents}
                      onPlayFilteredEvents={handlePlayFilteredEvents}
                      filteredEvents={filteredEvents} // Asegúrate de pasar filteredEvents aquí
                      onTimeUpdate={handleTimeUpdate}
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
                  <div className="right">
                    <MatchReportRight data={data.events} />
                  </div>
                </div>
                <div className="charts-container">
                  <Charts
                    onEventClick={handleEventClick}
                    onPlayFilteredEvents={handlePlayFilteredEvents}
                    currentTime={currentTime}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </FilterProvider>
  );
};

export default App;