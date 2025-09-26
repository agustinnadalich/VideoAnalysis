import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import TacklesBarChart from "./charts/TacklesBarChart";
import MissedTacklesBarChart from "./charts/MissedTacklesBarChart";
import TacklesByTeamChart from "./charts/TacklesByTeamChart";
import TacklesTimeChart from "./charts/TacklesTimeChart";
import AdvancePieChart from "./charts/AdvancePieChart";
import PlayerPointsChart from "./charts/PlayerPointsChart";
import PointsTimeChart from "./charts/PointsTimeChart";
import PointsTypeChart from "./charts/PointsTypeChart";
import TriesPlayerChart from "./charts/TriesPlayerChart";
import TriesTimeChart from "./charts/TriesTimeChart";
import TriesOriginChart from "./charts/TriesOriginChart";
import PenaltiesPlayerBarChart from "./charts/PenaltiesPlayerBarChart";
import PenaltiesTimeChart from "./charts/PenaltiesTimeChart";
import PenaltiesCausePieChart from "./charts/PenaltiesCausePieChart";
import TurnoversPlayerBarChart from "./charts/TurnoversPlayerBarChart";
import TurnoversTypePieChart from "./charts/TurnoversTypePieChart";
import TurnoversTimeChart from "./charts/TurnoversTimeChart";
import ScrumEffectivityChart from "./charts/ScrumEffectivityChart";
import LineoutEffectivityChart from "./charts/LineoutEffectivityChart";
// import TimelineChart from "./charts/TimelineChart";
// import ScatterChart from "./charts/ScatterChart";
// Aquí luego podrás importar los otros charts
import { useFilterContext } from "../context/FilterContext";
import { getTeamFromEvent, normalizeString, isOurTeam, computeTackleStatsAggregated, detectOurTeams } from "../utils/teamUtils";
import type { MatchEvent } from "@/types";


