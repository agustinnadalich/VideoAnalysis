// src/pages/Dashboard.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '@/components/layout/Layout'
import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '@/lib/api'

export default function Dashboard() {
  const matchId = 1;
  const { data, isLoading, error } = useQuery({
    queryKey: ['events', matchId],
    queryFn: () => fetchEvents(matchId)
  });

  // Agrupa eventos por categoría y cuenta cuántos hay de cada una
  const chartData = data
    ? Object.entries(
        data.events.reduce((acc, ev) => {
          acc[ev.CATEGORY] = (acc[ev.CATEGORY] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Gráfico de Fases</h1>
      <div className="w-full h-64 bg-white rounded-xl shadow p-4">
        {isLoading ? (
          <div>Cargando...</div>
        ) : error ? (
          <div>Error al cargar datos</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Layout>
  )
}
