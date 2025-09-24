import React from 'react';
import { useFilterContext } from '@/context/FilterContext';
import { computeTackleStatsAggregated } from '@/utils/teamUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TacklesByTeamChart = ({ events, onChartClick }) => {
  const { ourTeamsList } = useFilterContext();
  
  console.log("🎯 TacklesByTeamChart - Received events:", events?.length || 0);
  console.log("🎯 TacklesByTeamChart - Our teams list:", ourTeamsList);
  console.log("🎯 TacklesByTeamChart - Sample event:", events?.[0]);
  
  // Usar stats agregados para multi-match: "Nuestros Equipos" vs "Rivales"
  // Aplicar filtros por ADVANCE/AVANCE si existen en el contexto antes de computar stats
  const { filterDescriptors } = useFilterContext();

  const extractAdvance = (event: any) => {
    return (
      event.extra_data?.descriptors?.AVANCE ||
      event.extra_data?.AVANCE ||
      event.extra_data?.advance ||
      event.extra_data?.advance_type ||
      event.advance ||
      event.ADVANCE ||
      event.AVANCE ||
      null
    );
  };

  let eventsToUse = events || [];
  const advanceFilters = (filterDescriptors || []).filter((f: any) => f.descriptor === 'ADVANCE' || f.descriptor === 'AVANCE').map((f: any) => f.value);
  if (advanceFilters.length > 0) {
    eventsToUse = eventsToUse.filter(ev => {
      const adv = extractAdvance(ev);
      if (Array.isArray(adv)) return adv.some(a => advanceFilters.includes(a));
      return adv !== null && advanceFilters.includes(adv);
    });
  }

  const statsByTeam = computeTackleStatsAggregated(eventsToUse, ourTeamsList);

  const ourStats = statsByTeam[0] || { successful: 0, missed: 0, effectiveness: 0 };
  const oppStats = statsByTeam[1] || { successful: 0, missed: 0, effectiveness: 0 };

  const ourTeamEffectiveness = ourStats.effectiveness;
  const opponentEffectiveness = oppStats.effectiveness;

  const data = {
    labels: [statsByTeam[0]?.teamName || 'Nuestros Equipos', statsByTeam[1]?.teamName || 'Rivales'],
    datasets: [
      {
        label: `Tackles Exitosos (${ourTeamEffectiveness}% efectividad)`,
        data: [ourStats.successful, oppStats.successful],
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: `Tackles Errados (${opponentEffectiveness}% efectividad rival)`,
        data: [ourStats.missed, oppStats.missed],
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const handleChartClick = (event: any, elements: any, chart: any) => {
    if (!elements || elements.length === 0 || !onChartClick) return;
    const el = elements[0];
    const chartRef = el.element?.$context?.chart ?? chart;
    const index = el.index ?? el.element?.index ?? el.element?.$context?.dataIndex;
    const datasetIndex = el.datasetIndex ?? el.dataset?.datasetIndex ?? el.element?.$context?.datasetIndex;

    // Usar categorías agregadas para multi-match
    const teamCategory = index === 0 ? 'OUR_TEAM' : 'Rival';

    // Enviar filtros adicionales: tipo de tackle según dataset, y equipo según categoría agregada
    const tackleType = datasetIndex === 0 ? 'TACKLE' : 'MISSED-TACKLE';
    const additionalFilters = [{ descriptor: 'event_type', value: tackleType }, { descriptor: 'TEAM', value: teamCategory }];

    onChartClick(event, elements, chartRef, 'team_tackles', 'tackles-tab', additionalFilters);
  };  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Tackles por Equipo - Efectividad',
      },
      tooltip: {
        callbacks: {
          afterLabel: (context) => {
            const teamIndex = context.dataIndex;
            const teamName = teamIndex === 0 ? 'Nuestro Equipo' : 'Rival';
            const effectiveness = teamIndex === 0 ? ourTeamEffectiveness : opponentEffectiveness;
            return `Efectividad: ${effectiveness}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    onClick: (event: any, elements: any, chart: any) => handleChartClick(event, elements, chart),
  };

  console.log("🎯 TacklesByTeamChart - Final data:", data);
  console.log("🎯 TacklesByTeamChart - Team stats:", {
    ourTeam: { successful: ourStats.successful, missed: ourStats.missed, effectiveness: ourTeamEffectiveness },
    opponent: { successful: oppStats.successful, missed: oppStats.missed, effectiveness: opponentEffectiveness }
  });

  return (
    <div className="w-full">
      <Bar data={data} options={options} height={300} />
    </div>
  );
};

export default TacklesByTeamChart;
