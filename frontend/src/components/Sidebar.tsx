// Sidebar.tsx
import { useFilterContext } from "@/context/FilterContext";
import { useEffect, useState, useMemo } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { useMatches } from "@/hooks/useMatches";
import { useContext } from "react";
import { usePlayback } from "@/context/PlaybackContext";
import { FiX } from "react-icons/fi";



const Sidebar = React.memo(({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) => {
  const {
    events,
    filterDescriptors,
    setFilterDescriptors,
    filterCategory,
    setFilterCategory,
    setFilteredEvents,
    selectedTeam,
    setSelectedTeam,
    matchInfo
  } = useFilterContext();

  const { playFiltered } = usePlayback();
  // Obtén todos los partidos (matches)
  const matchesQuery = useMatches(); // useMatches likely returns a UseQueryResult
  const allMatches = matchesQuery.data ?? [];
  // Si match_info puede ser undefined, inicializa como objeto vacío para evitar errores
  const safeMatchInfo = matchInfo || {};

  type Match = {
    team: string;
    opponent: string;
    // add other properties if needed
  };

  const allTeams = Array.from(
    new Set(
      (allMatches as Match[]).map((m: Match) => m.opponent).filter((opponent: string) => Boolean(opponent))
    )
  ).sort();

  const myTeams = useMemo(
    () =>
      Array.from(
        new Set(
          (matchesQuery.data || [])
            .map((m: Match) => m.team)
            .filter((t: string) => t !== "Opponent")
        )
      ).sort(),
    [matchesQuery.data]
  );

  const camposExtra = ["TRY_ORIGIN", "Time_Group", "player_name", "player_position"];


  const filteredEvents = useMemo(() => {
    let result = [...events];




    if (filterCategory.length > 0) {
      result = result.filter((ev) => filterCategory.includes(ev.event_type));
    }
    if (filterDescriptors.length > 0) {
      result = result.filter((ev) =>
        filterDescriptors.every((fd) => {
          const eventValue = ev.extra_data?.[fd.descriptor] || ev[fd.descriptor];

          // Si el valor del evento es un array, verificar si contiene el valor del filtro
          if (Array.isArray(eventValue)) {
            return eventValue.includes(fd.value);
          }

          // Si no es array, comparar directamente
          return eventValue === fd.value;
        })
      );
    }

    if (selectedTeam) {
      if (selectedTeam === "MIS EQUIPOS") {
        result = result.filter((ev) => ev.IS_OPPONENT === false);
      } else if (selectedTeam === "RIVALES") {
        result = result.filter((ev) => ev.IS_OPPONENT === true);
      } else if (myTeams.includes(selectedTeam)) {
        // Si es uno de mis equipos, filtra por TEAM propio
        result = result.filter(
          (ev) =>
            (ev.TEAM === selectedTeam || ev.extra_data?.TEAM === selectedTeam) &&
            ev.IS_OPPONENT === false
        );
      } else {
        // Si es un rival, filtra por OPPONENT y IS_OPPONENT true
        result = result.filter(
          (ev) =>
            (ev.OPPONENT === selectedTeam || ev.extra_data?.OPPONENT === selectedTeam) &&
            ev.IS_OPPONENT === true
        );
      }
    }
    //console log de selectedTeam
    
    return result;
  }, [events, selectedTeam, filterCategory, filterDescriptors]);
  
  const allDescriptors = useMemo(() => (
    Array.from(
      new Set([
        ...filteredEvents.flatMap(ev => ev.extra_data ? Object.keys(ev.extra_data) : []),
        ...camposExtra.filter(key => filteredEvents.some(ev => ev[key] !== undefined && ev[key] !== null))
      ])
    )
  ), [filteredEvents, camposExtra]);

  const [selectedDescriptor, setSelectedDescriptor] = useState<string>("");
  // console.log("Selected Descriptor:", selectedDescriptor);
  const [availableValues, setAvailableValues] = useState<string[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>("");



  useEffect(() => {
    if (selectedDescriptor) {
      const values = Array.from(
        new Set(
          events
            .map((ev) => ev[selectedDescriptor])
            .filter((v) => v !== undefined && v !== null && v !== "")
        )
      ) as string[];
      setAvailableValues(values);
    } else {
      setAvailableValues([]);
    }
  }, [selectedDescriptor, events]);

  const descriptorValues = useMemo(() => {
    if (!selectedDescriptor) return [];
    return Array.from(
      new Set(
        filteredEvents
          .flatMap(ev => {
            const value = ev.extra_data && selectedDescriptor in ev.extra_data
              ? ev.extra_data[selectedDescriptor]
              : ev[selectedDescriptor];

            // Si el valor es un array (como JUGADOR: ["13", "20"]), extraer cada elemento
            if (Array.isArray(value)) {
              return value;
            }

            return [value];
          })
          .filter(v => v !== undefined && v !== null && v !== "None")
      )
    );
  }, [filteredEvents, selectedDescriptor]);

  useEffect(() => {
    let result = [...events];

    // Filtrar por categoría
    if (filterCategory.length > 0) {
      result = result.filter((ev) => filterCategory.includes(ev.event_type));
    }

    // Filtrar por descriptores
    if (filterDescriptors.length > 0) {
      result = result.filter((ev) =>
        filterDescriptors.every((fd) => {
          const eventValue = ev.extra_data?.[fd.descriptor] || ev[fd.descriptor];

          // Si el valor del evento es un array, verificar si contiene el valor del filtro
          if (Array.isArray(eventValue)) {
            return eventValue.includes(fd.value);
          }

          // Si no es array, comparar directamente
          return eventValue === fd.value;
        })
      );
    }

    // Filtrar por equipo seleccionado
    if (selectedTeam) {
      if (selectedTeam === "MIS EQUIPOS") {
        result = result.filter((ev) => ev.IS_OPPONENT === false);
      } else if (selectedTeam === "RIVALES") {
        result = result.filter((ev) => ev.IS_OPPONENT === true);
      } else if (myTeams.includes(selectedTeam)) {
        result = result.filter(
          (ev) =>
            (ev.TEAM === selectedTeam || ev.extra_data?.TEAM === selectedTeam) &&
            ev.IS_OPPONENT === false
        );
      } else {
        result = result.filter(
          (ev) =>
            (ev.OPPONENT === selectedTeam || ev.extra_data?.OPPONENT === selectedTeam) &&
            ev.IS_OPPONENT === true
        );
      }
    }

    // Ordenar por timestamp_sec ascendente
    result.sort((a, b) => (a.timestamp_sec ?? 0) - (b.timestamp_sec ?? 0));

    // Actualizar el estado global de eventos filtrados
    setFilteredEvents(result);
  }, [events, filterCategory, filterDescriptors, selectedTeam, myTeams, setFilteredEvents]);

  const applyFilter = () => {
    if (
      selectedDescriptor &&
      selectedValue &&
      !filterDescriptors.some(
        (fd) =>
          fd.descriptor === selectedDescriptor && fd.value === selectedValue
      )
    ) {
      setFilterDescriptors([
        ...filterDescriptors,
        { descriptor: selectedDescriptor, value: selectedValue },
      ]);
      setSelectedDescriptor("");
      setSelectedValue("");
    }
  };

  const removeDescriptorFilter = (descriptor: string, value: string) => {
    setFilterDescriptors(
      filterDescriptors.filter(
        (fd) => !(fd.descriptor === descriptor && fd.value === value)
      )
    );
  };
  

  const toggleCategory = (category: string) => {
    if (filterCategory.includes(category)) {
      setFilterCategory(filterCategory.filter((c) => c !== category));
    } else {
      setFilterCategory([...filterCategory, category]);
    }
  };

  // Equipos presentes en los eventos actuales (del partido abierto)
  const equiposEnEventos = Array.from(
    new Set([
      ...events.map((ev) => ev.TEAM).filter(Boolean),
      ...events.map((ev) => ev.OPPONENT).filter(Boolean),
    ])
  ).sort();

  // Obtén los equipos del partido abierto
  const equiposDelPartido = [
    safeMatchInfo.TEAM || "",
    safeMatchInfo.OPPONENT || ""
  ].filter((e) => e && typeof e === "string");

  // Elimina duplicados por si acaso
  const equiposUnicos = Array.from(new Set(equiposDelPartido));

  const valoresDescriptor = selectedDescriptor
    ? Array.from(
        new Set(
          events.map(ev => {
            // Si el descriptor está en extra_data
            if (ev.extra_data && selectedDescriptor in ev.extra_data) {
              return ev.extra_data[selectedDescriptor];
            }
            // Si el descriptor es un campo directo del evento
            if (ev[selectedDescriptor] !== undefined) {
              return ev[selectedDescriptor];
            }
            return undefined;
          }).filter(v => v !== undefined && v !== null)
        )
      )
    : [];


  // Define a players map or import it from the appropriate source
  const players: Record<string, string> = {}; // Replace with actual player data or import

  const getPlayerName = (id: string) => players[id] || id;

  const allCategories = useMemo(
    () =>
      Array.from(
        new Set(events.map(ev => ev.event_type).filter(Boolean))
      ),
    [filteredEvents]
  );

  const playerNames = useMemo(
    () =>
      Array.from(
        new Set(
          filteredEvents
            .map(ev => ev.player_name)
            .filter(name => name && name !== "None")
        )
      ),
    [filteredEvents]
  );



  return (
    <div className="fixed md:relative md:translate-x-0 top-0 left-0 h-full w-64 bg-white border-r shadow z-40 transition-transform duration-300">
      <div className="p-4 space-y-4">
        {/* Encabezado con botón de cerrar */}
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">Filtros</h2>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
            <FiX size={22} />
          </Button>
        </div>

        <div className="space-y-2">
          {/* Equipo */}
          <>
            <label className="text-sm font-medium">Equipo</label>
            <select
              value={selectedTeam || ""}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full border rounded px-2 py-1 mb-4"
            >
              <option value="">Todos</option>
              {equiposUnicos.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
              <option disabled>────────</option>
              <option value="MIS EQUIPOS">MIS EQUIPOS</option>
              <option value="RIVALES">RIVALES</option>
            </select>
          </>

          <div>
            <label className="block text-sm font-medium mb-1">Descriptor</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={selectedDescriptor}
              onChange={(e) => setSelectedDescriptor(e.target.value)}
            >
              <option value="">Seleccionar descriptor</option>
              {allDescriptors.map((desc) => (
                <option key={desc} value={desc}>
                  {desc}
                </option>
              ))}
            </select>
          </div>

          {selectedDescriptor && descriptorValues.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                {selectedDescriptor === "player_name" ? "Jugadores" : "Valores"}
              </label>
              <select
                className="w-full border rounded px-2 py-1"
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
              >
                <option value="">Todos</option>
                {descriptorValues.map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={applyFilter}
            disabled={!selectedDescriptor || !selectedValue}
            className="w-full mt-2"
          >
            Aplicar filtro
          </Button>
        </div>

        {filterDescriptors.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Filtros activos</h3>
            <div className="flex flex-wrap gap-2">
              {filterDescriptors.map((fd, i) => (
                <span
                  key={`${fd.descriptor}-${fd.value}-${i}`}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1"
                >
                  {fd.descriptor}: {fd.value}
                  <button
                    onClick={() =>
                      removeDescriptorFilter(fd.descriptor, fd.value)
                    }
                    className="text-blue-600 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <h3 className="font-semibold text-sm mb-2">Categorías</h3>
          <select
            multiple
            className="w-full border rounded px-2 py-1 h-32"
            value={filterCategory}
            onChange={(e) => {
              const options = Array.from(e.target.selectedOptions).map(
                (o) => o.value
              );
              setFilterCategory(options);
            }}
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* {playerNames.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Jugadores</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
            >
              <option value="">Todos</option>
              {playerNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        )} */}

        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setFilterDescriptors([]);
              setFilterCategory([]);
              setSelectedDescriptor("");
              setSelectedValue("");
            }}
          >
            Limpiar filtros
          </Button>

          <Button
            variant="default"
            onClick={playFiltered}
            disabled={filteredEvents.length === 0}
          >
            ▶️ Reproducir filtrados
          </Button>
        </div>
        <div className="mb-2 text-sm text-gray-600">
          {filteredEvents.length} evento{filteredEvents.length !== 1 ? "s" : ""}{" "}
          filtrado{filteredEvents.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
});

export default Sidebar;
