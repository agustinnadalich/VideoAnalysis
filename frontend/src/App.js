import React, { useState, useCallback, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import Charts from './components/New-charts.js';
// import HeatMap from './components/HeatMap';

const App = () => {
    const [videoSrc] = useState('/SBvsLIONS.mp4');
    const [duration, setDuration] = useState(0);
    const [tempTime, setTempTime] = useState(null);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const [isPlayingFilteredEvents, setIsPlayingFilteredEvents] = useState(false);

    const handleEventClick = (event) => {
        console.log('Event data1:', event.SEGUNDO, event.DURACION);
        setTempTime(null); // Resetea el tiempo temporal
        setTimeout(() => {
            console.log('Setting tempTime and duration1:', event.SEGUNDO, event.DURACION);
            setTempTime(event.SEGUNDO || 0);
            setDuration(event.DURACION || 5); // Ajusta la duración a 5 segundos
        }, 10); // Espera un breve momento antes de establecer el tiempo correcto
    };

    const handlePlayFilteredEvents = (events) => {
        console.log('Playing filtered events:', events);
        setFilteredEvents(events);
        setCurrentEventIndex(0);
        setIsPlayingFilteredEvents(true);
        playNextEvent(events, 0);
    };

    const playNextEvent = (events, index) => {
        if (index < events.length) {
            const event = events[index];
            console.log('Playing next event3:', event);
            setTempTime(null); // Resetea el tiempo temporal
            setTimeout(() => {
                console.log('Setting tempTime and duration for next event:', event.SEGUNDO, 5);
                setTempTime(event.SEGUNDO || 0);
                setDuration(event.DURACION || 5); // Ajusta la duración a 5 segundos
            }, 10); // Espera un breve momento antes de establecer el tiempo correcto
        } else {
            setIsPlayingFilteredEvents(false);
        }
    };

    useEffect(() => {
        if (isPlayingFilteredEvents && tempTime !== null) {
            const timer = setTimeout(() => {
                setCurrentEventIndex((prevIndex) => {
                    const nextIndex = prevIndex + 1;
                    if (nextIndex < filteredEvents.length) {
                        playNextEvent(filteredEvents, nextIndex);
                    } else {
                        setIsPlayingFilteredEvents(false);
                    }
                    return nextIndex;
                });
            }, (duration + 1) * 1000); // Espera la duración del video más un segundo adicional

            return () => clearTimeout(timer);
        }
    }, [tempTime, isPlayingFilteredEvents, filteredEvents, duration]);

    return (
        <div>
            <VideoPlayer
                src={videoSrc}
                tempTime={tempTime}
                duration={duration}
                isPlayingFilteredEvents={isPlayingFilteredEvents}
                onEnd={() => {
                    if (isPlayingFilteredEvents) {
                        setCurrentEventIndex((prevIndex) => {
                            const nextIndex = prevIndex + 1;
                            if (nextIndex < filteredEvents.length) {
                                playNextEvent(filteredEvents, nextIndex);
                            } else {
                                setIsPlayingFilteredEvents(false);
                            }
                            return nextIndex;
                        });
                    }
                }}
            />
            <Charts onEventClick={handleEventClick} onPlayFilteredEvents={handlePlayFilteredEvents} />
        </div>
    );
};

export default App;