const ChartsTabs = (_props: any) => {
  const {
    events,
    filteredEvents,
    filterDescriptors,
    setFilterDescriptors,
    setFilteredEvents,
    matchInfo,
    ourTeamsList,
  } = useFilterContext() as {
    events: MatchEvent[];
    filteredEvents: MatchEvent[];
    filterDescriptors: any[];
    setFilterDescriptors: (filters: any[]) => void;
    setFilteredEvents: (events: any[]) => void;
    matchInfo?: any;
    ourTeamsList: string[];
  };

  // Funciones helper para determinar si los gráficos tienen datos para mostrar
  const hasTacklesBarChartData = (filteredEvts: MatchEvent[]) => {
    if (!filteredEvts || filteredEvts.length === 0) return false;

    // Determinar la lista de 'nuestros equipos' usando el contexto completo `events` (no el filtrado),
    // para evitar detectar equipos incorrectos cuando `filteredEvents` contiene solo rivales.
    const teamsToUse = (ourTeamsList && ourTeamsList.length > 0) ? ourTeamsList : detectOurTeams(events || []);
    if (!teamsToUse || teamsToUse.length === 0) return false;

    const normalizedOurTeams = teamsToUse
      .map(t => normalizeString(t).toLowerCase())
      .filter(t => t && !/^(unknown|desconocido|rival|opponent|our_team|opp|home|away|nuestro equipo|nuestro|equipo|team|oponente|rivales)$/i.test(t));
    if (normalizedOurTeams.length === 0) return false;

    // Comprobar si en los eventos filtrados hay al menos un TACKLE perteneciente a nuestros equipos
    const tackleCount = filteredEvts.filter((e) => (e.CATEGORY === 'TACKLE' || e.event_type === 'TACKLE')).length;
    const ourTackleCount = filteredEvts.filter((e) => {
      const isTackle = (e.CATEGORY === 'TACKLE' || e.event_type === 'TACKLE');
      if (!isTackle) return false;
      const team = getTeamFromEvent(e);
      if (!team) return false;
      return normalizedOurTeams.includes(normalizeString(team).toLowerCase());
    }).length;

    // DEBUG: imprimir estado resumido (ver consola del navegador, no logs del servidor)
    try {
      // eslint-disable-next-line no-console
      console.log('ChartsTabs.hasTacklesBarChartData:', { filteredEvents: filteredEvts.length, tackleCount, ourTackleCount, teamsToUse, normalizedOurTeams });
    } catch (err) {
      // ignore
    }

    return ourTackleCount > 0;
  };
  
  // DEBUG: imprimir resumen corto para ayudar a identificar por qué se muestra el chart
  // (se dejará ligero para no llenar logs en producción)
  // console.log('ChartsTabs - hasTacklesBarChartData - teamsToUse:', teamsToUse, 'normalized:', normalizedOurTeams);

  const hasMissedTacklesBarChartData = (events: MatchEvent[]) => {
    const missedTackleEvents = events.filter(
      (event) => event.event_type === "MISSED-TACKLE"
    );
    return missedTackleEvents.length > 0;
  };

  const hasTacklesByTeamChartData = (events: MatchEvent[]) => {
    const statsByTeam = computeTackleStatsAggregated(events, ourTeamsList);
    const ourStats = statsByTeam[0] || { successful: 0, missed: 0 };
    const oppStats = statsByTeam[1] || { successful: 0, missed: 0 };
    return (ourStats.successful + ourStats.missed + oppStats.successful + oppStats.missed) > 0;
  };

  const hasTacklesTimeChartData = (events: MatchEvent[]) => {
    const tackleEvents = events.filter(
      (event) => event.event_type === "TACKLE" || event.CATEGORY === "TACKLE" || event.event_type === "MISSED-TACKLE"
    );
    return tackleEvents.length > 0;
  };

  const hasAdvancePieChartData = (events: MatchEvent[]) => {
    const advanceEvents = events.filter(
      (event) => event.CATEGORY === "ADVANCE" || event.event_type === "ADVANCE"
    );
    const eventsWithAdvanceData = advanceEvents.filter(event => {
      const advance = event.extra_data?.AVANCE || event.extra_data?.ADVANCE || event.AVANCE || event.ADVANCE;
      return advance !== null && advance !== undefined && advance !== "";
    });
    return eventsWithAdvanceData.length > 0;
  };

  const hasTackleAdvanceData = (events: MatchEvent[]) => {
    const tackleEvents = events.filter(
      (event) => event.CATEGORY === "TACKLE" || event.event_type === "TACKLE"
    );
    const tacklesWithAdvanceData = tackleEvents.filter(event => {
      const advance = event.extra_data?.AVANCE || event.extra_data?.ADVANCE || event.AVANCE || event.ADVANCE;
      return advance !== null && advance !== undefined && advance !== "";
    });
    return tacklesWithAdvanceData.length > 0;
  };
  



  console.log("🔍 ChartsTabs - Total events:", filteredEvents?.length || 0);
  console.log("🔍 ChartsTabs - Tackle events:", filteredEvents?.filter(e => e.event_type === 'TACKLE').length || 0);

  // Quick booleans for presence of data in new tabs
  const hasPoints = (filteredEvents || []).some((event) => event.CATEGORY === "POINTS" || event.event_type === "POINTS");
  const hasTries = (filteredEvents || []).some((event) => (event.CATEGORY === "POINTS" || event.event_type === "POINTS") && (event.POINTS === "TRY" || event.POINTS === 'TRY'));
  const hasPenalties = (filteredEvents || []).some((event) => event.CATEGORY === "PENALTY" || event.event_type === "PENALTY");
  const hasTurnovers = (filteredEvents || []).some((event) => event.CATEGORY === "TURNOVER+" || event.CATEGORY === "TURNOVER-" || event.event_type === "TURNOVER+" || event.event_type === "TURNOVER-");
  const hasSetPieces = (filteredEvents || []).some((event) => event.CATEGORY === "SCRUM" || event.CATEGORY === "LINEOUT" || event.event_type === "SCRUM" || event.event_type === "LINEOUT");

  // Función para manejar clicks en gráficos y agregar filtros
  const handleChartClick = (...args: any[]) => {
    // Soportar varias firmas que usan los distintos charts:
    // 1) (chartType: string, value: string, descriptor: string)
    // 2) (event, elements, chart) -> firma nativa de Chart.js (react-chartjs-2)
    // 3) (event, elements, chart, chartType, tabId, additionalFilters)
    try {
      // Caso 1: firma simple (chartType, value, descriptor)
      if (args.length === 3 && typeof args[0] === 'string') {
        const [chartType, value, descriptor] = args;
        const newFilter = { descriptor, value };
        const existingIndex = filterDescriptors.findIndex(f => f.descriptor === descriptor && f.value === value);
        if (existingIndex >= 0) {
          setFilterDescriptors(filterDescriptors.filter((_, i) => i !== existingIndex));
          console.log('🔄 Filtro removido:', newFilter);
        } else {
          setFilterDescriptors([...filterDescriptors, newFilter]);
          console.log('➕ Filtro agregado:', newFilter);
        }
        return;
      }

      // Caso 2a: firma Chart.js (event, elements) - algunos wrappers pasan sólo 2 args
      if (args.length === 2) {
        const [event, elements] = args;
        const chart = undefined;
        if (!elements || elements.length === 0) return;
        const el = elements[0];
        const datasetIndex = el.datasetIndex ?? el.dataset?.datasetIndex ?? el.element?.$context?.datasetIndex ?? el.element?.datasetIndex;
        const dataIndex = el.index ?? el.element?.index ?? el.element?.$context?.dataIndex ?? el.element?.$context?.dataIndex;

        // Normalizar team usando matchInfo cuando sea posible
        let team = dataIndex === 0 ? 'OUR_TEAM' : 'OPPONENT';
        if (matchInfo) {
          const ourName = matchInfo.TEAM || matchInfo.team || matchInfo.home || matchInfo.team_name || null;
          const oppName = matchInfo.OPPONENT || matchInfo.opponent || matchInfo.away || matchInfo.opponent_name || null;
          if (team === 'OUR_TEAM' && ourName) team = ourName;
          if (team === 'OPPONENT' && oppName) team = oppName;
        }
        const tackleType = datasetIndex === 0 ? 'TACKLE' : 'MISSED-TACKLE';

        const hasEventType = filterDescriptors.some(f => f.descriptor === 'event_type' && f.value === tackleType);
        const hasTeam = filterDescriptors.some(f => f.descriptor === 'TEAM' && f.value === team);

        if (hasEventType && hasTeam) {
          const updated = filterDescriptors.filter(f => !( (f.descriptor === 'event_type' && f.value === tackleType) || (f.descriptor === 'TEAM' && f.value === team) ));
          setFilterDescriptors(updated);
          console.log('🔄 Filtros removidos:', [{ descriptor: 'event_type', value: tackleType }, { descriptor: 'TEAM', value: team }]);
        } else {
          const updated = [...filterDescriptors, { descriptor: 'event_type', value: tackleType }, { descriptor: 'TEAM', value: team }];
          setFilterDescriptors(updated);
          console.log('➕ Filtros agregados:', [{ descriptor: 'event_type', value: tackleType }, { descriptor: 'TEAM', value: team }]);
        }
        return;
      }

      // Caso 2b: firma Chart.js (event, elements, chart) - asumir cualquier llamada con 3 args
      if (args.length === 3) {
        const [event, elements, chart] = args;
        if (!elements || elements.length === 0) return;
        const el = elements[0];
        // Elemento puede venir en distintas formas; intentar normalizar
        const datasetIndex = el.datasetIndex ?? el.dataset?.datasetIndex ?? el.element?.$context?.datasetIndex ?? el.element?.datasetIndex;
        const dataIndex = el.index ?? el.element?.index ?? el.element?.$context?.dataIndex ?? el.element?.$context?.dataIndex;

        // Normalizar team usando matchInfo cuando sea posible
        let team = dataIndex === 0 ? 'OUR_TEAM' : 'OPPONENT';
        if (matchInfo) {
          const ourName = matchInfo.TEAM || matchInfo.team || matchInfo.home || matchInfo.team_name || null;
          const oppName = matchInfo.OPPONENT || matchInfo.opponent || matchInfo.away || matchInfo.opponent_name || null;
          if (team === 'OUR_TEAM' && ourName) team = ourName;
          if (team === 'OPPONENT' && oppName) team = oppName;
        }
        const tackleType = datasetIndex === 0 ? 'TACKLE' : 'MISSED-TACKLE';

        // Toggle: si ambos filtros existen, los removemos; si no, los agregamos
        const hasEventType = filterDescriptors.some(f => f.descriptor === 'event_type' && f.value === tackleType);
        const hasTeam = filterDescriptors.some(f => f.descriptor === 'TEAM' && f.value === team);

        if (hasEventType && hasTeam) {
          const updated = filterDescriptors.filter(f => !( (f.descriptor === 'event_type' && f.value === tackleType) || (f.descriptor === 'TEAM' && f.value === team) ));
          setFilterDescriptors(updated);
          console.log('🔄 Filtros removidos:', [{ descriptor: 'event_type', value: tackleType }, { descriptor: 'TEAM', value: team }]);
        } else {
          const updated = [...filterDescriptors, { descriptor: 'event_type', value: tackleType }, { descriptor: 'TEAM', value: team }];
          setFilterDescriptors(updated);
          console.log('➕ Filtros agregados:', [{ descriptor: 'event_type', value: tackleType }, { descriptor: 'TEAM', value: team }]);
        }
        return;
      }

      // Caso 3: firma extendida (event, elements, chart, chartType, tabId, additionalFilters)
      // Algunos charts pasan 4 o 5 argumentos: (event, elements, chart, chartType, tabId)
      if (args.length >= 4 && typeof args[3] === 'string') {
        const [event, elements, chart, chartType, tabId, additionalFilters] = args;

        // Si el chart ya nos pasó filtros adicionales, respetarlos (ej. PointsTypeChart)
        if (additionalFilters && additionalFilters.length > 0) {
          const filter = additionalFilters[0];
          let descriptor = filter.descriptor;
          const value = filter.value;
          // Normalizar alias: algunos charts emiten Quarter_Group, unificar a Time_Group
          if (descriptor === 'Quarter_Group') descriptor = 'Time_Group';
          const existingIndex = filterDescriptors.findIndex(f => f.descriptor === descriptor && f.value === value);
          if (existingIndex >= 0) {
            setFilterDescriptors(filterDescriptors.filter((_, i) => i !== existingIndex));
            console.log('🔄 Filtro removido:', { descriptor, value });
          } else {
            setFilterDescriptors([...filterDescriptors, { descriptor, value }]);
            console.log('➕ Filtro agregado:', { descriptor, value });
          }
          return;
        }

        // Si no hay filtros adicionales, intentar inferir el valor desde `elements` + `chart`
        if (elements && elements.length > 0 && chart && chart.data && Array.isArray(chart.data.labels)) {
          try {
            const el = elements[0];
            const dataIndex = el.index ?? el.element?.index ?? el.element?.$context?.dataIndex ?? el.element?.$context?.dataIndex;
            const label = chart.data.labels[dataIndex];

            // Mapear chartType a descriptor conocido
            let descriptor = 'JUGADOR';
            if (chartType === 'time' || chartType === 'time-group') descriptor = 'Time_Group';
            else if (chartType === 'player') descriptor = 'JUGADOR';
            else descriptor = String(chartType).toUpperCase();

            const value = label;
            const existingIndex = filterDescriptors.findIndex(f => f.descriptor === descriptor && f.value === value);
            if (existingIndex >= 0) {
              setFilterDescriptors(filterDescriptors.filter((_, i) => i !== existingIndex));
              console.log('🔄 Filtro removido:', { descriptor, value });
            } else {
              setFilterDescriptors([...filterDescriptors, { descriptor, value }]);
              console.log('➕ Filtro agregado:', { descriptor, value });
            }
          } catch (err) {
            console.warn('handleChartClick: error extrayendo label desde chart/elements', err);
          }
        } else {
          console.warn('No additional filters provided in chart click and unable to infer value from elements/chart');
        }
        return;
      }

      console.warn('Unexpected handleChartClick arguments:', args);
    } catch (err) {
      console.error('Error procesando handleChartClick:', err);
    }
  };

  // Aplicar filtros cuando cambien
  useEffect(() => {
    console.log("🔄 Aplicando filtros - Current filterDescriptors:", filterDescriptors);
    console.log("🔄 Total events before filtering:", events.length);

    if (!events || events.length === 0) return;

    if (filterDescriptors.length === 0) {
      console.log("🔄 No filters, showing all events");
      // Evitar setState innecesario
      if (!Array.isArray(filteredEvents) || filteredEvents.length !== events.length || filteredEvents[0]?.id !== events[0]?.id || filteredEvents[filteredEvents.length - 1]?.id !== events[events.length - 1]?.id) {
        setFilteredEvents(events);
      }
      return;
    }

    // Aplicar todos los filtros
    const filtered = events.filter((event) => {
      return filterDescriptors.every((filter) => {
        const { descriptor, value } = filter;
        
        // Filtrado especial para grupos de tiempo
        if (descriptor === "Quarter_Group" || descriptor === 'Time_Group' || descriptor === 'Time-Group' || descriptor === 'time_group') {
          // Normalizar valor esperado (p. ej. "0'- 20'" vs "0'-20'") y mapear alias (Primer cuarto, Q1, etc.)
          const normalizeGroupLabel = (s: string) => String(s || '').replace(/\s+/g, ' ').replace(/\s?-\s?/, ' - ').trim();

          const mapAliasToGroup = (raw: string) => {
            if (raw === null || raw === undefined) return '';
            const s = String(raw).toLowerCase().trim();
            // Spanish quarters
            if (s.includes('primer') || s.includes('1º') || s === 'q1' || s === '1q' || s.match(/^q\s*1/i)) return "0'- 20'";
            if (s.includes('segundo') || s.includes('2º') || s === 'q2' || s === '2q' || s.match(/^q\s*2/i)) return "20' - 40'";
            if (s.includes('tercer') || s.includes('terc') || s.includes('3º') || s === 'q3' || s === '3q' || s.match(/^q\s*3/i)) return "40' - 60'";
            if (s.includes('cuarto') || s.includes('4º') || s === 'q4' || s === '4q' || s.match(/^q\s*4/i)) return "60' - 80'";
            // English style
            if (s.includes('first') || s.includes('1st') || s.includes('q1')) return "0'- 20'";
            if (s.includes('second') || s.includes('2nd') || s.includes('q2')) return "20' - 40'";
            if (s.includes('third') || s.includes('3rd') || s.includes('q3')) return "40' - 60'";
            if (s.includes('fourth') || s.includes('4th') || s.includes('q4')) return "60' - 80'";
            // If it already looks like a minute-range label, normalize and return
            const normalized = normalizeGroupLabel(raw);
            if (/(\d+)'\s?-\s?\d+/.test(normalized) || normalized.includes("'") ) return normalized;
            return normalized;
          };

          const expectedValue = normalizeGroupLabel(mapAliasToGroup(value));

          const timeInSeconds = Number(event.timestamp_sec ?? event.Game_Time ?? event.time ?? event.seconds ?? 0) || 0;
          let eventQuarterGroup: string;

          if (timeInSeconds < 1200) eventQuarterGroup = "0'- 20'";      // 0-20 minutos
          else if (timeInSeconds < 2400) eventQuarterGroup = "20' - 40'";    // 20-40 minutos
          else if (timeInSeconds < 3600) eventQuarterGroup = "40' - 60'";    // 40-60 minutos
          else eventQuarterGroup = "60' - 80'";                        // 60+ minutos

          const calculated = normalizeGroupLabel(eventQuarterGroup);
          console.log("🔍 Checking event", event.id, "for Time_Group =", value, "-> time:", timeInSeconds, "-> calculated:", eventQuarterGroup, "(norm->", calculated, ") expected->", expectedValue);
          return calculated === expectedValue;
        }
        
        // Filtrado especial para equipos (soporta categorías agregadas)
        if (descriptor === 'TEAM') {
          const eventTeam = getTeamFromEvent(event);
          
          // Normalizar el valor del filtro para aceptar diferentes variaciones
          const normalizedValue = value.toUpperCase().trim();
          
          if (normalizedValue === 'OUR_TEAM' || normalizedValue === 'OUR_TEAMS') {
            // Filtrar eventos de nuestros equipos
            const matches = isOurTeam(eventTeam || '', ourTeamsList);
            console.log("🔍 TEAM=OUR_TEAM/OUR_TEAMS check:", eventTeam, "in", ourTeamsList, "->", matches);
            return matches;
          } else if (normalizedValue === 'OPPONENTS' || normalizedValue === 'RIVAL' || normalizedValue === 'RIVALES') {
            // Filtrar eventos de rivales
            const matches = !isOurTeam(eventTeam || '', ourTeamsList);
            console.log("🔍 TEAM=OPPONENTS/RIVAL/RIVALES check:", eventTeam, "not in", ourTeamsList, "->", matches);
            return matches;
          } else {
            // Filtrado por nombre específico de equipo
            const normalizedEventTeam = normalizeString(eventTeam);
            const normalizedSearchValue = normalizeString(value);
            const matches = normalizedEventTeam === normalizedSearchValue;
            console.log("🔍 TEAM specific check:", normalizedEventTeam, "===", normalizedSearchValue, "->", matches);
            return matches;
          }
        }
        
        // Filtrado especial para avances (manejar tanto ADVANCE como AVANCE y advance_type)
        if (descriptor === 'ADVANCE' || descriptor === 'AVANCE') {
          // Soportar múltiples ubicaciones y variantes donde puede aparecer el dato de avance
          const eventAdvance =
            event.extra_data?.descriptors?.AVANCE ||
            event.extra_data?.AVANCE ||
            event.extra_data?.advance ||
            event.extra_data?.advance_type ||
            event.advance ||
            event.ADVANCE ||
            event.AVANCE ||
            null;

          let matches = false;
          if (Array.isArray(eventAdvance)) {
            matches = eventAdvance.includes(value);
          } else {
            matches = eventAdvance === value;
          }

          console.log("🔍 ADVANCE/AVANCE check:", descriptor, "=", eventAdvance, "===", value, "->", matches);
          return matches;
        }
        
        // Filtrado general por otros campos
        // Buscar en event[field] o event.extra_data[field] con varias normalizaciones
        const lookupKeys = [
          descriptor,
          descriptor.toString().toUpperCase(),
          descriptor.toString().toLowerCase(),
          descriptor.toString().replace(/[- ]/g, '_'),
          descriptor.toString().replace(/[- ]/g, ''),
        ];

        let eventValue: any = undefined;
        for (const key of lookupKeys) {
          if (event.hasOwnProperty(key) && event[key] !== undefined) { eventValue = event[key]; break; }
          if (event.extra_data && Object.prototype.hasOwnProperty.call(event.extra_data, key) && event.extra_data[key] !== undefined) { eventValue = event.extra_data[key]; break; }
        }

        // Si eventValue es un array, comprobar si incluye el valor
        let matches = false;
        if (Array.isArray(eventValue)) matches = eventValue.includes(value);
        else matches = String(eventValue) === String(value);

        console.log("🔍 General filter check:", descriptor, "=", eventValue, "===" , value, "->", matches);
        return matches;
      });
    });

    console.log("🔄 Filtered result:", filtered.length, "events from", events.length);
    console.log("🔄 Active filters:", filterDescriptors.map(f => `${f.descriptor}=${f.value}`));
    // Evitar setState innecesario comparando primer/último evento y longitud
    if (!Array.isArray(filteredEvents) || filteredEvents.length !== filtered.length || filteredEvents[0]?.id !== filtered[0]?.id || filteredEvents[filteredEvents.length - 1]?.id !== filtered[filtered.length - 1]?.id) {
      setFilteredEvents(filtered);
    }
  }, [events, filterDescriptors, setFilteredEvents, ourTeamsList]);

  // Mostrar mensaje de carga si no hay eventos
  if (!filteredEvents || filteredEvents.length === 0) {
    return (
      <div className="w-full mt-4 p-4 border rounded">
        <p className="text-gray-500">Cargando eventos...</p>
        <p className="text-sm text-gray-400">Eventos encontrados: {filteredEvents?.length || 0}</p>
      </div>
    );
  }

  // Debug info moved out of JSX
  try {
    // eslint-disable-next-line no-console
    console.log('ChartsTabs - Points tab - hasPoints=', hasPoints, 'points events=', filteredEvents.filter(e => e.CATEGORY === 'POINTS' || e.event_type === 'POINTS').length);
  } catch (err) {}

  return (
    <Tabs defaultValue="overview" className="w-full mt-4">
      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <TabsList style={{ display: 'inline-flex', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
          <TabsTrigger style={{ display: 'inline-flex', flex: '0 0 auto', minWidth: 110 }} value="overview">Resumen</TabsTrigger>
          <TabsTrigger style={{ display: 'inline-flex', flex: '0 0 auto', minWidth: 110 }} value="tackles">Tackles</TabsTrigger>
          <TabsTrigger style={{ display: 'inline-flex', flex: '0 0 auto', minWidth: 110 }} value="points" disabled={!hasPoints}>Points</TabsTrigger>
          <TabsTrigger style={{ display: 'inline-flex', flex: '0 0 auto', minWidth: 110 }} value="tries" disabled={!hasTries}>Tries</TabsTrigger>
          <TabsTrigger style={{ display: 'inline-flex', flex: '0 0 auto', minWidth: 110 }} value="penalties" disabled={!hasPenalties}>Penalties</TabsTrigger>
          <TabsTrigger style={{ display: 'inline-flex', flex: '0 0 auto', minWidth: 110 }} value="turnovers" disabled={!hasTurnovers}>Turnovers</TabsTrigger>
          <TabsTrigger style={{ display: 'inline-flex', flex: '0 0 auto', minWidth: 110 }} value="setpieces" disabled={!hasSetPieces}>Set Pieces</TabsTrigger>
          <TabsTrigger style={{ display: 'inline-flex', flex: '0 0 auto', minWidth: 110 }} value="advances">Avances</TabsTrigger>
          <TabsTrigger style={{ display: 'inline-flex', flex: '0 0 auto', minWidth: 110 }} value="scatter">Mapa</TabsTrigger>
          {/* Agrega más pestañas según los charts */}
        </TabsList>
      </div>
      
      {/* Indicador de filtros activos */}
      {filterDescriptors.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-800">Filtros activos:</span>
              <div className="flex gap-2">
                {filterDescriptors.map((filter, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {filter.descriptor}: {filter.value}
                    <button
                      onClick={() => {
                        const updatedFilters = filterDescriptors.filter((_, i) => i !== index);
                        setFilterDescriptors(updatedFilters);
                      }}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setFilterDescriptors([])}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Limpiar todos
            </button>
          </div>
        </div>
      )}
      

      <TabsContent value="overview">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Resumen del partido</h3>
          <p>Eventos totales: {filteredEvents.length}</p>
          <p>Debug: {JSON.stringify(filteredEvents.slice(0, 2), null, 2)}</p>
        </div>
      </TabsContent>

      <TabsContent value="tackles">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Estadísticas de Tackles</h3>
          
          {/* Grid de gráficos - todos los gráficos de tackles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tackles por jugador (Nuestro equipo - barras apiladas por avance) - solo mostrar si hay datos */}
            {hasTacklesBarChartData(filteredEvents) && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Tackles por Jugador</h4>
                <TacklesBarChart 
                  events={filteredEvents} 
                  onBarClick={(category, player) => {
                    console.log("Clicked on player:", player);
                    handleChartClick("player", player, "JUGADOR");
                  }}
                />
              </div>
            )}

            {/* Distribución de Avances en Tackles - solo mostrar si hay datos */}
            {hasTackleAdvanceData(filteredEvents) && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Distribución de Avances en Tackles</h4>
                <AdvancePieChart 
                  events={filteredEvents} 
                  category="TACKLE" 
                  onChartClick={(event, elements, chart, chartType, tabId, additionalFilters) => {
                    console.log("Advance pie clicked:", chartType, additionalFilters);
                    console.log("Additional filters details:", additionalFilters?.[0]);
                    if (additionalFilters && additionalFilters.length > 0) {
                      const advanceFilter = additionalFilters.find(f => f.descriptor === "ADVANCE");
                      if (advanceFilter) {
                        console.log("Found advance filter:", advanceFilter);
                        handleChartClick("advance", advanceFilter.value, "AVANCE"); // Usar AVANCE en español
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* Tackles por tiempo de juego - solo mostrar si hay datos */}
            {hasTacklesTimeChartData(filteredEvents) && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Tackles por Tiempo de Juego</h4>
                <div className="h-80">
                  <TacklesTimeChart 
                    events={filteredEvents} 
                    onChartClick={(chartType, value, descriptor) => {
                      handleChartClick(chartType, value, descriptor);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Tackles errados - solo mostrar si hay datos */}
            {hasMissedTacklesBarChartData(filteredEvents) && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Tackles Errados</h4>
                <div className="h-80">
                  <MissedTacklesBarChart 
                    events={filteredEvents} 
                    onChartClick={(chartType, value, descriptor) => {
                      handleChartClick(chartType, value, descriptor);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Comparación por equipos - solo mostrar si hay datos */}
            {hasTacklesByTeamChartData(filteredEvents) && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Tackles por Equipo - Efectividad</h4>
                <div className="h-80">
                  <TacklesByTeamChart 
                    events={filteredEvents} 
                    onChartClick={(chartType, value, descriptor) => {
                      handleChartClick(chartType, value, descriptor);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mensaje cuando no hay gráficos disponibles */}
          {!hasTacklesBarChartData(filteredEvents) && 
           !hasTackleAdvanceData(filteredEvents) && 
           !hasTacklesTimeChartData(filteredEvents) && 
           !hasMissedTacklesBarChartData(filteredEvents) && 
           !hasTacklesByTeamChartData(filteredEvents) && (
            <div className="text-center py-8 text-gray-500">
              No hay datos de tackles disponibles para mostrar
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="advances">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Distribución de Avances</h3>
          {hasAdvancePieChartData(filteredEvents) ? (
            <AdvancePieChart events={filteredEvents} category="ADVANCE" />
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay datos de avances disponibles para mostrar
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="points">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Points</h3>
          {hasPoints ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/** Debug info: print counts to console to help identify missing data */}
            {/* moved console.log out of JSX to avoid TSX expression type issues */}
              <div className="border rounded-lg p-4 h-80">
                <h4 className="font-medium mb-2">Puntos por Jugador</h4>
                <PlayerPointsChart events={filteredEvents.filter(e => e.CATEGORY === 'POINTS' || e.event_type === 'POINTS')} onChartClick={(...args:any)=>{handleChartClick(...args);}} />
              </div>
              <div className="border rounded-lg p-4 h-80">
                <h4 className="font-medium mb-2">Puntos por Tiempo</h4>
                <PointsTimeChart events={filteredEvents.filter(e => e.CATEGORY === 'POINTS' || e.event_type === 'POINTS')} onChartClick={(...args:any)=>{handleChartClick(...args);}} />
              </div>
              <div className="border rounded-lg p-4 h-80">
                <h4 className="font-medium mb-2">Tipo de Puntos</h4>
                <PointsTypeChart events={filteredEvents.filter(e => e.CATEGORY === 'POINTS' || e.event_type === 'POINTS')} onChartClick={(...args:any)=>{handleChartClick(...args);}} />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No hay datos de Points para mostrar</div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="tries">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tries</h3>
          {hasTries ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TriesPlayerChart events={filteredEvents.filter(e => (e.CATEGORY === 'POINTS' || e.event_type === 'POINTS') && e.POINTS === 'TRY')} onChartClick={(...args:any)=>{handleChartClick(...args);}} />
              <TriesTimeChart events={filteredEvents.filter(e => (e.CATEGORY === 'POINTS' || e.event_type === 'POINTS') && e.POINTS === 'TRY')} onChartClick={(...args:any)=>{handleChartClick(...args);}} />
              <TriesOriginChart events={filteredEvents.filter(e => (e.CATEGORY === 'POINTS' || e.event_type === 'POINTS') && e.POINTS === 'TRY')} onChartClick={(...args:any)=>{handleChartClick(...args);}} />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No hay datos de Tries para mostrar</div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="penalties">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Penalties</h3>
          {hasPenalties ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PenaltiesPlayerBarChart events={filteredEvents.filter(e => e.CATEGORY === 'PENALTY' || e.event_type === 'PENALTY')} onChartClick={(...args:any)=>{handleChartClick(...args);}} />
              <PenaltiesTimeChart events={filteredEvents.filter(e => e.CATEGORY === 'PENALTY' || e.event_type === 'PENALTY')} onChartClick={(...args:any)=>{handleChartClick(...args);}} />
              <PenaltiesCausePieChart events={filteredEvents.filter(e => e.CATEGORY === 'PENALTY' || e.event_type === 'PENALTY')} onChartClick={(...args:any)=>{handleChartClick(...args);}} />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No hay datos de Penalties para mostrar</div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="turnovers">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Turnovers</h3>
          {hasTurnovers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TurnoversPlayerBarChart events={filteredEvents.filter(e => e.CATEGORY === 'TURNOVER+' || e.CATEGORY === 'TURNOVER-' || e.event_type === 'TURNOVER+' || e.event_type === 'TURNOVER-')} onChartClick={(...args:any)=>{handleChartClick(...args);}} />
              <TurnoversTypePieChart events={filteredEvents.filter(e => e.CATEGORY === 'TURNOVER+' || e.CATEGORY === 'TURNOVER-' || e.event_type === 'TURNOVER+' || e.event_type === 'TURNOVER-')} onChartClick={(...args:any)=>{handleChartClick(...args);}} />
              <TurnoversTimeChart events={filteredEvents.filter(e => e.CATEGORY === 'TURNOVER+' || e.CATEGORY === 'TURNOVER-' || e.event_type === 'TURNOVER+' || e.event_type === 'TURNOVER-')} onChartClick={(...args:any)=>{handleChartClick(...args);}} />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No hay datos de Turnovers para mostrar</div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="setpieces">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Set Pieces</h3>
          {hasSetPieces ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.some(e => e.CATEGORY === 'SCRUM' || e.event_type === 'SCRUM') && (
                <ScrumEffectivityChart title="Scrum Effectivity" events={filteredEvents.filter(e => e.CATEGORY === 'SCRUM' || e.event_type === 'SCRUM')} onChartClick={(...args:any)=>{handleChartClick(...args);}} />
              )}
              {filteredEvents.some(e => e.CATEGORY === 'LINEOUT' || e.event_type === 'LINEOUT') && (
                <LineoutEffectivityChart title="Lineout Effectivity" events={filteredEvents.filter(e => e.CATEGORY === 'LINEOUT' || e.event_type === 'LINEOUT')} onChartClick={(...args:any)=>{handleChartClick(...args);}} />
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No hay datos de Set Pieces para mostrar</div>
          )}
        </div>
      </TabsContent>


      <TabsContent value="scatter">
        {/* <ScatterChart
          events={filteredEvents}
          columnsToTooltip={columnsToTooltip}
          colors={colors}
          selectedEvents={[]}
          setSelectedEvents={() => {}}
          onEventClick={onEventClick}
          width={800}
          height={600}
        /> */}
      </TabsContent>
    </Tabs>
  );
};

export default ChartsTabs;
