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
          { label: "Equipo Rival", data: [0], isRival: true },
        ],
      };

    const ourTeamData =
      value !== null
        ? data.filter(
            (event) =>
              event.CATEGORÍA === category &&
              event.EQUIPO === "SAN BENEDETTO" &&
              event["PUNTOS (VALOR)"] === value
          ).length
        : data
            .filter(
              (event) =>
                event.CATEGORÍA === category && event.EQUIPO === "SAN BENEDETTO"
            )
            .reduce((sum, event) => sum + (event["PUNTOS (VALOR)"] || 0), 0);

    const rivalTeamData =
      value !== null
        ? data.filter(
            (event) =>
              event.CATEGORÍA === category &&
              event.EQUIPO === "RIVAL" &&
              event["PUNTOS (VALOR)"] === value
          ).length
        : data
            .filter(
              (event) =>
                event.CATEGORÍA === category && event.EQUIPO === "RIVAL"
            )
            .reduce((sum, event) => sum + (event["PUNTOS (VALOR)"] || 0), 0);

    console.log(
      `Category: ${category}, Our Team: ${ourTeamData}, Rival Team: ${rivalTeamData}`
    ); // Verifica los datos procesados

    return {
      labels: [category],
      datasets: [
        {
          label: "Nuestro Equipo",
          data: [ourTeamData],
          isRival: false,
        },
        {
          label: "Equipo Rival",
          data: [rivalTeamData],
          isRival: true,
        },
      ],
    };
  };

  const getDataForPenales = () => {
    if (!data || !data.length)
      return {
        labels: ["FALLO"],
        datasets: [
          { label: "Nuestro Equipo", data: [0], isRival: false },
          { label: "Equipo Rival", data: [0], isRival: true },
        ],
      };

    const ourTeamPenales = data.filter(
      (event) => event.CATEGORÍA === "FALLO" && event.EQUIPO === "SAN BENEDETTO"
    ).length;
    const rivalTeamPenales = data.filter(
      (event) => event.CATEGORÍA === "FALLO" && event.EQUIPO === "RIVAL"
    ).length;

    console.log(
      `Penales - Our Team: ${ourTeamPenales}, Rival Team: ${rivalTeamPenales}`
    ); // Verifica los datos procesados

    return {
      labels: ["FALLO"],
      datasets: [
        {
          label: "Nuestro Equipo",
          data: [ourTeamPenales],
          isRival: false,
        },
        {
          label: "Equipo Rival",
          data: [rivalTeamPenales],
          isRival: true,
        },
      ],
    };
  };

  const getDataForTurnovers = () => {
    if (!data || !data.length) return { labels: ['TURNOVERS'], datasets: [{ label: 'Nuestro Equipo', data: [0], isRival: false }, { label: 'Equipo Rival', data: [0], isRival: true }] };

    const persaCount = data.filter(event => event.CATEGORÍA === 'PERSA').length;
    const ricuperataCount = data.filter(event => event.CATEGORÍA === 'RICUPERATA').length;

    console.log(`Turnovers - PERSA: ${persaCount}, RICUPERATA: ${ricuperataCount}`);  // Verifica los datos procesados

    return {
      labels: ['TURNOVERS'],
      datasets: [
        {
          label: 'Nuestro Equipo',
          data: [ricuperataCount],
          isRival: false,
        },
        {
          label: 'Equipo Rival',
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
          { label: "Equipo Rival", data: [0], isRival: true },
        ],
      };

    const ourTeamBreaks = data.filter(
      (event) => event.CATEGORÍA === "BREAK" && event.EQUIPO === "SAN BENEDETTO"
    ).length;
    const rivalTeamBreaks = data.filter(
      (event) => event.CATEGORÍA === "BREAK" && event.EQUIPO === "RIVAL"
    ).length;

    console.log(
      `Quiebres - Our Team: ${ourTeamBreaks}, Rival Team: ${rivalTeamBreaks}`
    ); // Verifica los datos procesados

    return {
      labels: ["BREAK"],
      datasets: [
        {
          label: "Nuestro Equipo",
          data: [ourTeamBreaks],
          isRival: false,
        },
        {
          label: "Equipo Rival",
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
          { label: "Equipo Rival", data: [0], isRival: true },
        ],
      };

    const ourTeamFormaciones = data.filter(
      (event) =>
        (event.CATEGORÍA === "TOUCHE" || event.CATEGORÍA === "MISCHIA") &&
        event.EQUIPO === "SAN BENEDETTO"
    ).length;
    const rivalTeamFormaciones = data.filter(
      (event) =>
        (event.CATEGORÍA === "TOUCHE" || event.CATEGORÍA === "MISCHIA") &&
        event.EQUIPO === "RIVAL"
    ).length;

    const ourTeamVinta = data.filter(
      (event) =>
        (event.CATEGORÍA === "TOUCHE" || event.CATEGORÍA === "MISCHIA") &&
        event.EQUIPO === "SAN BENEDETTO" &&
        (event["RESULTADO SCRUM"] === "VINTA" ||
          event["RESULTADO LINE"] === "PULITA" ||
          event["RESULTADO LINE"] === "SPORCA")
    ).length;
    const rivalTeamVinta = data.filter(
      (event) =>
        (event.CATEGORÍA === "TOUCHE" || event.CATEGORÍA === "MISCHIA") &&
        event.EQUIPO === "RIVAL" &&
        (event["RESULTADO SCRUM"] === "VINTA" ||
          event["RESULTADO LINE"] === "PULITA" ||
          event["RESULTADO LINE"] === "SPORCA")
    ).length;

    console.log(
      `Formaciones Fijas - Our Team: ${ourTeamFormaciones}, Rival Team: ${rivalTeamFormaciones}, Our Team Vinta: ${ourTeamVinta}, Rival Team Vinta: ${rivalTeamVinta}`
    ); // Verifica los datos procesados

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
