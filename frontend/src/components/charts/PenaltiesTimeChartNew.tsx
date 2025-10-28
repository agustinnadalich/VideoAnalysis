import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { getTeamFromEvent, detectOurTeams, normalizeString } from '../../utils/teamUtils';
import { useFilterContext } from '../../context/FilterContext';

type Props = {
  events: any[];
  onChartClick?: (event: any, elements: any, chart: any, chartType: string, tabId: string, descriptors?: any[]) => void;
};

const PenaltiesTimeChart: React.FC<Props> = ({ events, onChartClick }) => {
  const [penaltiesTimeChartData, setPenaltiesTimeChartData] = useState<any | null>(null);
  const { ourTeamsList } = useFilterContext();

  useEffect(() => {
    const penaltyEvents = (events || []).filter((e) => e && (e.CATEGORY === 'PENALTY' || e.event_type === 'PENALTY'));

    const getSeconds = (ev: any) => {
      if (!ev) return null;
      if (ev.timestamp_sec !== undefined && ev.timestamp_sec !== null) return Number(ev.timestamp_sec);
      if (ev.SECOND !== undefined && ev.SECOND !== null) return Number(ev.SECOND);
      if (ev.SECOND_SINCE !== undefined && ev.SECOND_SINCE !== null) return Number(ev.SECOND_SINCE);
      if (ev.Time_Group) return null; // already grouped
      if (ev.TIME) {
        const parts = String(ev.TIME).split(':').map((p) => Number(p));
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
      }
      if (ev.extra_data && ev.extra_data.Game_Time) {
        const gt = String(ev.extra_data.Game_Time);
        const parts = gt.split(':').map((p) => Number(p));
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
      }
      return null;
    };

    const timePeriods = ["0'- 20'", "20' - 40'", "40' - 60'", "60' - 80'", "+80'"];

    const normalizeGroupLabel = (s: string) => String(s || '').replace(/\s+/g, ' ').replace(/\s?-\s?/, ' - ').trim();
    const mapAliasToGroup = (raw: any) => {
      if (raw === null || raw === undefined) return '';
      const s = String(raw).toLowerCase().trim();
      if (s.includes('primer') || s.includes('1º') || s === 'q1' || s === '1q' || /^q\s*1/i.test(s)) return "0'- 20'";
      if (s.includes('segundo') || s.includes('2º') || s === 'q2' || s === '2q' || /^q\s*2/i.test(s)) return "20' - 40'";
      if (s.includes('tercer') || s.includes('terc') || s.includes('3º') || s === 'q3' || s === '3q' || /^q\s*3/i.test(s)) return "40' - 60'";
      if (s.includes('cuarto') || s.includes('4º') || s === 'q4' || s === '4q' || /^q\s*4/i.test(s)) return "60' - 80'";
      if (s.includes('first') || s.includes('1st') || s.includes('q1')) return "0'- 20'";
      if (s.includes('second') || s.includes('2nd') || s.includes('q2')) return "20' - 40'";
      if (s.includes('third') || s.includes('3rd') || s.includes('q3')) return "40' - 60'";
      if (s.includes('fourth') || s.includes('4th') || s.includes('q4')) return "60' - 80'";
      return normalizeGroupLabel(raw);
    };

    let referenceOurTeams = (ourTeamsList && ourTeamsList.length > 0) ? ourTeamsList : detectOurTeams(events || []);
    referenceOurTeams = referenceOurTeams.map((t: string) => normalizeString(t).toLowerCase()).filter((t: string) => t);

    const ourDataset = timePeriods.map((group) => {
      const rangeStart = parseInt(group.split("'")[0], 10) * 60;
      const rangeEnd = rangeStart + 20 * 60;
      const groupEvents = penaltyEvents.filter((ev) => {
        const evTimeGroupRaw = ev.Time_Group ?? ev.extra_data?.Time_Group ?? ev.extra_data?.Time_Group?.label ?? null;
        if (evTimeGroupRaw) return mapAliasToGroup(evTimeGroupRaw) === group && !isOpponent(ev);
        const s = getSeconds(ev);
        if (s === null) return false;
        return (group !== "+80'" ? (s >= rangeStart && s < rangeEnd) : s >= rangeStart) && !isOpponent(ev);
      });
      return groupEvents.length;
    });

    const opponentDataset = timePeriods.map((group) => {
      const rangeStart = parseInt(group.split("'")[0], 10) * 60;
      const rangeEnd = rangeStart + 20 * 60;
      const groupEvents = penaltyEvents.filter((ev) => {
        const evTimeGroupRaw = ev.Time_Group ?? ev.extra_data?.Time_Group ?? ev.extra_data?.Time_Group?.label ?? null;
        if (evTimeGroupRaw) return mapAliasToGroup(evTimeGroupRaw) === group && isOpponent(ev);
        const s = getSeconds(ev);
        if (s === null) return false;
        return (group !== "+80'" ? (s >= rangeStart && s < rangeEnd) : s >= rangeStart) && isOpponent(ev);
      });
      return groupEvents.length;
    });

    function isOpponent(ev: any) {
      const team = (ev.TEAM ?? ev.EQUIPO ?? ev.extra_data?.EQUIPO ?? ev.extra_data?.TEAM ?? '').toString().trim();
      if (!team) return false;
      return !referenceOurTeams.includes(normalizeString(team).toLowerCase());
    }

    const data = {
      labels: timePeriods,
      datasets: [
        { label: 'Our Team', data: ourDataset, backgroundColor: 'rgba(75, 192, 192, 0.6)' },
        { label: 'Opponent', data: opponentDataset, backgroundColor: 'rgba(255, 99, 132, 0.6)' },
      ],
    };

    // eslint-disable-next-line no-console
    console.log('PenaltiesTimeChart - timePeriods:', timePeriods, 'ourDataset:', ourDataset, 'opponentDataset:', opponentDataset);

    setPenaltiesTimeChartData(data);
  }, [events, ourTeamsList]);

  const handleChartClick = (event: any, elements: any) => {
    if (!elements || elements.length === 0) return;
    const el = elements[0];
    const chart = el.element?.$context?.chart ?? (elements[0].element && elements[0].element.$context && elements[0].element.$context.chart);
    if (!chart) return;
    const dataIndex = el.index ?? el.element?.index ?? el.element?.$context?.dataIndex ?? el.element?.$context?.dataIndex;
    const label = chart.data.labels[dataIndex];
    if (onChartClick) onChartClick(event, elements, chart, 'time', 'penalties-tab', [{ descriptor: 'Time_Group', value: label }]);
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Penalties by Time Period' },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label;
            const value = context.raw;
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
    maintainAspectRatio: false,
    onClick: handleChartClick,
  };

  if (!penaltiesTimeChartData) return <div className="flex items-center justify-center h-64 text-gray-500">No hay datos de penales por tiempo disponibles</div>;

  return <Bar data={penaltiesTimeChartData} options={barChartOptions as any} />;
};

export default PenaltiesTimeChart;