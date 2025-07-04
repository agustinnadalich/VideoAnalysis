import React from "react";

interface EventsTableProps {
  events: any[];
  columns: string[];
  onRowClick: (event: any) => void;
}

const EventsTable: React.FC<EventsTableProps> = ({ events, columns, onRowClick }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl shadow-sm border border-gray-200">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-700 font-semibold">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-2 whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((event, idx) => (
            <tr
              key={idx}
              className="hover:bg-gray-50 cursor-pointer border-t"
              onClick={() => onRowClick(event)}
            >
              {columns.map((col) => (
                <td key={col} className="px-4 py-2 whitespace-nowrap">
                  {event[col] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EventsTable;
