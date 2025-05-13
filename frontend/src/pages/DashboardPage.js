import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardPage.css";

const DashboardPage = () => {
  const [matches, setMatches] = useState([]); // Estado para almacenar los partidos
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch("http://localhost:5001/matches"); // Llama al backend
        const data = await response.json();
        setMatches(data.matches || []); // Actualiza el estado con los partidos
      } catch (error) {
        console.error("Error fetching matches:", error);
      }
    };

    fetchMatches();
  }, []);

  const handleCardClick = (match) => {
    navigate(`/video-analysis/${match.ID_MATCH}`, { state: { match } });
  };

  return (
    <div className="dashboard-container">
      <h1>San Benedetto Video Analysis</h1>
      <div className="cards-container">
        {matches.map((match) => (
          <div
            key={match.ID_MATCH}
            className="match-card"
            onClick={() => handleCardClick(match)}
          >
            <h2>{match.TEAM} vs {match.OPPONENT}</h2>
            <p>Fecha: {new Date(match.DATE).toLocaleDateString()}</p>
            <p>Competición: {match.COMPETITION}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;