import { useMemo, useRef, useState, useEffect } from "react";
import React from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { usePlayback } from "@/context/PlaybackContext";
import { useFilterContext } from "../../context/FilterContext";
import type { MatchEvent } from "@/types";
import { Button } from "@/components/ui/button";

const secondsToGameClock = (sec: number): string => {
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const CurrentTimeLine = React.memo(({ currentTime, xDomain }: { currentTime: number; xDomain: [number, number] }) => {
  if (typeof currentTime !== "number" || currentTime < xDomain[0] || currentTime > xDomain[1]) {
    return null;
  }

  return (
    <ReferenceLine
      x={currentTime}
      stroke="#000"
      strokeWidth={2}
      strokeDasharray="4 2"
    />
  );
});

const TimelineChart = ({ filteredEvents, onEventClick }: { filteredEvents: MatchEvent[]; onEventClick: (event: MatchEvent) => void }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState<number>(600);
  const [xDomain, setXDomain] = useState<[number, number]>([0, 600]);
  const [zoomFactor, setZoomFactor] = useState<number>(1);
  const { filterCategory, setFilterCategory } = useFilterContext();
  const { setSelectedEvent, playEvent, currentTime } = usePlayback();
  // Track last user interaction (zoom/scroll/reset) to avoid auto-centering immediately after
  const lastUserActionRef = useRef<number>(0);

  const initialXDomain = useMemo(() => {
    if (filteredEvents.length > 0) {
      const padding = 60;
      const start = Math.max(0, Math.min(...filteredEvents.map(e => e.timestamp_sec ?? 0)) - padding);
      const end = Math.max(...filteredEvents.map(e => (e.timestamp_sec ?? 0) + (e.extra_data?.DURATION ?? 0))) + padding;
      return [start, end] as [number, number];
    }
    return [0, 600] as [number, number];
  }, [filteredEvents]);

  // Helper: compare numeric domain arrays to avoid redundant updates
  const domainsEqual = (a: [number, number], b: [number, number]) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    return Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
  };

  // Debounce/coalesce domain updates coming from filteredEvents changes
  const domainTimeoutRef = useRef<number | null>(null);
  const scheduleSetDomain = (target: [number, number], reason = "unknown") => {
    // Clear previous scheduled update
    if (domainTimeoutRef.current) {
      window.clearTimeout(domainTimeoutRef.current as number);
      domainTimeoutRef.current = null;
    }

    // Short debounce to coalesce multiple rapid updates (e.g., many charts firing)
    domainTimeoutRef.current = window.setTimeout(() => {
      domainTimeoutRef.current = null;
      if (!domainsEqual(xDomain, target)) {
        // Debug log to help diagnose looping behaviour
        // eslint-disable-next-line no-console
        console.log(`TimelineChart - scheduleSetDomain applying (${reason}):`, target, "prev:", xDomain);
        requestAnimationFrame(() => setXDomain(target));
      }
    }, 45);
  };

  // Detectar mobile (ssr-safe)
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  }, []);

  const categories = useMemo(() => Array.from(new Set(filteredEvents.map(ev => ev.event_type || "Otro"))).filter(cat => cat !== "END"), [filteredEvents]);

  const maxSecond = useMemo(() => {
    const max = Math.max(...filteredEvents.map(ev => {
      let duration = 1; // default
      if (ev.extra_data?.clip_end && ev.extra_data?.clip_start) {
        duration = ev.extra_data.clip_end - ev.extra_data.clip_start;
      } else if (ev.extra_data?.duration) {
        duration = ev.extra_data.duration;
      } else if (ev.extra_data?.DURATION) {
        duration = ev.extra_data.DURATION;
      }
      return (ev.timestamp_sec ?? 0) + duration;
    }), 60);
    return max + 5;
  }, [filteredEvents]);

  const colors = useMemo(() => {
    const map: Record<string, string> = {};
    const palette = ["#3498db", "#e74c3c", "#2ecc71", "#f1c40f", "#9b59b6", "#1abc9c", "#e67e22", "#34495e", "#fd79a8", "#00b894", "#636e72", "#fdcb6e", "#6c5ce7", "#00cec9", "#d35400"];
    categories.forEach((type, idx) => {
      map[type] = palette[idx % palette.length];
    });
    return map;
  }, [categories]);

  const data = useMemo(() => filteredEvents.map(ev => {
    // Calcular duración correctamente
    let duration = 1; // default
    if (ev.extra_data?.clip_end && ev.extra_data?.clip_start) {
      duration = ev.extra_data.clip_end - ev.extra_data.clip_start;
    } else if (ev.extra_data?.duration) {
      duration = ev.extra_data.duration;
    } else if (ev.extra_data?.DURATION) {
      duration = ev.extra_data.DURATION;
    }

    return {
      ...ev,
      category: ev.event_type || "Otro",
      SECOND: ev.timestamp_sec ?? 0,
      DURATION: duration,
      color: colors[ev.event_type] || (ev.IS_OPPONENT ? "#e74c3c" : "#3498db"),
    };
  }), [filteredEvents, colors]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const event = payload[0].payload;

      // Obtener información del jugador
      let playerInfo = "N/A";
      if (event.extra_data?.JUGADOR) {
        if (Array.isArray(event.extra_data.JUGADOR)) {
          playerInfo = event.extra_data.JUGADOR.join(", ");
        } else {
          playerInfo = event.extra_data.JUGADOR;
        }
      } else if (event.player_name) {
        playerInfo = event.player_name;
      } else if (event.player) {
        playerInfo = event.player;
      }

      // Obtener otros descriptores no null
      const otherDescriptors: string[] = [];
      if (event.extra_data) {
        for (const [key, value] of Object.entries(event.extra_data)) {
          if (key !== 'JUGADOR' && key !== 'duration' && key !== 'DURATION' &&
              key !== 'clip_start' && key !== 'clip_end' && value !== null && value !== "") {
            if (Array.isArray(value)) {
              otherDescriptors.push(`${key}: ${value.join(", ")}`);
            } else {
              otherDescriptors.push(`${key}: ${value}`);
            }
          }
        }
      }

      return (
        <div className="rounded bg-white p-2 shadow-md border border-gray-200 text-sm max-w-xs">
          <div><strong>Jugador:</strong> {playerInfo}</div>
          <div><strong>Tiempo:</strong> {secondsToGameClock(event.SECOND)}</div>
          <div><strong>Duración:</strong> {Math.round(event.DURATION * 10) / 10}s</div>
          <div><strong>Categoría:</strong> {event.category}</div>
          {otherDescriptors.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div><strong>Detalles:</strong></div>
              {otherDescriptors.map((desc, idx) => (
                <div key={idx} className="text-xs text-gray-600 ml-2">• {desc}</div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    // Use a stable resize listener instead of depending on the mutable ref.current
    const updateSize = () => {
      if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        setChartWidth(rect.width);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (filteredEvents.length === 1) {
      const ev = filteredEvents[0];
      const start = ev.timestamp_sec ?? 0;

      // Calcular duración correctamente
      let duration = 1; // default
      if (ev.extra_data?.clip_end && ev.extra_data?.clip_start) {
        duration = ev.extra_data.clip_end - ev.extra_data.clip_start;
      } else if (ev.extra_data?.duration) {
        duration = ev.extra_data.duration;
      } else if (ev.extra_data?.DURATION) {
        duration = ev.extra_data.DURATION;
      }

      const end = start + duration;
      const padding = 10;
      const target: [number, number] = [Math.max(0, start - padding), end + padding];
      scheduleSetDomain(target, 'single-event');
    } else {
      // En mobile, inicializar mostrando hasta los primeros 20 minutos (1200s) como rango visible
      const mobileCap = 1200; // 20 minutos en segundos
      const baseRange = isMobile ? Math.min(mobileCap, maxSecond) : maxSecond;
      const visibleRange = baseRange / zoomFactor; // initial calculation uses current zoomFactor
      const start = 0;
      const target: [number, number] = [start, start + visibleRange];
      scheduleSetDomain(target, 'filtered-events-default');
    }
    // Nota: no incluimos zoomFactor en las dependencias para evitar que un cambio de zoom
    // inmediato sobrescriba el xDomain calculado por handleZoomChange. El handler actual
    // actualiza el xDomain directamente y también actualiza zoomFactor.
  }, [filteredEvents, maxSecond]);

  useEffect(() => {
    if (filteredEvents.length > 0) {
      const padding = 60;
      const start = Math.max(0, Math.min(...filteredEvents.map(e => e.timestamp_sec ?? 0)) - padding);
      const end = Math.max(...filteredEvents.map(e => (e.timestamp_sec ?? 0) + (e.extra_data?.DURATION ?? 0))) + padding;
      // Si estamos en mobile, limitar el dominio inicial a los primeros 20 minutos para no mostrar todo tan comprimido
      if (isMobile) {
        const mobileEnd = Math.min(end, 1200);
        const target: [number, number] = [0, mobileEnd];
        scheduleSetDomain(target, 'initial-mobile');
      } else {
        const target: [number, number] = [start, end];
        scheduleSetDomain(target, 'initial');
      }
    }
  }, [filteredEvents]);

  const handleZoomChange = (zoomIn: boolean) => {
    // Calculamos el nuevo factor de zoom de forma acumulativa
    const zoomFactorChange = zoomIn ? 1.5 : 1 / 1.5;
    const newZoomFactor = zoomFactor * zoomFactorChange;

    // Calculamos el rango visible relativo al dominio completo (initialXDomain)
    const totalRange = initialXDomain[1] - initialXDomain[0];
    const newVisibleRange = Math.max(1, totalRange / newZoomFactor);

    // Clamp visible range entre 5 minutos (300s) y 100 minutos (6000s)
    const MIN_VISIBLE = 300; // 5 minutos
    const MAX_VISIBLE = 6000; // 100 minutos
    const clampedVisibleRange = Math.min(Math.max(newVisibleRange, MIN_VISIBLE), MAX_VISIBLE);
    // Recalcular el factor de zoom real usando el rango clampeado
    const adjustedZoomFactor = totalRange / clampedVisibleRange;

    // Centrar el zoom en el centro actual de la vista (más predecible que usar currentTime)
    const center = (xDomain[0] + xDomain[1]) / 2;

    // Use the clamped visible range when computing the new window so xDomain matches the actual zoom factor
    let start = center - clampedVisibleRange / 2;
    let end = center + clampedVisibleRange / 2;

    // Clamp dentro del dominio inicial
    if (start < initialXDomain[0]) {
      start = initialXDomain[0];
      end = start + clampedVisibleRange;
    }
    if (end > initialXDomain[1]) {
      end = initialXDomain[1];
      start = end - clampedVisibleRange;
    }

    // Use raf to avoid asynchronous updates while Recharts may be notifying subscribers
    // record user action to suppress auto-centering
    lastUserActionRef.current = Date.now();
    requestAnimationFrame(() => {
      setXDomain([start, end]);
      setZoomFactor(adjustedZoomFactor);
    });
  };

  const handleScroll = (direction: "left" | "right") => {
    // Shift by a fixed 10 minutes (600 seconds) per click
    const SHIFT_SECONDS = 600; // 10 minutes
    const range = xDomain[1] - xDomain[0];
    let newStart = direction === "right" ? xDomain[0] + SHIFT_SECONDS : xDomain[0] - SHIFT_SECONDS;
    let newEnd = newStart + range;

    // Clamp to initial domain bounds
    if (newStart < initialXDomain[0]) {
      newStart = initialXDomain[0];
      newEnd = initialXDomain[0] + range;
    }
    if (newEnd > initialXDomain[1]) {
      newEnd = initialXDomain[1];
      newStart = initialXDomain[1] - range;
    }

    // record user action to suppress auto-centering
    lastUserActionRef.current = Date.now();
    // Deferir para evitar actualizaciones sincrónicas que puedan disparar suscripciones
    requestAnimationFrame(() => setXDomain([newStart, newEnd]));
  };

  // Handler para restablecer zoom y el factor de zoom
  const handleResetZoom = () => {
    // record user action to suppress auto-centering
    lastUserActionRef.current = Date.now();
    requestAnimationFrame(() => {
      setXDomain(initialXDomain);
      setZoomFactor(1);
    });
  };

  // Efectos de debug: mostrar cambios de xDomain y zoomFactor en consola para diagnóstico
  useEffect(() => {
    // noop in production
  }, [xDomain]);

  useEffect(() => {
    // noop in production
  }, [zoomFactor]);

  // Deshabilitar botones si alcanzamos límites
  const totalRange = initialXDomain[1] - initialXDomain[0];
  const currentVisibleRange = xDomain[1] - xDomain[0];
  const MIN_VISIBLE = 300; // 5 minutos
  const MAX_VISIBLE = 6000; // 100 minutos
  const canZoomIn = currentVisibleRange > MIN_VISIBLE + 1; // permitir si aún podemos reducir
  const canZoomOut = currentVisibleRange < MAX_VISIBLE - 1; // permitir si aún podemos ampliar

  // Mantener la línea de tiempo visible: si currentTime sale del xDomain, desplazamos la ventana
  useEffect(() => {
    if (typeof currentTime !== 'number' || isNaN(currentTime)) return;
    // Avoid auto-centering immediately after a user interaction (zoom/scroll/reset)
    const SUPPRESS_MS = 900; // ms
    if (Date.now() - lastUserActionRef.current < SUPPRESS_MS) return;

    const [start, end] = xDomain;
    if (currentTime < start || currentTime > end) {
      const range = end - start;
      // Centrar el currentTime dentro de la ventana
      let newStart = Math.max(initialXDomain[0], currentTime - range / 2);
      let newEnd = newStart + range;
      if (newEnd > initialXDomain[1]) {
        newEnd = initialXDomain[1];
        newStart = Math.max(initialXDomain[0], newEnd - range);
      }
      const target: [number, number] = [newStart, newEnd];
      if (!domainsEqual(xDomain, target)) {
        // Deferimos el setState para evitar actualizaciones sincrónicas durante el commit
        requestAnimationFrame(() => setXDomain(target));
      }
    }
  }, [currentTime, xDomain, initialXDomain]);

  const handleCategoryClick = (category: string) => {
    // record user action to avoid immediate auto-centering while interacting
    lastUserActionRef.current = Date.now();
    // Normalize category for comparison but store the original string so UI select matches
    const normalized = (category || "").toString().trim().toUpperCase();
    const normalizedList = (filterCategory || []).map((c: any) => (c || "").toString().trim().toUpperCase());
    if (normalizedList.includes(normalized)) {
      // remove entries whose normalized form matches
      setFilterCategory((filterCategory || []).filter((c: any) => (c || "").toString().trim().toUpperCase() !== normalized));
    } else {
      // add the original category value (preserve casing used in options)
      setFilterCategory([...(filterCategory || []), category]);
    }
  };

  const dynamicHeight = Math.min(30, Math.max(16, 150 / categories.length));
  const chartHeight = Math.min(400, Math.max(100, categories.length * dynamicHeight * 2));

  return (
    <div className="w-full">
      <div ref={chartRef} className="overflow-x-auto" style={{ height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid />
            <XAxis dataKey="timestamp_sec" type="number" domain={xDomain} tickFormatter={(tick) => secondsToGameClock(tick)} />
            <YAxis
              type="category"
              dataKey="category"
              interval={0}
              tick={({ x, y, payload }) => (
                <g transform={`translate(${x},${y})`} style={{ cursor: "pointer" }}>
                  <text
                    x={0}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    fill="#333"
                    fontSize={10}
                    style={{ textDecoration: (filterCategory || []).map((c:any)=>(c||"").toString().trim().toUpperCase()).includes((payload.value||"").toString().trim().toUpperCase()) ? "underline" : "none" }}
                    onClick={() => handleCategoryClick(payload.value)}
                  >
                    {payload.value}
                  </text>
                </g>
              )}
              width={60}
              allowDuplicatedCategory={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              data={data.filter(ev => ev.SECOND >= xDomain[0] && ev.SECOND <= xDomain[1])}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const width = (payload.DURATION / (xDomain[1] - xDomain[0])) * chartWidth;
                return (
                  <rect
                    x={cx}
                    y={cy - dynamicHeight / 2.1}
                    width={Math.max(width, 4)}
                    height={dynamicHeight}
                    fill={payload.color}
                    rx={1}
                    onClick={() => {
                      // Mark user action to suppress auto-centering and avoid click interruption
                      lastUserActionRef.current = Date.now();
                      onEventClick(payload);
                    }}
                    style={{ cursor: "pointer" }}
                  />
                );
              }}
            />

            <CurrentTimeLine currentTime={currentTime ?? 0} xDomain={xDomain} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="px-4 py-2 flex items-center gap-4 flex-wrap">
        <label className="text-sm">Zoom:</label>
        <div className="controls">
          <Button variant="secondary" onClick={() => handleZoomChange(true)} disabled={!canZoomIn}>+</Button>
          <Button variant="secondary" onClick={() => handleZoomChange(false)} disabled={!canZoomOut}>-</Button>
          <Button variant="secondary" onClick={handleResetZoom}>Restablecer Zoom</Button>
        </div>
        <span>{zoomFactor}x</span>
        <Button variant="secondary" onClick={() => handleScroll("left")}>←</Button>
        <Button variant="secondary" onClick={() => handleScroll("right")}>→</Button>
      </div>
    </div>
  );
};

export default TimelineChart;
