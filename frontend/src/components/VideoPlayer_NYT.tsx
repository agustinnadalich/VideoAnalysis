import React, { useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useFilterContext } from "../context/FilterContext";

import './VideoPlayer.css'; // Importa el archivo CSS

const VideoPlayer = forwardRef(({ src, tempTime, duration, isPlayingFilteredEvents, onEnd, onStop, onNext, onPrevious, onTimeUpdate, onPlayFilteredEvents }, ref) => {
  const videoRef = useRef(null);
  const { filteredEvents } = useFilterContext();

  useImperativeHandle(ref, () => ({
    get current() {
      return videoRef.current;
    }
  }));

  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      const handleLoadedMetadata = () => {
        video.currentTime = tempTime;
      };

      const handlePlaying = () => {
        if (isPlayingFilteredEvents) {
          setTimeout(() => {
            video.play().catch(error => console.error("Error playing video:", error));
          }, 0);
        }
      };

      if (video.readyState >= 1) {
        handleLoadedMetadata();
      } else {
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
      }

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [tempTime, isPlayingFilteredEvents]);

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
    <div className="video-container">
      <video ref={videoRef} src={src} controls width="100%" />
      <div className="button-bar">
        <button className="pip-button" style={{ padding: "5px", margin:"5px" }} onClick={handlePiP}>
          <FontAwesomeIcon icon="external-link-alt" /> {/* Icon for Picture-in-Picture */}
        </button>
        <button className="control-button" style={{ padding: "5px", margin:"5px" }} onClick={() => {onPlayFilteredEvents(filteredEvents);}}>
          Play filtered events
        </button>
        <button className="control-button" style={{ padding: "5px", margin:"5px" }} onClick={onStop}>
          <FontAwesomeIcon icon="stop" /> {/* Icon for Stop */}
        </button>
        <button className="control-button" style={{ padding: "5px", margin:"5px" }} onClick={onPrevious}>
          <FontAwesomeIcon icon="step-backward" /> {/* Icon for Previous */}
        </button>
        <button className="control-button" style={{ padding: "5px", margin:"5px" }} onClick={onNext}>
          <FontAwesomeIcon icon="step-forward" /> {/* Icon for Next */}
        </button>
      </div>
    </div>
  );
});

export default VideoPlayer;