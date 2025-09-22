// Utilities to normalize and extract team information from events
export function getTeamFromEvent(ev: any): string | undefined {
  if (!ev) return undefined;
  const tryFields = [
    'TEAM', 'team', 'Team',
    'OPPONENT', 'opponent', 'Opponent',
    'team_name', 'opponent_name', 'home', 'away', 'teamName'
  ];

  for (const f of tryFields) {
    const v = ev[f];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }

  // También revisar extra_data si existe
  if (ev.extra_data && typeof ev.extra_data === 'object') {
    for (const f of tryFields) {
      const v = ev.extra_data[f];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
  }

  return undefined;
}

export function normalizeString(s?: any): string {
  if (s === undefined || s === null) return '';
  return String(s).trim();
}

export function getTeamNamesFromEvents(events: any[]): string[] {
  const set = new Set<string>();
  (events || []).forEach(ev => {
    const t = getTeamFromEvent(ev);
    if (t) set.add(normalizeString(t));
  });
  const arr = Array.from(set);
  if (arr.length >= 2) return arr.slice(0, 2);
  if (arr.length === 1) return [arr[0], 'OPPONENT'];
  return ['Nuestro Equipo', 'Rival'];
}

export function detectOurTeams(events: any[]): string[] {
  // Heurística: detectar equipos "propios" basándose en:
  // 1. Más eventos de tipo ofensivo/táctico
  // 2. Más tackles exitosos
  // 3. Más eventos en general (asumiendo más actividad propia)
  
  const teamStats = new Map<string, { total: number, tackles: number, successful: number }>();
  
  (events || []).forEach(ev => {
    const team = getTeamFromEvent(ev);
    if (!team) return;
    
    if (!teamStats.has(team)) {
      teamStats.set(team, { total: 0, tackles: 0, successful: 0 });
    }
    
    const stats = teamStats.get(team)!;
    stats.total++;
    
    // Contar tackles
    if (ev.event_type === 'TACKLE' || ev.CATEGORY === 'TACKLE') {
      stats.tackles++;
      if (ev.event_type === 'TACKLE' || ev.CATEGORY === 'TACKLE') {
        stats.successful++;
      }
    }
  });
  
  // Ordenar por actividad total (más eventos = más probable que sea equipo propio)
  const sortedTeams = Array.from(teamStats.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([team]) => team);
  
  // Retornar el equipo más activo como "nuestro equipo"
  return sortedTeams.length > 0 ? [sortedTeams[0]] : [];
}

export function isOurTeam(teamName: string, ourTeamsList: string[]): boolean {
  return ourTeamsList.some(ourTeam => 
    normalizeString(teamName) === normalizeString(ourTeam)
  );
}

export function computeTackleStatsAggregated(events: any[], ourTeamsList: string[]) {
  const tackleEvents = (events || []).filter((event: any) =>
    (event.event_type && (event.event_type === 'TACKLE' || event.event_type === 'MISSED-TACKLE')) ||
    (event.CATEGORY && event.CATEGORY === 'TACKLE')
  );

  // Stats agregados de todos nuestros equipos
  const ourEventsAggregated = tackleEvents.filter(ev => 
    isOurTeam(getTeamFromEvent(ev) || '', ourTeamsList)
  );
  
  // Stats agregados de todos los rivales
  const opponentEventsAggregated = tackleEvents.filter(ev => 
    !isOurTeam(getTeamFromEvent(ev) || '', ourTeamsList)
  );
  
  const ourStats = computeStatsFromEvents(ourEventsAggregated);
  const oppStats = computeStatsFromEvents(opponentEventsAggregated);
  
  return [
    {
      teamName: 'Nuestros Equipos',
      category: 'OUR_TEAMS',
      ...ourStats
    },
    {
      teamName: 'Rivales',
      category: 'OPPONENTS', 
      ...oppStats
    }
  ];
}

function computeStatsFromEvents(events: any[]) {
  const successful = events.filter((ev: any) => 
    (ev.event_type === 'TACKLE' || ev.CATEGORY === 'TACKLE')
  ).length;
  
  const missed = events.filter((ev: any) => 
    ev.event_type === 'MISSED-TACKLE'
  ).length;
  
  const total = successful + missed;
  const effectiveness = total > 0 ? Math.round((successful / total) * 100) : 0;
  
  return { successful, missed, total, effectiveness };
}

export function computeTackleStats(events: any[], teams: string[]) {
  const tackleEvents = (events || []).filter((event: any) =>
    (event.event_type && (event.event_type === 'TACKLE' || event.event_type === 'MISSED-TACKLE')) ||
    (event.CATEGORY && event.CATEGORY === 'TACKLE')
  );

  return teams.map(teamName => {
    const eventsForTeam = tackleEvents.filter((ev: any) => normalizeString(getTeamFromEvent(ev) || '') === normalizeString(teamName || ''));
    const successful = eventsForTeam.filter((ev: any) => (ev.event_type === 'TACKLE' || ev.CATEGORY === 'TACKLE')).length;
    const missed = eventsForTeam.filter((ev: any) => ev.event_type === 'MISSED-TACKLE').length;
    const total = successful + missed;
    const effectiveness = total > 0 ? Math.round((successful / total) * 100) : 0;
    return { teamName, successful, missed, total, effectiveness };
  });
}

export function resolveTeamLabel(label: string, matchInfo?: any) {
  if (!label) return label;
  const l = normalizeString(label);
  if (l === 'OUR_TEAM' && matchInfo) return matchInfo.TEAM || matchInfo.team || matchInfo.home || matchInfo.team_name || l;
  if (l === 'OPPONENT' && matchInfo) return matchInfo.OPPONENT || matchInfo.opponent || matchInfo.away || matchInfo.opponent_name || l;
  return l;
}
