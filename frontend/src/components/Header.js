import React, { useContext } from 'react';
import FilterContext from '../context/FilterContext';

const Header = () => {
  const { matchInfo } = useContext(FilterContext);

  if (!matchInfo) return null;

  const {
    EQUIPO,
    RIVAL,
    DIA,
    CAMPEONATO,
    CANCHA,
    LLUVIA,
    BARRO,
    'VIENTO 1°T': VIENTO1T,
    'VIENTO 2°T': VIENTO2T,
    ARBITRO,
  } = matchInfo;

  const puntosEquipo = matchInfo['PUNTOS(VALOR)']?.[EQUIPO] || 0;
  const puntosRival = matchInfo['PUNTOS(VALOR)']?.[RIVAL] || 0;

  return (
    <div className="header">
      <h1>Datos Generales del Partido</h1>
      <div className="teams">
        <span>{EQUIPO}</span> vs <span>{RIVAL}</span>
      </div>
      <div className="result">
        <span>{EQUIPO}: {puntosEquipo}</span> - <span>{RIVAL}: {puntosRival}</span>
      </div>
      <div className="details">
        <div>Fecha: {DIA}</div>
        <div>Campeonato: {CAMPEONATO}</div>
        <div>Cancha: {CANCHA}</div>
        <div>Clima: {LLUVIA ? 'Lluvia' : 'Sin lluvia'}, {BARRO ? 'Barro' : 'Sin barro'}, Viento 1°T: {VIENTO1T}, Viento 2°T: {VIENTO2T}</div>
        <div>Árbitro: {ARBITRO}</div>
      </div>
    </div>
  );
};

export default Header;