import React, { useRef, useEffect } from 'react';

const VideoPlayer = ({ src, tempTime, duration, onEnd }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        let timeout;

        const handleTimeUpdate = () => {
            if (video && video.currentTime >= tempTime + duration) {
                video.pause();
                if (onEnd) {
                    onEnd();
                }
            }
        };

        const playVideo = async () => {
            if (video && tempTime !== null) {
                try {
                    video.currentTime = tempTime;
                    await video.play();
                    timeout = setTimeout(() => {
                        video.pause();
                        if (onEnd) {
                            onEnd();
                        }
                    }, duration * 1000);
                } catch (error) {
                    console.error('Error playing video:', error);
                }
            }
        };

        if (video) {
            video.addEventListener('timeupdate', handleTimeUpdate);
        }

        playVideo();

        return () => {
            if (video) {
                video.removeEventListener('timeupdate', handleTimeUpdate);
            }
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [tempTime, duration, onEnd]);

    return (
        <video ref={videoRef} src={src} controls width="600" />
    );
};

export default VideoPlayer;
