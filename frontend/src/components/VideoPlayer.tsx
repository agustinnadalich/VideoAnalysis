import { useEffect, useRef } from "react";
import YouTube from "react-youtube";
import { usePlayback } from "@/context/PlaybackContext";
import { Button } from "@/components/ui/button";

const VideoPlayer = ({ videoUrl }: { videoUrl: string }) => {
  const { 
    currentTime, 
    setCurrentTime, setIsPlaying, playFiltered, isPlaying, playNext, playPrev, selectedEvent } = usePlayback();


  const videoRef = useRef<any>(null);
  const isYouTube = videoUrl.includes("youtube.com/watch?v=");

  // Reproducir evento específico
  useEffect(() => {
    if (!videoRef.current) return;
    if (selectedEvent) {
      const targetTime = selectedEvent.timestamp_sec ?? 0;
      if (isYouTube) {
        videoRef.current.seekTo(targetTime, true);
        videoRef.current.playVideo();
      } else {
        videoRef.current.currentTime = targetTime;
        videoRef.current.play();
      }
    }
  }, [selectedEvent, isYouTube]);

  // Manejar reproducción/pausa
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      if (isYouTube) {
        videoRef.current.playVideo();
      } else {
        videoRef.current.play();
      }
    } else {
      if (isYouTube) {
        videoRef.current.pauseVideo();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isYouTube]);

  // Actualizar el tiempo actual
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const newTime = isYouTube
      ? videoRef.current.getCurrentTime()
      : videoRef.current.currentTime;



    if (Math.abs(newTime - currentTime) > 0.3) {
      setCurrentTime(newTime);
    }
  };

    // Manejar reproducción/pausa
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isYouTube) {
      const playerState = videoRef.current.getPlayerState();
      if (playerState === 1) {
        videoRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        videoRef.current.playVideo();
        setIsPlaying(true);
      }
    } else {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };


  return (
    <div className="w-full" style={{ maxWidth: '100%', margin: '0 auto' }}>
      {isYouTube ? (
        <div style={{ position: 'relative', paddingTop: '56.25%' }} className="rounded shadow overflow-hidden">
          <YouTube
            videoId={videoUrl.split('v=')[1]?.split('&')[0]}
            onReady={(e) => (videoRef.current = e.target)}
            onStateChange={handleTimeUpdate}
            opts={{ playerVars: { autoplay: 0, controls: 1 } }}
            className="w-full h-full"
            iframeClassName="absolute top-0 left-0 w-full h-full"
          />
        </div>
      ) : videoUrl ? (
        <div style={{ position: 'relative', paddingTop: '56.25%' }} className="rounded shadow overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="absolute top-0 left-0 w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onEnded={playNext} // Reproducir el siguiente evento al terminar
          />
        </div>
      ) : (
        <div className="w-full h-64 bg-gray-200 rounded shadow flex items-center justify-center">
          <p className="text-gray-500">No video available</p>
        </div>
      )}
      <div className="flex gap-2 mt-2">
        {/* Botón de play/pausa removido para evitar inconsistencias de estado */}
        {/* <Button onClick={handlePlayPause}>{isPlaying ? "⏸" : "▶️"}</Button> */}
        <Button onClick={playFiltered} > ▶️ Filtrados </Button>
        <Button onClick={playPrev}> ⏮ </Button>
        <Button onClick={playNext}> ⏭ </Button>
      </div>
    </div>
  );
};

export default VideoPlayer;