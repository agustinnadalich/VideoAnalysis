import React, { ChangeEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner"; // Asumiendo que sonner está instalado
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
  const [isLoading, setIsLoading] = useState(false);
  const [labelsWithoutGroup, setLabelsWithoutGroup] = useState(previewData?.labels_without_group || []);
  const [editedLabels, setEditedLabels] = useState<string[]>([]);

  // Definir los campos del modelo Match con etiquetas amigables
  const matchFields = [
    { key: "team", label: "Equipo", required: true },
    { key: "opponent_name", label: "Rival", required: true },
    { key: "date", label: "Fecha", required: true, type: "date" },
    { key: "location", label: "Ubicación", required: false },
    { key: "competition", label: "Competición", required: false },
    { key: "round", label: "Fecha/Ronda", required: false },
    { key: "referee", label: "Árbitro", required: false },
    { key: "video_url", label: "URL del Video", required: false },
    { key: "result", label: "Resultado", required: false },
    { key: "field", label: "Cancha", required: false },
    { key: "rain", label: "Lluvia", required: false },
    { key: "muddy", label: "Barro", required: false },
    { key: "wind_1p", label: "Viento 1er Tiempo", required: false },
    { key: "wind_2p", label: "Viento 2do Tiempo", required: false },
  ];

  // Extraer categorías únicas de los eventos
  const availableCategories = Array.from(new Set(previewData?.event_types || [])) as string[];

  const handleFieldChange = (field: string, value: string) => {
    setMatchInfo((prev: any) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (category: string) => {
    setDiscardedCategories((prev: string[]) =>
      prev.includes(category)
        ? prev.filter((c: string) => c !== category)
        : [...prev, category]
    );
  };

  const selectAllCategories = () => {
    setDiscardedCategories([]);
  };

  const discardAllCategories = () => {
    setDiscardedCategories([...availableCategories]);
  };

  const discardCommonCategories = () => {
    const commonDiscard = ["WARMUP", "HALFTIME", "END", "TIMEOUT"];
    const toDiscard = availableCategories.filter((cat: string) =>
      commonDiscard.some((common) => cat.toUpperCase().includes(common))
    );
    setDiscardedCategories((prev: string[]) => [...new Set([...prev, ...toDiscard])]);
  };

  const handleConfirm = async () => {
    if (!previewData) return;
    const eventsToImport = events.filter(
      (ev: any) => !discardedCategories.includes(ev.event_type)
    );
    if (eventsToImport.length === 0) {
      setError("No hay eventos para importar.");
      toast.error("No hay eventos para importar.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5001/api/save_match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          match: matchInfo, 
          events: eventsToImport,
          profile: profile 
        })
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Error al guardar los datos");
      }
      toast.success("Importación exitosa");
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Fallo al guardar en base de datos");
      toast.error(err.message || "Fallo al guardar en base de datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // La funcionalidad de archivo debería ser manejada en la página de importación
      console.log("File selected:", e.target.files[0]);
    }
  };

  const handleLabelChange = (index: number, value: string) => {
    setEditedLabels((prev: string[]) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const renderLabelsWithoutGroup = () => (
    <Card className="mb-4">
      <CardContent className="space-y-4 pt-6">
        <h2 className="text-lg font-semibold">Labels sin Grupo</h2>
        {labelsWithoutGroup.length > 0 ? (
          labelsWithoutGroup.map((label: string, index: number) => (
            <div key={index} className="flex flex-col mb-2">
              <Label>Label {index + 1}</Label>
              <Input
                type="text"
                value={editedLabels[index] || label}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleLabelChange(index, e.target.value)
                }
              />
            </div>
          ))
        ) : (
          <p>No hay labels sin grupo.</p>
        )}
      </CardContent>
    </Card>
  );

  if (!previewData) return <p>No hay datos para mostrar</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Paso 2: Revisar y Confirmar</h1>

      <Card className="mb-4">
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-lg font-semibold">Metadata del Partido</h2>
          {matchFields.map(({ key, label, required, type }) => (
            <div key={key} className="flex flex-col">
              <Label>
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                type={type || "text"}
                value={matchInfo[key] || ""}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                placeholder={`Ingresa ${label.toLowerCase()}`}
                className={required && !matchInfo[key] ? "border-red-300" : ""}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {renderLabelsWithoutGroup()}

      <Card className="mb-4">
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-lg font-semibold">Categorías Detectadas</h2>
          <p className="text-sm text-muted-foreground">
            Eventos detectados: {events.length} | Categorías descartadas: {discardedCategories.length} | Eventos que se importarán: {events.filter((ev: any) => !discardedCategories.includes(ev.event_type)).length}
          </p>
          
          {/* Botones de acción rápida */}
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={selectAllCategories}>
              Seleccionar Todas
            </Button>
            <Button variant="outline" size="sm" onClick={discardAllCategories}>
              Descartar Todas
            </Button>
            <Button variant="outline" size="sm" onClick={discardCommonCategories}>
              Descartar Comunes (WARMUP, HALFTIME, etc.)
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {availableCategories.map((cat) => {
              const eventCount = events.filter((ev: any) => ev.event_type === cat).length;
              const isDiscarded = discardedCategories.includes(cat);
              
              return (
                <label 
                  key={cat} 
                  className={`inline-flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                    isDiscarded ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!isDiscarded}
                    onChange={() => toggleCategory(cat)}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{cat}</span>
                    <span className="text-xs text-gray-500">{eventCount} eventos</span>
                  </div>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 items-center">
        <Button 
          onClick={handleConfirm} 
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isLoading || events.filter((ev: any) => !discardedCategories.includes(ev.event_type)).length === 0}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Importando...
            </span>
          ) : (
            <>Confirmar e Importar ({events.filter((ev: any) => !discardedCategories.includes(ev.event_type)).length} eventos)</>
          )}
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)} disabled={isLoading}>
          Volver
        </Button>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default PreviewImport;
