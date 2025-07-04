import React from "react";

const MultiMatchHeader = ({ matches, selectedMatchIds, onToggleMatch }) => (
  <div style={{ padding: "10px", background: "#eee", borderBottom: "1px solid #ccc" }}>
    <h2>Selecciona los partidos a mostrar:</h2>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
      {matches.map((match) => (
        <label key={match.ID_MATCH} style={{ display: "flex", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={selectedMatchIds.includes(match.ID_MATCH)}
            onChange={() => onToggleMatch(match.ID_MATCH)}
          />
          <span style={{ marginLeft: 8 }}>
            {match.TEAM} vs {match.OPPONENT} ({new Date(match.DATE).toLocaleDateString()})
          </span>
        </label>
      ))}
    </div>
  </div>
);

export default MultiMatchHeader;