import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PreviewImport = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { previewData, profile } = state || {};

  const [matchInfo, setMatchInfo] = useState(previewData?.match_info || {});
  const [events, setEvents] = useState(previewData?.events || []);
  const [discardedCategories, setDiscardedCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (field: string, value: string) => {
    setMatchInfo((prev: any) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (category: string) => {
    setDiscardedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleConfirm = async () => {
    if (!previewData) return;

    const filteredEvents = events.filter(
      (ev: any) => !discardedCategories.includes(ev.event_type)
    );

    try {
      const res = await fetch("http://localhost:5001/api/save_match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match: matchInfo, events: filteredEvents })
      });

      if (!res.ok) throw new Error("Error al guardar los datos");

      alert("Importación exitosa");
      navigate("/");
    } catch (err) {
      setError("Fallo al guardar en base de datos");
    }
  };

  if (!previewData) return <p>No hay datos para mostrar</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Paso 2: Revisar y Confirmar</h1>

      <Card className="mb-4">
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-lg font-semibold">Metadata del Partido</h2>
          {Object.entries(matchInfo).map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <Label>{key}</Label>
              <Input
                value={typeof value === "string" ? value : value !== undefined && value !== null ? String(value) : ""}
                onChange={(e) => handleFieldChange(key, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-lg font-semibold">Categorías Detectadas</h2>
          <p className="text-sm text-muted-foreground">
            Eventos detectados: {events.length} | Categorías descartadas: {discardedCategories.length}
          </p>
          <ul className="flex flex-wrap gap-2">
            {Array.from(new Set(previewData.event_types || [])).map((cat) => {
              const catStr = cat as string;
              return (
                <li key={catStr}>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={!discardedCategories.includes(catStr)}
                      onChange={() => toggleCategory(catStr)}
                    />
                    {catStr}
                  </label>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Button onClick={handleConfirm}>Confirmar e Importar</Button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default PreviewImport;
