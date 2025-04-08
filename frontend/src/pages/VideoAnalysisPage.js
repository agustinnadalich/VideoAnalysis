import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom"; // Importar useParams para obtener el ID del partido
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBars, faTimes, faPlay, faPause, faStop, faForward, faBackward, faExternalLinkAlt, faStepBackward, faStepForward, faChevronLeft, faFilter, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import VideoPlayer from "../components/VideoPlayer.js";
import Charts from "../components/New-charts.js";
import MatchReportLeft from "../components/MatchReportLeft.js";
import MatchReportRight from "../components/MatchReportRight.js";
import Header from "../components/Header.js";
import Sidebar from "../components/Sidebar.js";
import FilterProvider from "../context/FilterProvider.js";
import './VideoAnalysisPage.css';

library.add(faBars, faTimes, faPlay, faPause, faStop, faForward, faBackward, faStepBackward, faStepForward, faChevronLeft, faExternalLinkAlt, faFilter, faSpinner);

const VideoAnalysisPage = () => {
  const { id } = useParams(); // Obtener el ID del partido desde la URL
  const [data, setData] = useState({ events: [], header: {} });
  const [videoSrc, setVideoSrc] = useState(""); // Video dinámico
  const [duration, setDuration] = useState(0);
  const [tempTime, setTempTime] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlayingFilteredEvents, setIsPlayingFilteredEvents] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isLoading, setIsLoading] = useState(true); // Estado de carga
  const videoRef = useRef(null);
  const [clearFiltersTrigger, setClearFiltersTrigger] = useState(false);

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        const response = await fetch(`http://localhost:5001/events?match_id=${id}`); // Cambiar la URL para incluir el ID del partido
        const matchData = await response.json();
        setData(matchData);
        setVideoSrc(matchData.header.video_url); // Asumimos que el backend devuelve la URL del video
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching match data:", error);
        setIsLoading(false);
      }
    };

    fetchMatchData();
  }, [id]); // Ejecutar el efecto cada vez que cambie el ID del partido

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleEventClick = (event) => {
    console.log("Event data:", event.SECOND, event.DURATION + 3);
    setTempTime(null);
    setTimeout(() => {
      const minutes = Math.floor(event.SECOND / 60);
      const seconds = event.SECOND % 60;
      console.log(`Setting tempTime and duration: ${minutes}:${seconds}, ${event.DURATION + 5}`);
      setTempTime(event.SECOND || 0);
      setDuration(event.DURATION + 5 || 5);
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
        console.log("Setting tempTime and duration for next event:", event.SECOND, event.DURATION + 5);
        setTempTime(event.SECOND || 0);
        setDuration(event.DURATION + 5 || 5);
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

  const handleClearFilters = () => {
    console.log("Filters cleared from App.js");
    setFilteredEvents(data.events); // Restablece los eventos filtrados a todos los eventos
    setClearFiltersTrigger((prev) => !prev); // Cambia el estado para notificar a Sidebar
  };

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
                <Sidebar
                  events={data.events}
                  onPlayFilteredEvents={handlePlayFilteredEvents}
                  toggleSidebar={toggleSidebar}
                  onClearFilters={handleClearFilters}
                  clearFiltersTrigger={clearFiltersTrigger}
                />
              </div>
              <div className="main-content">
                <div className="stats-container">
                  <div className="left">
                    <MatchReportLeft data={filteredEvents.length > 0 ? filteredEvents : data.events} />
                  </div>
                  <div className="video">
                    <VideoPlayer
                      ref={videoRef}
                      src={videoSrc} // Video dinámico
                      tempTime={tempTime}
                      duration={duration}
                      isPlayingFilteredEvents={isPlayingFilteredEvents}
                      onPlayFilteredEvents={handlePlayFilteredEvents}
                      filteredEvents={filteredEvents}
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

export default VideoAnalysisPage;