import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Props = {
  events: any[];
  onBarClick?: (category: string, player: string) => void;
};

export default function TacklesBarChart({ events, onBarClick }: Props) {
  const tackleEvents = events.filter((e) => e.CATEGORY === 'TACKLE');

  const dataMap: Record<string, number> = {};

  tackleEvents.forEach((event) => {
    const player = event.PLAYER || 'Unknown';
    const key = `${event.CATEGORY} - ${player}`;
    dataMap[key] = (dataMap[key] || 0) + 1;
  });

  const data = Object.entries(dataMap).map(([key, count]) => ({
    key,
    count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        onClick={(e) => {
          if (e && e.activeLabel && onBarClick) {
            const [category, player] = e.activeLabel.split(' - ');
            onBarClick(category, player);
          }
        }}
      >
        <XAxis dataKey="key" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" />
      </BarChart>
    </ResponsiveContainer>
  );
}
