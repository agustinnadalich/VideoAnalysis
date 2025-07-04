import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useState } from "react";
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
        <TabsTrigger value="scatter">Mapa</TabsTrigger>
        {/* Agrega más pestañas según los charts */}
      </TabsList>
      

      <TabsContent value="overview">
        {/* <TimelineChart
          filteredEvents={filteredEvents}
          colors={colors}
          onEventClick={onEventClick}
          currentTime={currentTime}
        /> */}
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
