import React, { useState, useCallback, useEffect, useRef } from "react";
import VideoPlayer from "./components/VideoPlayer";
import Charts from './components/New-charts.js';
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
    fetch('http://localhost:5001/events')
      .then(response => response.json())
      .then(data => {
        console.log('Data: ', data);  // Verifica los datos en la consola del cliente
        setData(data);
      })
      .catch(error => console.error('Error fetching data:', error));
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

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "20px",
        }}
      >
        <div style={{ width: "25%" }}>
          <MatchReportLeft data={data} />
        </div>
        <div
          style={{
            width: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
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
        <div style={{ width: "25%" }}>
          <MatchReportRight data={data} />
        </div>
      </div>
      <div>
        <Charts onEventClick={handleEventClick} onPlayFilteredEvents={handlePlayFilteredEvents} />
      </div>
    </div>
  );
};

export default App;
