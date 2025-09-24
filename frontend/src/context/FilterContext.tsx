import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { detectOurTeams } from "../utils/teamUtils";

export interface FilterContextType {
  matchInfo: any;
  setMatchInfo: (info: any) => void;
  events: any[];
  setEvents: (events: any[]) => void;
  filteredEvents: any[];
  setFilteredEvents: (events: any[]) => void;
  filterDescriptors: any[];
  setFilterDescriptors: (filters: any[]) => void;
  filterCategory: any[];
  setFilterCategory: (categories: any[]) => void;
  selectedTeam: string | null;
  setSelectedTeam: (team: string | null) => void;
  ourTeamsList: string[];
  setOurTeamsList: (teams: string[]) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({
  children,
  initialResponse
}: {
  children: React.ReactNode;
  initialResponse?: any;
}) => {
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [events, setEventsState] = useState<any[]>([]);
  const [filteredEventsState, setFilteredEventsState] = useState<any[]>([]);
  const [filterDescriptors, setFilterDescriptors] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [ourTeamsList, setOurTeamsList] = useState<string[]>([]);

  // Inicializar con datos si existen
  useEffect(() => {
    // If initialResponse is omitted (undefined) that's valid: initialize to empty arrays silently.
    if (initialResponse === undefined) {
      setEventsState([]);
      setFilteredEventsState([]);
      return;
    }

    if (!initialResponse || !Array.isArray(initialResponse.events)) {
      // Only report an error when an explicitly provided initialResponse is malformed.
      console.error("❌ FilterProvider - initialResponse es inválido o no contiene un array de eventos:", initialResponse);
      setEventsState([]);
      setFilteredEventsState([]);
      return;
    }

    console.log("🔄 FilterProvider - Inicializando con:", initialResponse.events.length, "eventos");
    console.log("🔄 FilterProvider - Primer evento:", initialResponse.events[0]);
    setEventsState(initialResponse.events);
    const sortedEvents = [...initialResponse.events].sort((a, b) => (a.timestamp_sec ?? 0) - (b.timestamp_sec ?? 0));
    setFilteredEventsState(sortedEvents);
  }, [initialResponse]);

  // Detectar equipos propios automáticamente cuando hay eventos
  useEffect(() => {
    if (events.length > 0 && ourTeamsList.length === 0) {
      const detected = detectOurTeams(events);
      console.log("🔄 FilterProvider - Equipos propios detectados:", detected);
      setOurTeamsList(detected);
    }
  }, [events, ourTeamsList.length]);

  // Función para establecer eventos sin crear bucles
  const arraysEqual = (a: any[], b: any[]) => {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const ai = a[i];
      const bi = b[i];
      // Comparar por id cuando exista, si no por timestamp+event_type
      if (ai && bi && ai.id !== undefined && bi.id !== undefined) {
        if (ai.id !== bi.id) return false;
      } else {
        if ((ai.timestamp_sec ?? 0) !== (bi.timestamp_sec ?? 0)) return false;
        if ((ai.event_type ?? '') !== (bi.event_type ?? '')) return false;
      }
    }
    return true;
  };

  const setEventsAndFilter = useCallback((newEvents: any[]) => {
    console.log("🔄 setEventsAndFilter llamado con:", newEvents.length, "eventos");
    const sortedEvents = [...newEvents].sort((a, b) => (a.timestamp_sec ?? 0) - (b.timestamp_sec ?? 0));
    // Ejecutar las actualizaciones fuera del ciclo de commit para evitar bucles
    // causados por librerías que notifiquen suscripciones sincrónicamente (p.ej. Recharts).
    requestAnimationFrame(() => {
      // Actualizar events si cambiaron
      setEventsState(prev => {
        if (arraysEqual(prev, newEvents)) return prev;
        return newEvents;
      });

      // Actualizar filteredEvents si cambiaron (compare con estado actual)
      setFilteredEventsState(prev => {
        if (arraysEqual(prev, sortedEvents)) return prev;
        return sortedEvents;
      });
    });
  }, []);

  // Ordenar los eventos antes de establecerlos en el estado
  const setFilteredEvents = useCallback((events: any[]) => {
    console.log("🔄 setFilteredEvents llamado con:", events.length, "eventos");
    const sortedEvents = [...events].sort((a, b) => (a.timestamp_sec ?? 0) - (b.timestamp_sec ?? 0));
    // Deferir la actualización para romper cualquier bucle sincrónico
    requestAnimationFrame(() => {
      setFilteredEventsState(prev => {
        if (arraysEqual(prev, sortedEvents)) return prev;
        return sortedEvents;
      });
    });
  }, []);

  // Wrap setFilterDescriptors to call state setter asynchronously as well
  const setFilterDescriptorsAsync = useCallback((filters: any[]) => {
    // Usamos raf para ejecutar después del commit
    requestAnimationFrame(() => {
      setFilterDescriptors(filters);
    });
  }, [setFilterDescriptors]);

  const value: FilterContextType = {
    matchInfo,
    setMatchInfo,
    events,
    setEvents: setEventsAndFilter,  // Usar la función que maneja ambos
    filteredEvents: filteredEventsState,
    setFilteredEvents,
    filterDescriptors,
    // Exponer la versión asincrónica para evitar llamadas sincrónicas desde handlers
    setFilterDescriptors: setFilterDescriptorsAsync,
    filterCategory,
    setFilterCategory,
    selectedTeam,
    setSelectedTeam,
    ourTeamsList,
    setOurTeamsList,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilterContext debe usarse dentro de FilterProvider");
  }
  return context;
};

export { FilterContext };