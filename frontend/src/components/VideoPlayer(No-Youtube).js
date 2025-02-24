import React, { useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import './VideoPlayer.css'; // Importa el archivo CSS

const VideoPlayer = forwardRef(({ src, tempTime, duration, isPlayingFilteredEvents, onEnd, onStop, onNext, onPrevious }, ref) => {
  const videoRef = useRef(null);

  useImperativeHandle(ref, () => ({
    get current() {
      return videoRef.current;
    }
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = tempTime;
      if (isPlayingFilteredEvents) {
        video.play();
      } else {
        video.pause();
      }
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
      <video ref={videoRef} src={src} controls width="600" />
      <div className="button-bar">
        <button className="pip-button" style={{ padding: "5px", margin:"5px" }} onClick={handlePiP}>
          <FontAwesomeIcon icon="external-link-alt" /> {/* Icon for Picture-in-Picture */}
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