import { useMemo, useRef, useState, useEffect } from "react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { usePlayback } from "@/context/PlaybackContext";
import { useFilterContext } from "../../context/FilterContext";
import type { MatchEvent } from "@/types";
import { Button } from "@/components/ui/button";
import { scaleLinear } from "d3-scale";

const secondsToGameClock = (sec: number): string => {
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

type TimelineChartProps = {
  filteredEvents: MatchEvent[];
  // colors: { [key: string]: string };
  onEventClick: (event: MatchEvent) => void;
  currentTime?: number;
};

// Paleta de colores (puedes ampliarla)
const palette = [
  "#3498db", "#e74c3c", "#2ecc71", "#f1c40f", "#9b59b6",
  "#1abc9c", "#e67e22", "#34495e", "#fd79a8", "#00b894",
  "#636e72", "#fdcb6e", "#6c5ce7", "#00cec9", "#d35400"
];

const TimelineChart = ({ filteredEvents, onEventClick, currentTime }: TimelineChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState<number>(600);
  const [xDomain, setXDomain] = useState<[number, number]>([0, 600]);
  const [zoomFactor, setZoomFactor] = useState<number>(1);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const { filterCategory, setFilterCategory } = useFilterContext();
  const xScale = scaleLinear()
    .domain(xDomain)
    .range([0, chartWidth]);
  const { setSelectedEvent, setCurrentTime } = usePlayback();
  const { playEvent } = usePlayback();

  // Define initialXDomain based on filteredEvents
  const initialXDomain = useMemo(() => {
    if (filteredEvents.length > 0) {
      const padding = 60;
      const start = Math.max(0, Math.min(...filteredEvents.map((e) => e.timestamp_sec ?? 0)) - padding);
      const end = Math.max(...filteredEvents.map((e) => (e.timestamp_sec ?? 0) + (e.extra_data?.DURATION ?? 0))) + padding;
      return [start, end] as [number, number];
    }
    return [0, 600] as [number, number];
  }, [filteredEvents]);

  onEventClick = (event) => {
    console.log("Evento clickeado:", event);
    playEvent(event);
  }


  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setCurrentTime(event.timestamp_sec ?? 0);
  };

  const categories = useMemo(
    () => Array.from(new Set(filteredEvents.map(ev => ev.event_type || "Otro"))).filter(cat => cat !== "END"),
    [filteredEvents]
  );

  const maxSecond = useMemo(() => {
    const max = Math.max(...filteredEvents.map(ev => (ev.timestamp_sec ?? 0) + (ev.extra_data?.DURATION ?? 1)), 60);
    return max + 5;
  }, [filteredEvents]);

  const minSecond = useMemo(() => Math.min(...filteredEvents.map(ev => ev.timestamp_sec ?? 0), 0), [filteredEvents]);

  const eventTypes = useMemo(
    () => Array.from(new Set(filteredEvents.map(ev => ev.event_type))),
    [filteredEvents]
  );

  const colors = useMemo(() => {
    const map: Record<string, string> = {};
    eventTypes.forEach((type, idx) => {
      map[type] = palette[idx % palette.length];
    });
    return map;
  }, [eventTypes]);

  const data = useMemo(() => {
    return filteredEvents.map(ev => {
      const duration = typeof ev.extra_data?.DURATION === "number" ? ev.extra_data.DURATION : 1;
      return {
        ...ev,
        category: ev.event_type || "Otro",
        SECOND: ev.timestamp_sec ?? 0,
        DURATION: duration,
        color: colors[ev.event_type] || (ev.IS_OPPONENT ? "#e74c3c" : "#3498db"),
      };
    });
  }, [filteredEvents, colors]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const event = payload[0].payload;
      return (
        <div className="rounded bg-white p-2 shadow-md border border-gray-200 text-sm">
          <div><strong>Jugador:</strong> {event.player_name || event.player}</div>
          <div><strong>Tiempo:</strong> {secondsToGameClock(event.SECOND)}</div>
          <div><strong>Duración:</strong> {Math.round(event.DURATION * 10) / 10}s</div>
          <div><strong>Categoría:</strong> {event.category}</div>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    if (chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      setChartWidth(rect.width);
    }
  }, [chartRef.current]);



  useEffect(() => {
    if (filteredEvents.length === 1) {
      const ev = filteredEvents[0];
      const start = ev.timestamp_sec ?? 0;
      const end = start + (ev.extra_data?.DURATION ?? 1);
      const padding = 10;
      setXDomain([Math.max(0, start - padding), end + padding]);
    } else {
      const visibleRange = maxSecond / zoomFactor;
      const start = 0;
      setScrollPosition(start);
      setXDomain([start, start + visibleRange]);
    }
  }, [filteredEvents, maxSecond, zoomFactor]);

  useEffect(() => {
    if (filteredEvents.length > 0) {
      const padding = 60; // Margen en segundos
      const start = Math.max(0, Math.min(...filteredEvents.map((e) => e.timestamp_sec ?? 0)) - padding);
      const end = Math.max(...filteredEvents.map((e) => (e.timestamp_sec ?? 0) + (e.extra_data?.DURATION ?? 0))) + padding;
      setXDomain([start, end]); // Establecer el dominio inicial
      setScrollPosition(start); // Establecer la posición inicial
    }
  }, [filteredEvents]);

  const handleZoomChange = (zoomIn: boolean) => {
    const zoomFactorChange = zoomIn ? 1.5 : 1 / 1.5; // Incremento o decremento del zoom
    const visibleRange = (xDomain[1] - xDomain[0]) / zoomFactorChange;
    const center = currentTime && currentTime >= xDomain[0] && currentTime <= xDomain[1]
      ? currentTime // Centrar en currentTime si está dentro del rango
      : (xDomain[0] + xDomain[1]) / 2; // De lo contrario, centrar en el rango actual

    const start = Math.max(initialXDomain[0], center - visibleRange / 2);
    const end = Math.min(initialXDomain[1], center + visibleRange / 2);

    setXDomain([start, end]);
  };
  
  const handleScroll = (direction: "left" | "right") => {
    const shift = (xDomain[1] - xDomain[0]) / 4; // Desplazamiento como fracción del rango visible
    let newStart = direction === "right" ? xDomain[0] + shift : xDomain[0] - shift;
    let newEnd = direction === "right" ? xDomain[1] + shift : xDomain[1] - shift;

    // Respetar los límites del dominio inicial
    if (newStart < initialXDomain[0]) {
      newStart = initialXDomain[0];
      newEnd = initialXDomain[0] + (xDomain[1] - xDomain[0]);
    }
    if (newEnd > initialXDomain[1]) {
      newEnd = initialXDomain[1];
      newStart = initialXDomain[1] - (xDomain[1] - xDomain[0]);
    }

    setXDomain([newStart, newEnd]);
  };

  const handleCategoryClick = (category: string) => {
    if (filterCategory.includes(category)) {
      setFilterCategory(filterCategory.filter((c: string) => c !== category));
    } else {
      setFilterCategory([...filterCategory, category]);
    }
  };
  
  const dynamicHeight = Math.min(30, Math.max(16, 150 / categories.length));
  console.log("Dynamic Height:", dynamicHeight);
  const chartHeight = Math.min(400,Math.max(100, categories.length * dynamicHeight * 2)); // Altura mínima de 200px, ajustada por la cantidad de categorías
  console.log("Chart Height:", chartHeight);
  return (
    <div className="w-full">
      <div
        ref={chartRef}
        className="overflow-x-auto"
        // style={{ height: `${Math.max(120, categories.length * 20)}px` }}
        style={{
          height: `${chartHeight}px`, // Altura dinámica del gráfico
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
            {/* <CartesianGrid strokeDasharray="3 3" /> */}
            <CartesianGrid />
            <XAxis
              dataKey="timestamp_sec"
              type="number"
              domain={xDomain}
              tickFormatter={(tick) => secondsToGameClock(tick)}
            />
            <YAxis
              type="category"
              dataKey="category"
              interval={0}
              tick={(props: any) => {
                const { x, y, payload } = props;
                const value = payload.value;
                return (
                  <g
                    transform={`translate(${x},${y})`}
                    style={{ cursor: "pointer" }}
                  >
                    <text
                      x={0}
                      y={0}
                      dy={4}
                      textAnchor="end"
                      fill="#333"
                      fontSize={10}
                      style={{
                        margin: 0,
                        padding: 0,
                        textDecoration: filterCategory.includes(value)
                          ? "underline"
                          : "none",
                      }}
                      onClick={() => handleCategoryClick(value)}
                    >
                      {value}
                    </text>
                  </g>
                );
              }}
              width={60}
              allowDuplicatedCategory={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              data={data.filter(
                (ev) => ev.SECOND >= xDomain[0] && ev.SECOND <= xDomain[1]
              )}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const width =
                  (payload.DURATION / (xDomain[1] - xDomain[0])) * chartWidth;
                const minWidth = 4;
                return (
                  <rect
                    x={cx}
                    y={cy - dynamicHeight / 2.1 }
                    width={Math.max(width, minWidth)}
                    height={dynamicHeight}
                    fill={payload.color}
                    rx={1}
                    onClick={() => onEventClick(payload)}
                    style={{ cursor: "pointer" }}
                  />
                );
              }}
            />
            {typeof currentTime === "number" &&
              currentTime >= xDomain[0] &&
              currentTime <= xDomain[1] && (
                <ReferenceLine
                  x={currentTime}
                  stroke="#000"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                />
              )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="px-4 py-2 flex items-center gap-4 flex-wrap">
        <label className="text-sm">Zoom:</label>
        <div className="controls">
          <Button variant="secondary" onClick={() => handleZoomChange(true)}>
            +
          </Button>
          <Button variant="secondary" onClick={() => handleZoomChange(false)}>
            -
          </Button>
          <Button
            variant="secondary"
            onClick={() => setXDomain(initialXDomain)}
          >
            Restablecer Zoom
          </Button>
        </div>
        <span>{zoomFactor}x</span>
        <Button variant="secondary" onClick={() => handleScroll("left")}>
          ←
        </Button>
        <Button variant="secondary" onClick={() => handleScroll("right")}>
          →
        </Button>
      </div>
    </div>
  );
};

export default TimelineChart;
