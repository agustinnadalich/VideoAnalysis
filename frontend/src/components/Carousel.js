import React, { useState, useContext, useImperativeHandle, forwardRef, useEffect } from 'react';
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
import PlayerPointsChart from './charts/PlayerPointsChart';
import PointsTimeChart from './charts/PointsTimeChart';
import PointsTypeChart from './charts/PointsTypeChart';
import TriesPlayerChart from './charts/TriesPlayerChart';
import TriesTimeChart from './charts/TriesTimeChart';
import TriesOriginChart from './charts/TriesOriginChart';
import ScrumEffectivityChart from './charts/ScrumEffectivityChart';
import LineoutEffectivityChart from './charts/LineoutEffectivityChart';
import './Carousel.css';

const Tabs = forwardRef(({ children, activeTab, setActiveTab }, ref) => {
  useImperativeHandle(ref, () => ({
    setActiveTab: (index) => {
      setActiveTab(index);
    },
  }));

  return (
    <div className="carousel-container">
      <div className="tabs">
        {React.Children.toArray(children).map((tab, index) => (
          <button
            key={index}
            className={`tab-button ${activeTab === index ? "active" : ""} ${tab.props.style?.display === 'none' ? 'hidden' : ''}`}
            onClick={() => setActiveTab(index)}
            aria-controls={tab.props.id}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      <div className="tab-content">{children[activeTab]}</div>
    </div>
  );
});

const Carousel = forwardRef(({ filteredEvents, handleChartClick, activeTab, setActiveTab }, ref) => {
  useImperativeHandle(ref, () => ({
    setActiveTab: (tabId) => {
      setActiveTab(tabId);
    },
  }));

  const { selectedTeam } = useContext(FilterContext);

  useEffect(() => {
    const tabButton = document.querySelector(`.tab-button[aria-controls="${activeTab}"]`);
    if (tabButton) {
      setActiveTab(Array.from(document.querySelectorAll(".tab-button")).indexOf(tabButton));
    }
  }, [filteredEvents]); // Se ejecuta cuando cambian los eventos filtrados

  const hasSetPieces = filteredEvents.some(event => event.CATEGORY === "SCRUM" || event.CATEGORY === "LINEOUT");
  const hasTackles = filteredEvents.some((event) => event.CATEGORY === "TACKLE");
  const hasMissedTackles = filteredEvents.some((event) => event.CATEGORY === "MISSED-TACKLE");
  const hasTeamTackles = filteredEvents.some((event) => event.TEAM !== "OPPONENT" && event.CATEGORY === "TACKLE");
  const hasTeamMissedTackles = filteredEvents.some((event) => event.TEAM !== "OPPONENT" && event.CATEGORY === "MISSED-TACKLE");
  const hasRivalTackles = filteredEvents.some((event) => event.TEAM === "OPPONENT" && event.CATEGORY === "TACKLE");
  const hasRivalMissedTackles = filteredEvents.some((event) => event.TEAM === "OPPONENT" && event.CATEGORY === "MISSED-TACKLE");

  const hasPenalties = filteredEvents.some((event) => event.CATEGORY === "PENALTY");
  const hasPoints = filteredEvents.some((event) => event.CATEGORY === "POINTS");
  const hasTries = filteredEvents.some((event) => event.CATEGORY === "POINTS" && event.POINTS === "TRY");
  const hasTurnovers = filteredEvents.some((event) => event.CATEGORY === "TURNOVER+" || event.CATEGORY === "TURNOVER-");

  return (
    <Tabs activeTab={activeTab} setActiveTab={setActiveTab} ref={ref}>
      <div label="Points" id="points-tab" className='tab-content'  style={{ display: hasPoints ? 'flex' : 'none' }}>
        <div className="chart-container">
          <PlayerPointsChart events={filteredEvents.filter(event => event.CATEGORY === "POINTS")} onChartClick={handleChartClick} />
        </div>
        <div className="chart-container">
          <PointsTimeChart events={filteredEvents.filter(event => event.CATEGORY === "POINTS")} onChartClick={handleChartClick} />
        </div>
        <div className="chart-container">
          <PointsTypeChart events={filteredEvents.filter(event => event.CATEGORY === "POINTS")} onChartClick={handleChartClick} />
        </div>
      </div>
      <div label="Set Pieces" id="set-pieces-tab" className='tab-content' style={{ display: hasSetPieces ? 'flex' : 'none' }}>
      {hasSetPieces && (
        <div className="chart-row">
          {/* Scrum Charts */}
          {filteredEvents.some(event => event.CATEGORY === "SCRUM" && event.TEAM !== "OPPONENT") && (
            <div className="chart-container">
              <ScrumEffectivityChart
                events={filteredEvents.filter(event => event.CATEGORY === "SCRUM" && event.TEAM !== "OPPONENT")}
                title="Our Scrums"
                onChartClick={handleChartClick}               />
            </div>
          )}
          {filteredEvents.some(event => event.CATEGORY === "SCRUM" && event.TEAM === "OPPONENT") && (
            <div className="chart-container">
              <ScrumEffectivityChart
                events={filteredEvents.filter(event => event.CATEGORY === "SCRUM" && event.TEAM === "OPPONENT")}
                title="Opponent Scrums"
                onChartClick={handleChartClick}                 />
            </div>
          )}

          {/* Lineout Charts */}
          {filteredEvents.some(event => event.CATEGORY === "LINEOUT" && event.TEAM !== "OPPONENT") && (
            <div className="chart-container">
              <LineoutEffectivityChart
                events={filteredEvents.filter(event => event.CATEGORY === "LINEOUT" && event.TEAM !== "OPPONENT")}
                title="Our Lineouts"
                onChartClick={handleChartClick}                 />
            </div>
          )}
          {filteredEvents.some(event => event.CATEGORY === "LINEOUT" && event.TEAM === "OPPONENT") && (
            <div className="chart-container">
              <LineoutEffectivityChart
                events={filteredEvents.filter(event => event.CATEGORY === "LINEOUT" && event.TEAM === "OPPONENT")}
                title="Opponent Lineouts"
                onChartClick={handleChartClick}                 />
            </div>
          )}
        </div>
      )}
    </div>
      <div label="Tackles" id="tackles-tab" className='tab-content'  style={{ display: hasTackles || hasMissedTackles ? 'flex' : 'none' }}>
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
            <TacklesEffectivityChart events={filteredEvents.filter(event => event.TEAM !== "OPPONENT")} team={selectedTeam} onChartClick={handleChartClick} style={{ maxHeight: "400px" }} />
          </div>
        ) : null}
        {hasRivalTackles || hasRivalMissedTackles ? (
          <div className="chart-container">
            <TacklesEffectivityChart events={filteredEvents.filter(event => event.TEAM === "OPPONENT")} team="OPPONENT" onChartClick={handleChartClick} style={{ maxHeight: "400px" }} />
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
      <div label="Tries" id="tries-tab" className='tab-content' style={{ display: hasTries ? 'flex' : 'none' }}>
        <div className="chart-container">
          <TriesPlayerChart events={filteredEvents.filter(event => event.CATEGORY === "POINTS")} onChartClick={handleChartClick} />
        </div>
        <div className="chart-container">
          <TriesTimeChart events={filteredEvents.filter(event => event.CATEGORY === "POINTS")} onChartClick={handleChartClick} />
        </div>
        <div className="chart-container">
          <TriesOriginChart events={filteredEvents.filter(event => event.CATEGORY === "POINTS")} onChartClick={handleChartClick} />
        </div>
      </div>
      <div label="Penalties" id="penalties-tab" className='tab-content' style={{ display: hasPenalties ? 'flex' : 'none' }}>
        <div className="chart-container">
          <PenaltiesPlayerBarChart events={filteredEvents.filter(event => event.CATEGORY === "PENALTY")} onChartClick={handleChartClick} />
        </div>
        <div className="chart-container">
          <PenaltiesTimeChart events={filteredEvents.filter(event => event.CATEGORY === "PENALTY")} onChartClick={handleChartClick} />
        </div>
        <div className="chart-container">
          <PenaltiesCausePieChart events={filteredEvents.filter(event => event.CATEGORY === "PENALTY")} onChartClick={handleChartClick} />
        </div>
      </div>
      <div label="Turnovers" id="turnovers-tab" className='tab-content'  style={{ display: hasTurnovers ? 'flex' : 'none' }}>
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
    </Tabs>
  );
});

export default Carousel;