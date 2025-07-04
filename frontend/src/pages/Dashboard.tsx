// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import { Button } from '../components/ui/OLDButton'
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

type Match = {
  ID_MATCH: number
  TEAM: string
  OPPONENT: string
  DATE: string
  COMPETITION: string
}

export default function Dashboard() {
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    fetch('http://localhost:5001/matches')
      .then(res => res.json())
      .then(data => setMatches(data.matches || []))
  }, [])

  const toggleMatch = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const goToMultiMatch = () => {
    const query = selectedIds.map(id => `match_id=${id}`).join('&')
    navigate(`/multi-match-report?${query}`)
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">San Benedetto Video Analysis</h1>
      <h2 className="mb-6 text-lg text-gray-700">Selecciona partidos para el reporte MultiMatch</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {matches.map(match => (
            <Card key={match.ID_MATCH}>
                <CardHeader>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                    {match.TEAM} <span className="text-gray-500">vs</span> {match.OPPONENT}
                </h2>
                </CardHeader>
                <CardContent>
                <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Fecha:</span> {new Date(match.DATE).toLocaleDateString()}</p>
                    <p><span className="font-medium">Competición:</span> {match.COMPETITION}</p>
                </div>

                <label className="mt-4 flex items-center gap-2 text-sm">
                    <input
                    type="checkbox"
                    checked={selectedIds.includes(match.ID_MATCH)}
                    onChange={() => toggleMatch(match.ID_MATCH)}
                    className="accent-blue-600 w-4 h-4"
                    />
                    Seleccionar para MultiMatch
                </label>
                </CardContent>
                <CardFooter>
                <button
                    className="w-full bg-blue-600 text-white font-medium rounded-xl px-4 py-2 hover:bg-blue-700 transition"
                    onClick={() => navigate(`/video-analysis/${match.ID_MATCH}`, { state: { match } })}
                >
                    Ver análisis individual
                </button>
                </CardFooter>
            </Card>
        ))}

      </div>

      <div className="mt-6 text-center">
        <Button
          onClick={goToMultiMatch}
          disabled={selectedIds.length === 0}
        >
          Ver Reporte MultiMatch
        </Button>
      </div>
    </Layout>
  )
}
