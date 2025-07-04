import { createContext, useContext, useState, useCallback } from "react";
import { useFilterContext } from "@/context/FilterContext"; // Importar FilterContext
import type { ReactNode } from "react";
import type { MatchEvent } from "@/types";

interface PlaybackContextType {
  currentTime: number;
  setCurrentTime: (time: number) => void;
  selectedEvent: MatchEvent | null;
  setSelectedEvent: (event: MatchEvent | null) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playFiltered: () => void;
  playNext: () => void;
  playPrev: () => void;
  playEvent: (event: MatchEvent) => void;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export const PlaybackProvider = ({ children }: { children: ReactNode }) => {
  const { filteredEvents } = useFilterContext(); // Usar filteredEvents desde FilterContext
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [selectedEvent, setSelectedEvent] = useState<MatchEvent | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const playFiltered = useCallback(() => {
    if (filteredEvents.length === 0) return;
    setSelectedEvent(filteredEvents[0]);
    setCurrentIndex(0);
    setCurrentTime(filteredEvents[0]?.timestamp_sec ?? 0);
    setIsPlaying(true);
  }, [filteredEvents]);

  const playNext = useCallback(() => {
    if (currentIndex + 1 < filteredEvents.length) {
      const nextIndex = currentIndex + 1;
      setSelectedEvent(filteredEvents[nextIndex]);
      setCurrentIndex(nextIndex);
      setCurrentTime(filteredEvents[nextIndex]?.timestamp_sec ?? 0);
    } else {
      setIsPlaying(false);
    }
  }, [currentIndex, filteredEvents]);

  const playPrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setSelectedEvent(filteredEvents[prevIndex]);
      setCurrentIndex(prevIndex);
      setCurrentTime(filteredEvents[prevIndex]?.timestamp_sec ?? 0);
    }
  }, [currentIndex, filteredEvents]);

  const playEvent = useCallback((event: MatchEvent) => {
    console.log("playEvent llamado con:", event);
    console.log("filteredEvents en playEvent:", filteredEvents);

    const index = filteredEvents.findIndex(
      (e) =>
        e.timestamp_sec === event.timestamp_sec &&
        e.event_type === event.event_type &&
        e.match_id === event.match_id
    );
    console.log("Índice del evento en filteredEvents:", index);

    if (index !== -1) {
      setSelectedEvent(event);
      setCurrentIndex(index);
      setCurrentTime(event.timestamp_sec ?? 0);
      setIsPlaying(true);
      console.log("Estados actualizados: ", {
        selectedEvent: event,
        currentIndex: index,
        currentTime: event.timestamp_sec ?? 0,
        isPlaying: true,
      });
    } else {
      console.warn("El evento no se encontró en filteredEvents.");
    }
  }, [filteredEvents]);

  return (
    <PlaybackContext.Provider
      value={{
        currentTime,
        setCurrentTime,
        selectedEvent,
        setSelectedEvent,
        currentIndex,
        setCurrentIndex,
        isPlaying,
        setIsPlaying,
        playFiltered,
        playNext,
        playPrev,
        playEvent,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};

export const usePlayback = () => {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error("usePlayback must be used within a PlaybackProvider");
  }
  return context;
};
