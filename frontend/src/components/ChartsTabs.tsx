import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useState } from "react";
import TacklesBarChart from "./charts/TacklesBarChart";
import AdvancePieChart from "./charts/AdvancePieChart";
// import TimelineChart from "./charts/TimelineChart";
// import ScatterChart from "./charts/ScatterChart";
// Aquí luego podrás importar los otros charts
import { useFilterContext } from "../context/FilterContext";
import type { MatchEvent } from "@/types";


const ChartsTabs = (_props: any) => {
  const {
    events,
    filteredEvents,
  } = useFilterContext() as {
    events: MatchEvent[];
    filteredEvents: MatchEvent[];
    // y otras funciones si querés
  };



  console.log("filteredEvents en ChartsTabs:", filteredEvents);

  return (
    <Tabs defaultValue="overview" className="w-full mt-4">
      <TabsList>
        <TabsTrigger value="overview">Resumen</TabsTrigger>
        <TabsTrigger value="tackles">Tackles</TabsTrigger>
        <TabsTrigger value="advances">Avances</TabsTrigger>
        <TabsTrigger value="scatter">Mapa</TabsTrigger>
        {/* Agrega más pestañas según los charts */}
      </TabsList>
      

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
          <TacklesBarChart events={filteredEvents} />
        </div>
      </TabsContent>

      <TabsContent value="advances">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Distribución de Avances</h3>
          <AdvancePieChart events={filteredEvents} category="ADVANCE" />
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
