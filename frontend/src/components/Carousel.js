import React, { useState, useContext } from 'react';
import TacklesBarChart from './charts/TacklesBarChart';
import MissedTacklesBarChart from './charts/MissedTacklesBarChart';
import AdvancePieChart from './charts/AdvancePieChart';
import FilterContext from '../context/FilterContext';
import './Carousel.css';

const Tabs = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);
  const childrenArray = React.Children.toArray(children);

  return (
    <div className="carousel-container">
      <div className="tabs">
        {childrenArray.map((tab, index) => (
          <button
            key={index}
            className={`tab-button ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      <div className="tab-content">{childrenArray[activeTab]}</div>
    </div>
  );
};

const Carousel = ({ filteredEvents, handleChartClick }) => {
  return (
    <Tabs>
      <div label="Tackles" className="tab-content">
        {filteredEvents.some((event) => event.CATEGORIA === "PLACCAGGIO") && (
          <div className="chart-container">
            <TacklesBarChart
              events={filteredEvents}
              onChartClick={handleChartClick}
            />
          </div>
        )}
        {filteredEvents.some((event) => event.CATEGORIA === "PLAC-SBAGLIATTO") && (
          <div className="chart-container">
            <MissedTacklesBarChart
              events={filteredEvents}
              onChartClick={handleChartClick}
            />
          </div>
        )}
        {filteredEvents.some((event) => event.CATEGORIA === "PLACCAGGIO") && (
          <div className="chart-container">
            <AdvancePieChart
              events={filteredEvents}
              onChartClick={handleChartClick}
              category="PLACCAGGIO"
            />
          </div>
        )}
        {/* Aquí puedes agregar los otros gráficos relacionados con Tackles */}
      </div>
      {/* Agrega más tabs según sea necesario */}
    </Tabs>
  );
};

export default Carousel;