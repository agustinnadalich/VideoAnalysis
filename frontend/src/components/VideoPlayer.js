import React, { useEffect, forwardRef, useImperativeHandle, useRef, useState, useContext } from 'react';
import YouTube from 'react-youtube';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FilterContext from "../context/FilterContext";

import './VideoPlayer.css'; // Importa el archivo CSS

const VideoPlayer = forwardRef(({ src, tempTime, duration, isPlayingFilteredEvents, onEnd, onStop, onNext, onPrevious, onTimeUpdate, onPlayFilteredEvents }, ref) => {
  const videoRef = useRef(null);
  const [isPiP, setIsPiP] = useState(false);
  const { filteredEvents } = useContext(FilterContext);

  // Determina si el video es de YouTube o un archivo local/URL
  const isYouTubeVideo = typeof src === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(src);

  useImperativeHandle(ref, () => ({
    get current() {
      return videoRef.current;
    }
  }));

  // Manejo de YouTube
  const handleYouTubeReady = (event) => {
    videoRef.current = event.target;
  };

  const handleYouTubeStateChange = (event) => {
    if (event.data === YouTube.PlayerState.PLAYING) {
      const interval = setInterval(() => {
        const currentTime = videoRef.current.getCurrentTime();
        onTimeUpdate(currentTime);
      }, 1000);
      return () => clearInterval(interval);
    }
  };

  useEffect(() => {
    if (isYouTubeVideo) {
      const video = videoRef.current;
      if (video) {
        video.seekTo(tempTime);
        if (isPlayingFilteredEvents) {
          video.playVideo();
        } else {
          video.pauseVideo();
        }
      }
    } else {
      const video = videoRef.current;
      if (video) {
        const handleLoadedMetadata = () => {
          video.currentTime = tempTime;
        };

        if (video.readyState >= 1) {
          handleLoadedMetadata();
        } else {
          video.addEventListener('loadedmetadata', handleLoadedMetadata);
        }

        if (isPlayingFilteredEvents) {
          video.play().catch((error) => console.error("Error playing video:", error));
        } else {
          video.pause();
        }

        return () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
      }
    }
  }, [tempTime, isPlayingFilteredEvents, isYouTubeVideo]);

  const handlePiP = async () => {
    const video = videoRef.current;
    if (video) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await video.requestPictureInPicture();
        }
      } catch (error) {
        console.error('Error with Picture-in-Picture:', error);
      }
    }
  };

  return (
    <div className={`video-container ${isPiP ? 'pip' : ''}`}>
      {isYouTubeVideo ? (
        <YouTube
          videoId={src}
          onReady={handleYouTubeReady}
          onStateChange={handleYouTubeStateChange}
          className="youtube-video"
          opts={{
            width: '100%',
            height: '100%',
          }}
        />
      ) : (
        <video ref={videoRef} src={src} controls width="100%" />
      )}
      <div className="button-bar">
        <button className="pip-button" style={{ padding: "5px", margin: "5px" }} onClick={handlePiP}>
          <FontAwesomeIcon icon="external-link-alt" /> {/* Icon for Picture-in-Picture */}
        </button>
        <button className="control-button" style={{ padding: "5px", margin: "5px" }} onClick={() => { onPlayFilteredEvents(filteredEvents); }}>
          Play filtered events
        </button>
        <button className="control-button" style={{ padding: "5px", margin: "5px" }} onClick={onStop}>
          <FontAwesomeIcon icon="stop" /> {/* Icon for Stop */}
        </button>
        <button className="control-button" style={{ padding: "5px", margin: "5px" }} onClick={onPrevious}>
          <FontAwesomeIcon icon="step-backward" /> {/* Icon for Previous */}
        </button>
        <button className="control-button" style={{ padding: "5px", margin: "5px" }} onClick={onNext}>
          <FontAwesomeIcon icon="step-forward" /> {/* Icon for Next */}
        </button>
      </div>
    </div>
  );
});

export default VideoPlayer;