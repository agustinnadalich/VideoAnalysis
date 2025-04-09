// src/components/MatchReportRight.js
import React from "react";
import HorizontalBarChart from "./HorizontalBarChart";

const MatchReportRight = ({ data }) => {
  const getDataForCategory = (category, value = null) => {
    if (!data || !data.length)
      return {
        labels: [category],
        datasets: [
          { label: "Our Team", data: [0], isRival: false },
          { label: "Opponent", data: [0], isRival: true },
        ],
      };

    const ourTeamData =
      value !== null
        ? data.filter(
            (event) =>
              event.CATEGORY === category &&
              event.TEAM !== "OPPONENT" &&
              event["POINTS(VALUE)"] === value
          ).length
        : data
            .filter(
              (event) =>
                event.CATEGORY === category && event.TEAM !== "OPPONENT"
            )
            .reduce((sum, event) => sum + (event["POINTS(VALUE)"] || 0), 0);

    const rivalTeamData =
      value !== null
        ? data.filter(
            (event) =>
              event.CATEGORY === category &&
              event.TEAM === "OPPONENT" &&
              event["POINTS(VALUE)"] === value
          ).length
        : data
            .filter(
              (event) =>
                event.CATEGORY === category && event.TEAM === "OPPONENT"
            )
            .reduce((sum, event) => sum + (event["POINTS(VALUE)"] || 0), 0);

    // console.log(
    //   `Category: ${category}, Our Team: ${ourTeamData}, Opponent Team: ${rivalTeamData}`
    // ); // Verifica los datos procesados

    return {
      labels: [category],
      datasets: [
        {
          label: "Our Team",
          data: [ourTeamData],
          isRival: false,
        },
        {
          label: "Opponent",
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
          { label: "Our Team", data: [0], isRival: false },
          { label: "Opponent", data: [0], isRival: true },
        ],
      };

    const ourTeamPenales = data.filter(
      (event) => event.CATEGORY === "PENALTY" && event.TEAM !== "OPPONENT"
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
          label: "Our Team",
          data: [ourTeamPenales],
          isRival: false,
        },
        {
          label: "Opponent",
          data: [rivalTeamPenales],
          isRival: true,
        },
      ],
    };
  };

  const getDataForTurnovers = () => {
    if (!data || !data.length) return { labels: ['TURNOVERS'], datasets: [{ label: 'Our Team', data: [0], isRival: false }, { label: 'Opponent', data: [0], isRival: true }] };

    const persaCount = data.filter(event => event.CATEGORY === 'TURNOVER-').length;
    const ricuperataCount = data.filter(event => event.CATEGORY === 'TURNOVER+').length;

    // console.log(`Turnovers - TURNOVER-: ${persaCount}, TURNOVER+: ${ricuperataCount}`);  // Verifica los datos procesados

    return {
      labels: ['TURNOVERS'],
      datasets: [
        {
          label: 'Our Team',
          data: [ricuperataCount],
          isRival: false,
        },
        {
          label: 'Opponent',
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
          { label: "Our Team", data: [0], isRival: false },
          { label: "Opponent", data: [0], isRival: true },
        ],
      };

    const ourTeamBreaks = data.filter(
      (event) => event.CATEGORY === "BREAK" && event.TEAM !== "OPPONENT"
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
          label: "Our Team",
          data: [ourTeamBreaks],
          isRival: false,
        },
        {
          label: "Opponent",
          data: [rivalTeamBreaks],
          isRival: true,
        },
      ],
    };
  };

  const getDataForFormacionesFijas = () => {
    if (!data || !data.length)
      return {
        labels: ["SET PIECES"],
        datasets: [
          { label: "Our Team", data: [0], isRival: false },
          { label: "Opponent", data: [0], isRival: true },
        ],
      };

    const ourTeamFormaciones = data.filter(
      (event) =>
        (event.CATEGORY === "LINEOUT" || event.CATEGORY === "SCRUM") &&
        event.TEAM !== "OPPONENT"
    ).length;
    const rivalTeamFormaciones = data.filter(
      (event) =>
        (event.CATEGORY === "LINEOUT" || event.CATEGORY === "SCRUM") &&
        event.TEAM === "OPPONENT"
    ).length;

    const ourTeamVinta = data.filter(
      (event) =>
        (event.CATEGORY === "LINEOUT" || event.CATEGORY === "SCRUM") &&
        event.TEAM !== "OPPONENT" &&
        (event["SCRUM_RESULT"] === "WIN" ||
          event["LINE_RESULT"] === "CLEAN" ||
          event["LINE_RESULT"] === "DIRTY")
    ).length;
    const rivalTeamVinta = data.filter(
      (event) =>
        (event.CATEGORY === "LINEOUT" || event.CATEGORY === "SCRUM") &&
        event.TEAM === "OPPONENT" &&
        (event["SCRUM_RESULT"] === "WIN" ||
          event["LINE_RESULT"] === "CLEAN" ||
          event["LINE_RESULT"] === "DIRTY")
    ).length;

    // console.log(
    //   `Formaciones Fijas - Our Team: ${ourTeamFormaciones}, Opponent Team: ${rivalTeamFormaciones}, Our Team Vinta: ${ourTeamVinta}, Opponent Team Vinta: ${rivalTeamVinta}`
    // ); // Verifica los datos procesados

    return {
      labels: ["SET PIECES"],
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

  const getDataForCards = () => {
    console.log("Data received in getDataForCards:", data); // Verifica los datos que llegan
  
    if (!data || !data.length)
      return {
        labels: ["Yellow Cards", "Red Cards"],
        datasets: [
          {
            label: "Our Team",
            data: [0, 0], // Yellow, Red
            backgroundColor: ["#FFD700", "#FF4500"], // Yellow, Red
            isRival: false,
          },
          {
            label: "Opponent",
            data: [0, 0], // Yellow, Red
            backgroundColor: ["#FFD700", "#FF4500"], // Yellow, Red
            isRival: true,
          },
        ],
      };
  
    const ourTeamYellowCards = data.filter(
      (event) =>
        event.CATEGORY === "PENALTY" &&
        event.TEAM !== "OPPONENT" &&
        event["YELLOW-CARD"]?.includes("Player")
    ).length;
  
    const ourTeamRedCards = data.filter(
      (event) =>
        event.CATEGORY === "PENALTY" &&
        event.TEAM !== "OPPONENT" &&
        event["RED-CARD"]?.includes("Player")
    ).length;
  
    const opponentYellowCards = data.filter(
      (event) =>
        event.CATEGORY === "PENALTY" &&
        event.TEAM === "OPPONENT" &&
        event["YELLOW-CARD"]?.includes("Player")
    ).length;
  
    const opponentRedCards = data.filter(
      (event) =>
        event.CATEGORY === "PENALTY" &&
        event.TEAM === "OPPONENT" &&
        event["RED-CARD"]?.includes("Player")
    ).length;
  
    console.log("Processed card data:", {
      ourTeamYellowCards,
      ourTeamRedCards,
      opponentYellowCards,
      opponentRedCards,
    }); // Verifica los datos procesados
  
    return {
      labels: ["Yellow Cards", "Red Cards"], // Separate labels for Yellow and Red cards
      datasets: [
        {
          label: "Our Team",
          data: [ourTeamYellowCards, ourTeamRedCards], // Yellow, Red
          backgroundColor: ["#FFD700", "#FF4500"], // Yellow, Red
          isRival: false,
        },
        {
          label: "Opponent",
          data: [opponentYellowCards, opponentRedCards], // Yellow, Red
          backgroundColor: ["#FFD700", "#FF4500"], // Yellow, Red
          isRival: true,
        },
      ],
    };
  };

  const penalesData = getDataForPenales();
  const turnoversData = getDataForTurnovers();
  const quiebresData = getDataForQuiebres();
  const cardsData = getDataForCards();
  const formacionesFijasData = getDataForFormacionesFijas();

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <h3>Stats</h3>
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
          <h4 style={{ margin: "0px" }}>Our Team</h4>
          <h4 style={{ margin: "0px" }}>Opponent</h4>
        </div>
      </div>
      <div style={{ width: "100%", marginBottom: "5px", textAlign: "center" }}>
        <h4 style={{ margin: "0px" }}>Penalties</h4>
        <HorizontalBarChart data={penalesData} />
      </div>
      <div style={{ width: "100%", marginBottom: "5px", textAlign: "center" }}>
        <h4 style={{ margin: "0px" }}>Turnovers</h4>
        <HorizontalBarChart data={turnoversData} />
      </div>
      <div style={{ width: "100%", marginBottom: "5px", textAlign: "center" }}>
        <h4 style={{ margin: "0px" }}>Breaks</h4>
        <HorizontalBarChart data={quiebresData} />
      </div>
      <div style={{ width: "100%", marginBottom: "5px", textAlign: "center" }}>
        <h4 style={{ margin: "0px" }}>Set pieces</h4>
        <HorizontalBarChart data={formacionesFijasData} />
      </div>
      <div style={{ width: "100%", marginBottom: "5px", textAlign: "center" }}>
        <h4 style={{ margin: "0px" }}>Cards</h4>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "lightslategray"}}>
          <div style={{ color: "#FFD700", fontWeight: "bold" }}>
            {cardsData.datasets[0].data[0]} /{" "}
            <span style={{ color: "#FF4500" }}>{cardsData.datasets[0].data[1]}</span>
          </div>
          <div style={{ color: "#FFD700", fontWeight: "bold" }}>
            {cardsData.datasets[1].data[0]} /{" "}
            <span style={{ color: "#FF4500" }}>{cardsData.datasets[1].data[1]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchReportRight;
