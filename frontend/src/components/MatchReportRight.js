// src/components/MatchReportRight.js
import React from "react";
import HorizontalBarChart from "./HorizontalBarChart";

const MatchReportRight = ({ data }) => {
  const getDataForCategory = (category, value = null) => {
    if (!data || !data.length)
      return {
        labels: [category],
        datasets: [
          { label: "Nuestro Equipo", data: [0], isRival: false },
          { label: "Equipo Opponent", data: [0], isRival: true },
        ],
      };

    const ourTeamData =
      value !== null
        ? data.filter(
            (event) =>
              event.CATEGORY === category &&
              event.TEAM === "SAN BENEDETTO" &&
              event["PUNTOS (VALOR)"] === value
          ).length
        : data
            .filter(
              (event) =>
                event.CATEGORY === category && event.TEAM === "SAN BENEDETTO"
            )
            .reduce((sum, event) => sum + (event["PUNTOS (VALOR)"] || 0), 0);

    const rivalTeamData =
      value !== null
        ? data.filter(
            (event) =>
              event.CATEGORY === category &&
              event.TEAM === "OPPONENT" &&
              event["PUNTOS (VALOR)"] === value
          ).length
        : data
            .filter(
              (event) =>
                event.CATEGORY === category && event.TEAM === "OPPONENT"
            )
            .reduce((sum, event) => sum + (event["PUNTOS (VALOR)"] || 0), 0);

    // console.log(
    //   `Category: ${category}, Our Team: ${ourTeamData}, Opponent Team: ${rivalTeamData}`
    // ); // Verifica los datos procesados

    return {
      labels: [category],
      datasets: [
        {
          label: "Nuestro Equipo",
          data: [ourTeamData],
          isRival: false,
        },
        {
          label: "Equipo Opponent",
          data: [rivalTeamData],
          isRival: true,
        },
      ],
    };
  };

  const getDataForPenales = () => {
    if (!data || !data.length)
      return {
        labels: ["PENALTY"],
        datasets: [
          { label: "Nuestro Equipo", data: [0], isRival: false },
          { label: "Equipo Opponent", data: [0], isRival: true },
        ],
      };

    const ourTeamPenales = data.filter(
      (event) => event.CATEGORY === "PENALTY" && event.TEAM === "SAN BENEDETTO"
    ).length;
    const rivalTeamPenales = data.filter(
      (event) => event.CATEGORY === "PENALTY" && event.TEAM === "OPPONENT"
    ).length;

    // console.log(
    //   `Penales - Our Team: ${ourTeamPenales}, Opponent Team: ${rivalTeamPenales}`
    // ); // Verifica los datos procesados

    return {
      labels: ["PENALTY"],
      datasets: [
        {
          label: "Nuestro Equipo",
          data: [ourTeamPenales],
          isRival: false,
        },
        {
          label: "Equipo Opponent",
          data: [rivalTeamPenales],
          isRival: true,
        },
      ],
    };
  };

  const getDataForTurnovers = () => {
    if (!data || !data.length) return { labels: ['TURNOVERS'], datasets: [{ label: 'Nuestro Equipo', data: [0], isRival: false }, { label: 'Equipo Opponent', data: [0], isRival: true }] };

    const persaCount = data.filter(event => event.CATEGORY === 'TURNOVER-').length;
    const ricuperataCount = data.filter(event => event.CATEGORY === 'TURNOVER+').length;

    // console.log(`Turnovers - TURNOVER-: ${persaCount}, TURNOVER+: ${ricuperataCount}`);  // Verifica los datos procesados

    return {
      labels: ['TURNOVERS'],
      datasets: [
        {
          label: 'Nuestro Equipo',
          data: [ricuperataCount],
          isRival: false,
        },
        {
          label: 'Equipo Opponent',
          data: [persaCount],
          isRival: true,
        },
      ],
    };
  };

  const getDataForQuiebres = () => {
    if (!data || !data.length)
      return {
        labels: ["BREAK"],
        datasets: [
          { label: "Nuestro Equipo", data: [0], isRival: false },
          { label: "Equipo Opponent", data: [0], isRival: true },
        ],
      };

    const ourTeamBreaks = data.filter(
      (event) => event.CATEGORY === "BREAK" && event.TEAM === "SAN BENEDETTO"
    ).length;
    const rivalTeamBreaks = data.filter(
      (event) => event.CATEGORY === "BREAK" && event.TEAM === "OPPONENT"
    ).length;

    // console.log(
    //   `Quiebres - Our Team: ${ourTeamBreaks}, Opponent Team: ${rivalTeamBreaks}`
    // ); // Verifica los datos procesados

    return {
      labels: ["BREAK"],
      datasets: [
        {
          label: "Nuestro Equipo",
          data: [ourTeamBreaks],
          isRival: false,
        },
        {
          label: "Equipo Opponent",
          data: [rivalTeamBreaks],
          isRival: true,
        },
      ],
    };
  };

  const getDataForFormacionesFijas = () => {
    if (!data || !data.length)
      return {
        labels: ["FORMACIONES FIJAS"],
        datasets: [
          { label: "Nuestro Equipo", data: [0], isRival: false },
          { label: "Equipo Opponent", data: [0], isRival: true },
        ],
      };

    const ourTeamFormaciones = data.filter(
      (event) =>
        (event.CATEGORY === "LINEOUT" || event.CATEGORY === "SCRUM") &&
        event.TEAM === "SAN BENEDETTO"
    ).length;
    const rivalTeamFormaciones = data.filter(
      (event) =>
        (event.CATEGORY === "LINEOUT" || event.CATEGORY === "SCRUM") &&
        event.TEAM === "OPPONENT"
    ).length;

    const ourTeamVinta = data.filter(
      (event) =>
        (event.CATEGORY === "LINEOUT" || event.CATEGORY === "SCRUM") &&
        event.TEAM === "SAN BENEDETTO" &&
        (event["SCRUM_RESULT"] === "VINTA" ||
          event["LINE_RESULT"] === "PULITA" ||
          event["LINE_RESULT"] === "SPORCA")
    ).length;
    const rivalTeamVinta = data.filter(
      (event) =>
        (event.CATEGORY === "LINEOUT" || event.CATEGORY === "SCRUM") &&
        event.TEAM === "OPPONENT" &&
        (event["SCRUM_RESULT"] === "VINTA" ||
          event["LINE_RESULT"] === "PULITA" ||
          event["LINE_RESULT"] === "SPORCA")
    ).length;

    // console.log(
    //   `Formaciones Fijas - Our Team: ${ourTeamFormaciones}, Opponent Team: ${rivalTeamFormaciones}, Our Team Vinta: ${ourTeamVinta}, Opponent Team Vinta: ${rivalTeamVinta}`
    // ); // Verifica los datos procesados

    return {
      labels: ["FORMACIONES FIJAS"],
      datasets: [
        {
          label: `${ourTeamVinta}/${ourTeamFormaciones}`,
          data: [ourTeamVinta],
          isRival: false,
        },
        {
          label: `${rivalTeamVinta}/${rivalTeamFormaciones}`,
          data: [rivalTeamVinta],
          isRival: true,
        },
      ],
    };
  };

  const penalesData = getDataForPenales();
  const turnoversData = getDataForTurnovers();
  const quiebresData = getDataForQuiebres();
  const tarjetasData = getDataForCategory("TARJETA");
  const formacionesFijasData = getDataForFormacionesFijas();

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <h3>Estadísticas</h3>
      <div style={{ width: "100%", marginRight: "5px", marginLeft: "5px" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "20px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <h4 style={{ margin: "0px" }}>Local</h4>
          <h4 style={{ margin: "0px" }}>Visitante</h4>
        </div>
      </div>
      <div style={{ width: "100%", marginBottom: "5px", textAlign: "center" }}>
        <h4 style={{ margin: "0px" }}>Penales</h4>
        <HorizontalBarChart data={penalesData} />
      </div>
      <div style={{ width: "100%", marginBottom: "5px", textAlign: "center" }}>
        <h4 style={{ margin: "0px" }}>Turnovers</h4>
        <HorizontalBarChart data={turnoversData} />
      </div>
      <div style={{ width: "100%", marginBottom: "5px", textAlign: "center" }}>
        <h4 style={{ margin: "0px" }}>Quiebres de Línea</h4>
        <HorizontalBarChart data={quiebresData} />
      </div>
      <div style={{ width: "100%", marginBottom: "5px", textAlign: "center" }}>
        <h4 style={{ margin: "0px" }}>Tarjetas</h4>
        <HorizontalBarChart data={tarjetasData} />
      </div>
      <div style={{ width: "100%", marginBottom: "5px", textAlign: "center" }}>
        <h4 style={{ margin: "0px" }}>Formaciones Fijas</h4>
        <HorizontalBarChart data={formacionesFijasData} />
      </div>
    </div>
  );
};

export default MatchReportRight;
