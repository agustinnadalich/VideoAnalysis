import React, { useState, useCallback } from 'react';
import VideoPlayer from './components/VideoPlayer';
import Charts from './components/Charts';
// import HeatMap from './components/HeatMap';

const App = () => {
    const [videoSrc] = useState('/SBvsLIONS.mp4');
    const [duration, setDuration] = useState(0);
    const [tempTime, setTempTime] = useState(null);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const [isPlayingFilteredEvents, setIsPlayingFilteredEvents] = useState(false);

    const handleEventClick = (event) => {
        console.log('Event data:', event.startTime, event.duration);
        setTempTime(null); // Resetea el tiempo temporal
        setTimeout(() => {
            console.log('Setting tempTime and duration:', event.startTime, event.duration);
            setTempTime(event.startTime || 0);
            setDuration(event.duration || 5); // Ajusta la duración a 5 segundos
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
            console.log('Playing next event:', event);
            setTempTime(null); // Resetea el tiempo temporal
            setTimeout(() => {
                console.log('Setting tempTime and duration for next event:', event.startTime, event.duration);
                setTempTime(event.startTime || 0);
                setDuration(event.duration || 5); // Ajusta la duración a 5 segundos
            }, 10); // Espera un breve momento antes de establecer el tiempo correcto
        }
    };

    return (
        <div>
            <VideoPlayer src={videoSrc} tempTime={tempTime} duration={duration} />
            <Charts onEventClick={handleEventClick} onPlayFilteredEvents={handlePlayFilteredEvents} />
            {/* <HeatMap /> */}
        </div>
    );
};

export default App;