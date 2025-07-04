import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Match {
  id: number;
  team: string;
  opponent: string;
  date: string;
  location: string;
  competition?: string;
  round?: string;
  result?: string;
  video_url?: string;
}

const MatchesAdmin = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);

    useEffect(() => {
    fetchMatches();
    }, []);

    const fetchMatches = async () => {
    const res = await fetch("http://localhost:5001/api/matches");
    const data = await res.json();
    setMatches(data);
    };

    const handleDelete = async (id: number) => {
    await fetch(`http://localhost:5001/api/matches/${id}`, { method: "DELETE" });
    fetchMatches();
    };

    const handleEdit = (match: Match) => {
    setEditingMatch(match);
    };

    const handleSave = async () => {
        if (!editingMatch) return;
        // No envíes el id en el body, solo en la URL
        const { id, ...matchData } = editingMatch;
        const res = await fetch(`http://localhost:5001/api/matches/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(matchData),
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "Error al guardar");
            return;
        }
        setEditingMatch(null);
        fetchMatches();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (!editingMatch) return;
    const value = e.target.value;
    setEditingMatch({ ...editingMatch, [key]: value });
    };

    return (
    <div className="max-w-4xl mx-auto p-4">
    <h1 className="text-2xl font-bold mb-4">Administrar Partidos</h1>

    {matches.map((match) => (
        <Card key={match.id} className="mb-4">
        <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
            <div>
                <strong>{match.team}</strong> vs <strong>{match.opponent}</strong>
                <div className="text-sm text-gray-600">{match.date} - {match.location}</div>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => handleEdit(match)}>Editar</Button>
                <Button variant="destructive" onClick={() => handleDelete(match.id)}>Eliminar</Button>
            </div>
            </div>
        </CardContent>
        </Card>
    ))}

    {editingMatch && (
        <Card className="mt-6">
        <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold">Editar Partido</h2>

            {Object.entries(editingMatch).map(([key, value]) => (
            <div key={key} className="mb-2">
                <label htmlFor={key} className="block text-sm font-semibold mb-1 capitalize">
                {key}
                </label>
                <input
                id={key}
                type="text"
                value={value ?? ""}
                onChange={(e) => handleInputChange(e, key)}
                className="w-full border rounded px-2 py-1"
                placeholder={`Editar ${key}`}
                />
            </div>
            ))}

            <div className="flex gap-2 mt-4">
            <Button onClick={handleSave}>Guardar</Button>
            <Button variant="secondary" onClick={() => setEditingMatch(null)}>Cancelar</Button>
            </div>
        </CardContent>
        </Card>
    )}
    </div>
    );
};

export default MatchesAdmin;
