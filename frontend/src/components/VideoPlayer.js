import React, { useRef, useEffect } from 'react';

const VideoPlayer = ({ src, currentTime, duration, onEnd }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        let timeout;

        const handleTimeUpdate = () => {
            if (onEnd && videoRef.current && videoRef.current.currentTime >= currentTime + duration) {
                videoRef.current.pause();
                onEnd();
            }
        };

        const playVideo = async () => {
            if (videoRef.current && !isNaN(currentTime) && currentTime >= 0 && !isNaN(duration) && duration > 0) {
                try {
                    videoRef.current.pause(); // Pausa el video antes de cambiar el tiempo
                    videoRef.current.currentTime = currentTime;
                    await videoRef.current.play();
                    if (onEnd) {
                        timeout = setTimeout(() => {
                            videoRef.current.pause();
                            onEnd();
                        }, duration * 1000);
                    }
                } catch (error) {
                    console.error('Error playing video:', error);
                }
            }
        };

        const videoElement = videoRef.current;
        if (videoElement) {
            videoElement.addEventListener('timeupdate', handleTimeUpdate);
        }

        playVideo();

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
            if (videoElement) {
                videoElement.removeEventListener('timeupdate', handleTimeUpdate);
            }
        };
    }, [currentTime, duration, onEnd]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <video ref={videoRef} controls width="800">
                <source src={src} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

export default VideoPlayer;
