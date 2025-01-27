import React, { useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import './VideoPlayer.css'; // Importa el archivo CSS

const VideoPlayer = forwardRef(({ src, tempTime, duration, isPlayingFilteredEvents, onEnd }, ref) => {
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
      <button className="pip-button" onClick={handlePiP}>Picture-in-Picture</button>
    </div>
  );
});

export default VideoPlayer;