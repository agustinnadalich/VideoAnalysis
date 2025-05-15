import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import MultiMatchHeader from "../components/MultiMatchHeader";
import Charts from "../components/Charts";
import VideoPlayer from "../components/VideoPlayer";
import FilterContext from "../context/FilterContext";

const MultiMatchReportPage = () => {
  const location = useLocation();
  const [matches, setMatches] = useState([]);
  const [selectedMatchIds, setSelectedMatchIds] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [videoSrc, setVideoSrc] = useState("");
  const [currentEvent, setCurrentEvent] = useState(null);

  // 1. Cargar todos los partidos
  useEffect(() => {
    fetch("http://localhost:5001/matches")
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.matches);
        setSelectedMatchIds(data.matches.map((m) => m.ID_MATCH)); // Por defecto, todos seleccionados
      });
  }, []);

  // 2. Cargar eventos de todos los partidos seleccionados
  useEffect(() => {
    const fetchAllEvents = async () => {
      if (selectedMatchIds.length === 0) {
        setAllEvents([]);
        setFilteredEvents([]);
        return;
      }
      const params = selectedMatchIds.map(id => `match_id=${id}`).join('&');
      const res = await fetch(`http://localhost:5001/events/multi?${params}`);
      const data = await res.json();
      setAllEvents(data.events);
      setFilteredEvents(data.events);
    };
    fetchAllEvents();
  }, [selectedMatchIds]);

  // Si hay match_id en la query, selecciona solo esos
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ids = params.getAll("match_id").map(Number);
    if (ids.length > 0) setSelectedMatchIds(ids);
  }, [location.search]);

  // 3. Handler para filtrar partidos
  const handleToggleMatch = (matchId) => {
    setSelectedMatchIds((prev) =>
      prev.includes(matchId)
        ? prev.filter((id) => id !== matchId)
        : [...prev, matchId]
    );
  };

  // 4. Handler para reproducir evento (elige el video correcto)
  const handleEventClick = (event) => {
    setVideoSrc(event.VIDEO);
    setCurrentEvent(event);
  };

  return (
    <FilterContext.Provider value={{ events: allEvents, filteredEvents, setFilteredEvents }}>
      <div>
        <MultiMatchHeader
          matches={matches}
          selectedMatchIds={selectedMatchIds}
          onToggleMatch={handleToggleMatch}
        />
        <div style={{ margin: "20px 0" }}>
          {currentEvent && (
            <VideoPlayer
              src={videoSrc}
              tempTime={currentEvent.SECOND}
              duration={currentEvent.DURATION}
              isPlayingFilteredEvents={false}
              onTimeUpdate={() => {}}
              onEnd={() => {}}
              onStop={() => setCurrentEvent(null)}
              onNext={() => {}}
              onPrevious={() => {}}
              onPlayFilteredEvents={() => {}}
            />
          )}
        </div>
        <Charts
          onEventClick={handleEventClick}
          onPlayFilteredEvents={() => {}}
        />
      </div>
    </FilterContext.Provider>
  );
};

export default MultiMatchReportPage;