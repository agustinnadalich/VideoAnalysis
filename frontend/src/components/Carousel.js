import React, { useState, useContext } from 'react';
import TacklesBarChart from './charts/TacklesBarChart';
import MissedTacklesBarChart from './charts/MissedTacklesBarChart';
import AdvancePieChart from './charts/AdvancePieChart';
import TacklesEffectivityChart from './charts/TacklesEffectivityChart';
import TacklesTimeChart from './charts/TacklesTimeChart';
import PenaltiesPlayerBarChart from './charts/PenaltiesPlayerBarChart';
import PenaltiesTimeChart from './charts/PenaltiesTimeChart';
import PenaltiesCausePieChart from './charts/PenaltiesCausePieChart';
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
  const { selectedTeam } = useContext(FilterContext);

  const hasTackles = filteredEvents.some((event) => event.CATEGORY === "TACKLE");
  const hasMissedTackles = filteredEvents.some((event) => event.CATEGORY === "MISSED-TACKLE");
  const hasTeamTackles = filteredEvents.some((event) => event.TEAM !== "OPPONENT" && event.CATEGORY === "TACKLE");
  const hasTeamMissedTackles = filteredEvents.some((event) => event.TEAM !== "OPPONENT" && event.CATEGORY === "MISSED-TACKLE");
  const hasRivalTackles = filteredEvents.some((event) => event.TEAM === "OPPONENT" && event.CATEGORY === "TACKLE");
  const hasRivalMissedTackles = filteredEvents.some((event) => event.TEAM === "OPPONENT" && event.CATEGORY === "MISSED-TACKLE");

  const hasPenalties = filteredEvents.some((event) => event.CATEGORY === "PENALTY");

  return (
    <Tabs>
      {hasTackles || hasMissedTackles ? (
        <div label="Tackles" className="tab-content">
          {hasTeamTackles && (
            <div className="chart-container">
              <TacklesBarChart
                events={filteredEvents.filter(event => event.TEAM !== "OPPONENT")}
                onChartClick={handleChartClick}
              />
            </div>
          )}
          {hasTeamMissedTackles && (
            <div className="chart-container">
              <MissedTacklesBarChart
                events={filteredEvents.filter(event => event.TEAM !== "OPPONENT")}
                onChartClick={handleChartClick}
              />
            </div>
          )}
          {hasTeamTackles && (
            <div className="chart-container">
              <AdvancePieChart
                events={filteredEvents.filter(event => event.TEAM !== "OPPONENT")}
                onChartClick={handleChartClick}
                category="TACKLE"
              />
            </div>
          )}
          {hasTeamTackles || hasTeamMissedTackles ? (
            <div className="chart-container">
              <TacklesEffectivityChart events={filteredEvents.filter(event => event.TEAM !== "OPPONENT")} team={selectedTeam} />
            </div>
          ) : null}
          {hasRivalTackles || hasRivalMissedTackles ? (
            <div className="chart-container">
              <TacklesEffectivityChart events={filteredEvents.filter(event => event.TEAM === "OPPONENT")} team="OPPONENT" />
            </div>
          ) : null}
          {hasTackles && (
            <div className="chart-container">
              <TacklesTimeChart
                events={filteredEvents}
                onChartClick={handleChartClick}
              />
            </div>
          )}
        </div>
      ) : null}
      {hasPenalties ? (
        <div label="Penalties" className="tab-content">
          <div className="chart-container">
            <PenaltiesPlayerBarChart events={filteredEvents.filter(event => event.CATEGORY === "PENALTY")} />
          </div>
          <div className="chart-container">
            <PenaltiesTimeChart events={filteredEvents.filter(event => event.CATEGORY === "PENALTY")} onChartClick={handleChartClick} />
          </div>
          <div className="chart-container">
            <PenaltiesCausePieChart events={filteredEvents.filter(event => event.CATEGORY === "PENALTY")} />
          </div>
        </div>
      ) : null}
      {/* Agrega más tabs según sea necesario */}
    </Tabs>
  );
};

export default Carousel;