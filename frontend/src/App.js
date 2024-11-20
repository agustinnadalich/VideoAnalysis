import React, { useState, useCallback } from 'react';
import VideoPlayer from './components/VideoPlayer';
import Charts from './components/Charts';
import HeatMap from './components/HeatMap';

const App = () => {
    const [videoSrc] = useState('/ATTACCO.mp4');
    const [duration, setDuration] = useState(0);
    const [tempTime, setTempTime] = useState(null);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);

    const handleEventClick = (event) => {
        console.log('Event data:', event.time, event.duration);
        setTempTime(null); // Resetea el tiempo temporal
        setTimeout(() => {
            console.log('Setting tempTime and duration:', event.time, event.duration);
            setTempTime(event.time || 0);
            setDuration(event.duration || 2); // Ajusta la duración a 2 segundos para verificar
        }, 10); // Espera un breve momento antes de establecer el tiempo correcto
    };

    const handlePlayFilteredEvents = (events) => {
        console.log('Playing filtered events:', events);
        setFilteredEvents(events);
        setCurrentEventIndex(0);
        playNextEvent(events, 0);
    };

    const playNextEvent = (events, index) => {
        if (index < events.length) {
            const event = events[index];
            console.log('Playing next event:', event);
            setTempTime(null); // Resetea el tiempo temporal
            setTimeout(() => {
                console.log('Setting tempTime and duration for next event:', event.time, event.duration);
                setTempTime(event.time || 0);
                setDuration(event.duration || 2); // Ajusta la duración a 2 segundos para verificar
                setCurrentEventIndex(index + 1);
            }, 50); // Espera un breve momento antes de establecer el tiempo correcto
        }
    };

    const handleVideoEnd = useCallback(() => {
        console.log('Video ended. Current event index:', currentEventIndex);
        if (currentEventIndex < filteredEvents.length) {
            playNextEvent(filteredEvents, currentEventIndex);
        } else {
            console.log('All events finished.');
            setTempTime(-1); // Establece un valor que no desencadene el `useEffect` en `VideoPlayer`
            setDuration(-1); // Establece un valor que no desencadene el `useEffect` en `VideoPlayer`
        }
    }, [currentEventIndex, filteredEvents]);

    // const generateRandomHeatMapData = (numPoints) => {
    //     const data = [];
    //     for (let i = 0; i < numPoints; i++) {
    //         const x = Math.random() * 70;
    //         const y = Math.random() * 100;
    //         const value = Math.random();
    //         data.push([x, y, value]);
    //     }
    //     return data;
    // };

    // const heatMapData = generateRandomHeatMapData(100);

    return (
        <div className="App">
            <h1>Rugby Analysis Platform</h1>
            <VideoPlayer src={videoSrc} currentTime={tempTime} duration={duration} onEnd={handleVideoEnd} />
            <Charts onEventClick={handleEventClick} onPlayFilteredEvents={handlePlayFilteredEvents} />
            {/* <HeatMap data={heatMapData} /> */}
        </div>
    );
};

export default App;