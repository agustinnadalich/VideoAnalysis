import React, { useContext } from 'react';
import FilterContext from '../context/FilterContext';
import './Header.css'; // Asegúrate de importar el archivo CSS

const Header = () => {
  const { matchInfo } = useContext(FilterContext);

  if (!matchInfo) return null;

  const {
    EQUIPO,
    RIVAL,
    DIA,
    CAMPEONATO,
    RONDA,
    FECHA,
    CANCHA,
    LLUVIA,
    BARRO,
    'VIENTO 1°T': VIENTO1T,
    'VIENTO 2°T': VIENTO2T,
    ARBITRO,
    RESULTADO,
  } = matchInfo;

  const [puntosEquipo, puntosRival] = RESULTADO ? RESULTADO.split('-').map(Number) : [0, 0];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses son 0-indexados
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formattedDate = DIA ? formatDate(DIA) : null;

  const clima = [];
  if (LLUVIA === 'SI') clima.push('Lluvia');
  if (BARRO === 'SI') clima.push('Barro');
  if (VIENTO1T === 'F') clima.push('Viento a favor el primer tiempo');
  if (VIENTO1T === 'C') clima.push('Viento en contra el primer tiempo');
  if (VIENTO2T === 'F') clima.push('Viento a favor el segundo tiempo');
  if (VIENTO2T === 'C') clima.push('Viento en contra el segundo tiempo');
  if (VIENTO1T === '0' && VIENTO2T === '0') {
    // No agregar nada acerca del viento
  }

  const getLogoPath = (teamName) => {
    return `/Logos/${teamName}.jpg`;
  };

  return (
    <div className="header">
      <div className="teams">
        <div className="team">
          {EQUIPO && <img src={getLogoPath(EQUIPO)} alt={`${EQUIPO} logo`} className="team-logo" onError={(e) => e.target.style.display = 'none'} />}
          <span>{EQUIPO}</span>
        </div>
        <div className="score">
          <span className="points">{puntosEquipo}</span>
          <span>-</span>
          <span className="points">{puntosRival}</span>
        </div>
        <div className="team">
          {RIVAL && <img src={getLogoPath(RIVAL)} alt={`${RIVAL} logo`} className="team-logo" onError={(e) => e.target.style.display = 'none'} />}
          <span>{RIVAL}</span>
        </div>
      </div>
      <div className="details">
        {formattedDate && <div>Fecha: {formattedDate}</div>}
        {CAMPEONATO && CAMPEONATO !== '-' && <div>Campeonato: {CAMPEONATO}</div>}
        {RONDA && <div>Ronda: {RONDA}</div>}
        {FECHA && <div>Fecha: {FECHA}</div>}
        {CANCHA && CANCHA !== '-' && <div>Cancha: {CANCHA}</div>}
        {clima.length > 0 && <div>Clima: {clima.join(', ')}</div>}
        {ARBITRO && ARBITRO !== '-' && <div>Árbitro: {ARBITRO}</div>}
      </div>
    </div>
  );
};

export default Header;