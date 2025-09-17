import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import HeaderPartido from "@/components/HeaderPartido";
import Sidebar from "@/components/Sidebar";
import TimelineChart from "@/components/charts/TimelineChart";
import VideoPlayer from "@/components/VideoPlayer";
import ChartsTabs from "@/components/ChartsTabs";
import { useEvents } from "@/hooks/useEvents";
import { useFilterContext } from "@/context/FilterContext";
import { PlaybackProvider, usePlayback } from "@/context/PlaybackContext";
import { FiFilter, FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

const AnalysisPageContent = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { data } = useEvents(Number(matchId));
  const { setEvents, setFilteredEvents, setMatchInfo, filteredEvents } = useFilterContext();
  const {
    currentTime,
    setCurrentTime,
    selectedEvent,
    setSelectedEvent,
    playNext,
    playPrev,
    playEvent
  } = usePlayback();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (data?.events) {
      console.log("Eventos cargados en AnalysisPage:", data.events);
      setEvents(data.events);
      // Ordena los eventos por timestamp_sec antes de establecerlos en filteredEvents
      const sortedEvents = [...data.events].sort((a, b) => (a.timestamp_sec ?? 0) - (b.timestamp_sec ?? 0));
      setFilteredEvents(sortedEvents);
    }
    if (data?.match_info) {
      setMatchInfo(data.match_info);
    }
  }, [data, setEvents, setFilteredEvents, setMatchInfo]);

  const videoUrl = data?.match_info?.VIDEO_URL || data?.match_info?.video || "";

  return (
    <Layout>
      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full bg-white border-r shadow-md z-40 w-64 transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          className="absolute top-4 right-4 p-2 rounded hover:bg-gray-200"
          onClick={() => setSidebarOpen(false)}
          title="Cerrar filtros"
        >
          <FiX size={22} />
        </button>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </div>

      {/* Main content */}
      <div className={cn("flex-1 transition-all duration-300", sidebarOpen ? "ml-64" : "")}>
        <div className="p-4">
          <div className="mb-4 flex items-center">
            {/* Botón de mostrar sidebar */}
            {!sidebarOpen && (
              <button
                className="mr-2 p-2 rounded hover:bg-gray-200"
                onClick={() => setSidebarOpen(true)}
                title="Mostrar filtros"
              >
                <FiFilter size={22} />
              </button>
            )}
            <HeaderPartido />
          </div>
            <div className="flex flex-col gap-4">
              <VideoPlayer videoUrl={videoUrl} />

              <TimelineChart
              filteredEvents={filteredEvents}
              onEventClick={playEvent}
              />
              <ChartsTabs
              onEventClick={setSelectedEvent}
              currentTime={currentTime}
              />
            </div>
        </div>
      </div>
    </Layout>
  );
};

const AnalysisPage = () => {
  return (
    <PlaybackProvider>
      <AnalysisPageContent />
    </PlaybackProvider>
  );
};

export default AnalysisPage;