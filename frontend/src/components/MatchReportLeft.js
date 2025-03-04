// src/components/MatchReportLeft.js
import React from 'react';
import HorizontalBarChart from './HorizontalBarChart';

const MatchReportLeft = ({ data }) => {
  const getDataForCategory = (category, value = null) => {
    if (!data || !data.length) return { labels: [category], datasets: [{ label: 'Our Team', data: [0], isRival: false }, { label: 'Opponent', data: [0], isRival: true }] };

    const ourTeamData = value !== null
      ? data.filter(event => event.CATEGORY === category && event.TEAM === 'SAN BENEDETTO' && event['POINTS(VALUE)'] === value).length
      : data.filter(event => event.CATEGORY === category && event.TEAM === 'SAN BENEDETTO').reduce((sum, event) => sum + (event['POINTS(VALUE)'] || 0), 0);

    const rivalTeamData = value !== null
      ? data.filter(event => event.CATEGORY === category && event.TEAM === 'OPPONENT' && event['POINTS(VALUE)'] === value).length
      : data.filter(event => event.CATEGORY === category && event.TEAM === 'OPPONENT').reduce((sum, event) => sum + (event['POINTS(VALUE)'] || 0), 0);

    console.log(`Category: ${category}, Our Team: ${ourTeamData}, Opponent Team: ${rivalTeamData}`);  // Verifica los datos procesados
    console.log('Filtered data for category:', category, data.filter(event => event.CATEGORY === category));
    console.log('Filtered data for our team:', data.filter(event => event.CATEGORY === category && event.TEAM === 'SAN BENEDETTO'));
    console.log('Filtered data for opponent team:', data.filter(event => event.CATEGORY === category && event.TEAM === 'OPPONENT'));
    console.log('Values for opponent team:', data.filter(event => event.CATEGORY === category && event.TEAM === 'OPPONENT').map(event => event['POINTS(VALUE)']));

    return {
      labels: [category],
      datasets: [
        {
          label: 'Our Team',
          data: [ourTeamData],
          isRival: false,
        },
        {
          label: 'Opponent',
          data: [rivalTeamData],
          isRival: true,
        },
      ],
    };
  };

  const getDataForPali = () => {
    if (!data || !data.length) return { labels: ['GOAL-KICK'], datasets: [{ label: 'Our Team', data: [0], isRival: false }, { label: 'Opponent', data: [0], isRival: true }] };

    const ourTeamConverted = data.filter(event => event.CATEGORY === 'GOAL-KICK' && event.TEAM === 'SAN BENEDETTO' && event.GOAL_KICK === 'SUCCESS').length;
    const ourTeamTotal = data.filter(event => event.CATEGORY === 'GOAL-KICK' && event.TEAM === 'SAN BENEDETTO').length;
    const rivalTeamConverted = data.filter(event => event.CATEGORY === 'GOAL-KICK' && event.TEAM === 'OPPONENT' && event.GOAL_KICK === 'SUCCESS').length;
    const rivalTeamTotal = data.filter(event => event.CATEGORY === 'GOAL-KICK' && event.TEAM === 'OPPONENT').length;

    console.log(`Pali - Our Team: ${ourTeamConverted}/${ourTeamTotal}, Opponent Team: ${rivalTeamConverted}/${rivalTeamTotal}`);  // Verifica los datos procesados
    console.log('Filtered data for GOAL-KICK:', data.filter(event => event.CATEGORY === 'GOAL-KICK'));
    console.log('Filtered data for our team GOAL-KICK:', data.filter(event => event.CATEGORY === 'GOAL-KICK' && event.TEAM === 'SAN BENEDETTO'));
    console.log('Filtered data for opponent team GOAL-KICK:', data.filter(event => event.CATEGORY === 'GOAL-KICK' && event.TEAM === 'OPPONENT'));

    return {
      labels: ['GOAL-KICK'],
      datasets: [
        {
          label: `${ourTeamConverted}/${ourTeamTotal}`,
          data: [ourTeamConverted],
          isRival: false,
        },
        {
          label: `${rivalTeamConverted}/${rivalTeamTotal}`,
          data: [rivalTeamConverted],
          isRival: true,
        },
      ],
    };
  };

  const getDataForPosesion = () => {
    if (!data || !data.length) return { labels: ['BALL POSSESSION'], datasets: [{ label: 'Our Team', data: [0], isRival: false }, { label: 'Opponent', data: [0], isRival: true }] };

    const ourTeamAttackTime = data.filter(event => event.CATEGORY === 'ATTACK').reduce((sum, event) => sum + (event.DURATION || 0), 0);
    const rivalTeamDefenseTime = data.filter(event => event.CATEGORY === 'DEFENCE').reduce((sum, event) => sum + (event.DURATION || 0), 0);

    const totalTime = ourTeamAttackTime + rivalTeamDefenseTime;

    const ourTeamPercentage = Math.round((ourTeamAttackTime / totalTime) * 100);
    const rivalTeamPercentage = Math.round((rivalTeamDefenseTime / totalTime) * 100);

    // console.log(`Posesión - Our Team: ${ourTeamPercentage}%, Opponent Team: ${rivalTeamPercentage}%`);  // Verifica los datos procesados

    return {
      labels: ['BALL POSSESSION'],
      datasets: [
        {
          label: `${ourTeamPercentage}%`,
          data: [ourTeamPercentage],
          isRival: false,
        },
        {
          label: `${rivalTeamPercentage}%`,
          data: [rivalTeamPercentage],
          isRival: true,
        },
      ],
    };
  };

  const getDataForTackles = () => {
    if (!data || !data.length) return { labels: ['TACKLE'], datasets: [{ label: 'Our Team', data: [0], isRival: false }, { label: 'Opponent', data: [0], isRival: true }] };

    const ourTeamTackles = data.filter(event => event.CATEGORY === 'TACKLE' && event.TEAM === 'SAN BENEDETTO').length;
    const rivalTeamTackles = data.filter(event => event.CATEGORY === 'TACKLE' && event.TEAM === 'OPPONENT').length;

    // console.log(`Tackles - Our Team: ${ourTeamTackles}, Opponent Team: ${rivalTeamTackles}`);  // Verifica los datos procesados

    return {
      labels: ['TACKLE'],
      datasets: [
        {
          label: 'Our Team',
          data: [ourTeamTackles],
          isRival: false,
        },
        {
          label: 'Opponent',
          data: [rivalTeamTackles],
          isRival: true,
        },
      ],
    };
  };

  const puntosTotalesData = getDataForCategory('POINTS');
  const triesData = getDataForCategory('POINTS', 5);
  const patadasPalosData = getDataForPali();
  const posesionData = getDataForPosesion();
  const tacklesData = getDataForTackles();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
      <div style={{ width: '100%', marginBottom: '5px', textAlign: 'center' }}>
        <h4 style={{ margin: "0px" }}>Total points</h4>
        <HorizontalBarChart data={puntosTotalesData} />
      </div>
      <div style={{ width: '100%', marginBottom: '5px', textAlign: 'center' }}>
        <h4 style={{ margin: "0px" }}>Tries</h4>
        <HorizontalBarChart data={triesData} />
      </div>
      <div style={{ width: '100%', marginBottom: '5px', textAlign: 'center' }}>
        <h4 style={{ margin: "0px" }}>Goal kicks</h4>
        <HorizontalBarChart data={patadasPalosData} />
      </div>
      <div style={{ width: '100%', marginBottom: '5px', textAlign: 'center' }}>
        <h4 style={{ margin: "0px" }}>Possession</h4>
        <HorizontalBarChart data={posesionData} />
      </div>
      <div style={{ width: '100%', marginBottom: '5px', textAlign: 'center' }}>
        <h4 style={{ margin: "0px" }}>Tackles</h4>
        <HorizontalBarChart data={tacklesData} />
      </div>
    </div>
  );
};

export default MatchReportLeft;