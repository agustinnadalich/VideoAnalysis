import React, { useEffect, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import YouTube from 'react-youtube';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import './VideoPlayer.css'; // Importa el archivo CSS

const VideoPlayer = forwardRef(({ src, tempTime, duration, isPlayingFilteredEvents, onEnd, onStop, onNext, onPrevious, onTimeUpdate, onPlayFilteredEvents, filteredEvents }, ref) => {
  const videoRef = useRef(null);
  const [isPiP, setIsPiP] = useState(false);

  useImperativeHandle(ref, () => ({
    get current() {
      return videoRef.current;
    }
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.seekTo(tempTime);
      if (isPlayingFilteredEvents) {
        video.playVideo();
      } else {
        video.pauseVideo();
      }
    }
  }, [tempTime, isPlayingFilteredEvents]);

  const handlePiP = () => {
    setIsPiP(!isPiP);
  };

  const onReady = (event) => {
    videoRef.current = event.target;
  };

  const onStateChange = (event) => {
    if (event.data === YouTube.PlayerState.PLAYING) {
      const interval = setInterval(() => {
        const currentTime = videoRef.current.getCurrentTime();
        onTimeUpdate(currentTime);
      }, 1000);
      return () => clearInterval(interval);
    }
  };
  

  return (
    <div className={`video-container ${isPiP ? 'pip' : ''}`}>
      <YouTube 
        videoId={src} 
        onReady={onReady} 
        onStateChange={onStateChange}
        className={`youtube-video ${isPiP ? '' : ''}`} 
        opts={{ 
          // width: isPiP ? '320' : '640', 
          // height: isPiP ? '180' : '360' 
          width: '100%', 
          height: '100%' 
        }} 
      />
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