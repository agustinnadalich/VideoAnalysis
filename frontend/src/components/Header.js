import React, { useContext } from 'react';
import FilterContext from '../context/FilterContext';
import './Header.css'; // Asegúrate de importar el archivo CSS

const Header = () => {
  const { matchInfo } = useContext(FilterContext);

  if (!matchInfo) return null;

  const {
    TEAM,
    OPPONENT,
    DATE,
    COMPETITION,
    ROUND,
    GAME,
    FIELD,
    RAIN,
    MUDDY,
    WIND_1P,
    WIND_2P,
    REFEREE,
    RESULT,
  } = matchInfo;

  const [puntosEquipo, puntosRival] = RESULT ? RESULT.split('-').map(Number) : [0, 0];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses son 0-indexados
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formattedDate = DATE ? formatDate(DATE) : null;

  const clima = [];
  if (RAIN === 'SI') clima.push('Rain');
  if (MUDDY === 'SI') clima.push('Muddy');
  if (WIND_1P === 'F') clima.push('Wind in favor the first half');
  if (WIND_1P === 'C') clima.push('Wind against the first half');
  if (WIND_2P === 'F') clima.push('Wind in favor the second half');
  if (WIND_2P === 'C') clima.push('Wind against the second half');
  if (WIND_1P === '0' && WIND_2P === '0') {
    // No agregar nada acerca del viento
  }

  const getLogoPath = (teamName) => {
    return `/Logos/${teamName}.jpg`;
  };

  return (
    <div className="header">
      <div className="teams">
        <div className="team">
          {TEAM && <img src={getLogoPath(TEAM)} alt={`${TEAM} logo`} className="team-logo" onError={(e) => e.target.style.display = 'none'} />}
          <span>{TEAM}</span>
        </div>
        <div className="score">
          <span className="points">{puntosEquipo}</span>
          <span>-</span>
          <span className="points">{puntosRival}</span>
        </div>
        <div className="team">
          {OPPONENT && <img src={getLogoPath(OPPONENT)} alt={`${OPPONENT} logo`} className="team-logo" onError={(e) => e.target.style.display = 'none'} />}
          <span>{OPPONENT}</span>
        </div>
      </div>
      <div className="details">
        {formattedDate && <div>Date: {formattedDate}</div>}
        {COMPETITION && COMPETITION !== '-' && <div>Tournament: {COMPETITION}</div>}
        {ROUND && <div>Round: {ROUND}</div>}
        {GAME && <div>Game: {GAME}</div>}
        {FIELD && FIELD !== '-' && <div>Field: {FIELD}</div>}
        {clima.length > 0 && <div>Weather: {clima.join(', ')}</div>}
        {REFEREE && REFEREE !== '-' && <div>Referee: {REFEREE}</div>}
      </div>
    </div>
  );
};

export default Header;