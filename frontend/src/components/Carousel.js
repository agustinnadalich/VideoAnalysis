import React, { useState, useContext, useEffect } from 'react';
import TacklesBarChart from './charts/TacklesBarChart';
import MissedTacklesBarChart from './charts/MissedTacklesBarChart';
import AdvancePieChart from './charts/AdvancePieChart';
import TacklesEffectivityChart from './charts/TacklesEffectivityChart';
import TacklesTimeChart from './charts/TacklesTimeChart';
import PenaltiesPlayerBarChart from './charts/PenaltiesPlayerBarChart';
import PenaltiesTimeChart from './charts/PenaltiesTimeChart';
import PenaltiesCausePieChart from './charts/PenaltiesCausePieChart';
import TurnoversPlayerBarChart from './charts/TurnoversPlayerBarChart';
import TurnoversTypePieChart from './charts/TurnoversTypePieChart';
import TurnoversTimeChart from './charts/TurnoversTimeChart';
import FilterContext from '../context/FilterContext';
import './Carousel.css';

const Tabs = ({ children, activeTab, setActiveTab }) => {
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
  const [activeTab, setActiveTab] = useState(0);

  const hasTackles = filteredEvents.some((event) => event.CATEGORY === "TACKLE");
  const hasMissedTackles = filteredEvents.some((event) => event.CATEGORY === "MISSED-TACKLE");
  const hasTeamTackles = filteredEvents.some((event) => event.TEAM !== "OPPONENT" && event.CATEGORY === "TACKLE");
  const hasTeamMissedTackles = filteredEvents.some((event) => event.TEAM !== "OPPONENT" && event.CATEGORY === "MISSED-TACKLE");
  const hasRivalTackles = filteredEvents.some((event) => event.TEAM === "OPPONENT" && event.CATEGORY === "TACKLE");
  const hasRivalMissedTackles = filteredEvents.some((event) => event.TEAM === "OPPONENT" && event.CATEGORY === "MISSED-TACKLE");

  const hasPenalties = filteredEvents.some((event) => event.CATEGORY === "PENALTY");
  const hasTurnovers = filteredEvents.some((event) => event.CATEGORY === "TURNOVER+" || event.CATEGORY === "TURNOVER-");

  useEffect(() => {
    if (hasTackles || hasMissedTackles) {
      setActiveTab(0);
    } else if (hasPenalties) {
      setActiveTab(1);
    } else if (hasTurnovers) {
      setActiveTab(2);
    }
  }, [hasTackles, hasMissedTackles, hasPenalties, hasTurnovers]);

  return (
    <Tabs activeTab={activeTab} setActiveTab={setActiveTab}>
      {hasTackles || hasMissedTackles ? (
        <div label="Tackles" id="tackles-tab" className="tab-content">
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
        <div label="Penalties" id="penalties-tab" className="tab-content">
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
      {hasTurnovers ? (
        <div label="Turnovers" id="turnovers-tab" className="tab-content">
          <div className="chart-container">
            <TurnoversPlayerBarChart events={filteredEvents.filter(event => event.CATEGORY === "TURNOVER+" || event.CATEGORY === "TURNOVER-")} onChartClick={handleChartClick} />
          </div>
          <div className="chart-container">
            <TurnoversTypePieChart events={filteredEvents.filter(event => event.CATEGORY === "TURNOVER+" || event.CATEGORY === "TURNOVER-")} onChartClick={handleChartClick} />
          </div>
          <div className="chart-container">
            <TurnoversTimeChart events={filteredEvents.filter(event => event.CATEGORY === "TURNOVER+" || event.CATEGORY === "TURNOVER-")} onChartClick={handleChartClick} />
          </div>
        </div>
      ) : null}
    </Tabs>
  );
};

export default Carousel;