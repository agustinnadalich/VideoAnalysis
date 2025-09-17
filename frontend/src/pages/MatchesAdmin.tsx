import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  import_profile_name?: string;
  global_delay_seconds?: number;
  event_delays?: Record<string, number>;
}

interface ImportProfile {
  name: string;
  description: string;
  settings: any;
}

const MatchesAdmin = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [profiles, setProfiles] = useState<ImportProfile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<string>("");
    const [manualTimes, setManualTimes] = useState<Record<string, number>>({
        kick_off_1: 0,
        end_1: 2400,
        kick_off_2: 2700,
        end_2: 4800
    });
    const [timeMethod, setTimeMethod] = useState<"manual" | "profile">("profile");
    const [globalDelay, setGlobalDelay] = useState<number>(0);
    const [eventDelays, setEventDelays] = useState<Record<string, number>>({});
    const [newEventType, setNewEventType] = useState<string>("");
    const [newEventDelay, setNewEventDelay] = useState<number>(0);
    const [availableEventTypes, setAvailableEventTypes] = useState<string[]>([]);

    useEffect(() => {
    fetchMatches();
    fetchProfiles();
    }, []);

    const fetchMatches = async () => {
    const res = await fetch("http://localhost:5001/api/matches");
    const data = await res.json();
    setMatches(data);
    };

    const fetchProfiles = async () => {
    const res = await fetch("http://localhost:5001/api/import/profiles");
    const data = await res.json();
    setProfiles(data);
    };

    const fetchEventTypes = async (matchId: number) => {
        try {
            const res = await fetch(`http://localhost:5001/api/matches/${matchId}/event-types`);
            const data = await res.json();
            if (res.ok) {
                console.log('Event types loaded:', data.event_types);
                setAvailableEventTypes(data.event_types);
            } else {
                console.error('Error loading event types:', data);
            }
        } catch (error) {
            console.error('Error fetching event types:', error);
        }
    };

    const handleDelete = async (id: number) => {
    await fetch(`http://localhost:5001/api/matches/${id}`, { method: "DELETE" });
    fetchMatches();
    };

    const handleEdit = (match: Match) => {
    setEditingMatch(match);
    setSelectedProfile(match.import_profile_name || "");
    setTimeMethod("profile");
    setGlobalDelay(match.global_delay_seconds || 0);
    setEventDelays(match.event_delays || {});

    // Cargar tipos de eventos disponibles para este partido
    fetchEventTypes(match.id);

    // Si hay un perfil seleccionado, cargar su configuración
    if (match.import_profile_name) {
        const profile = profiles.find(p => p.name === match.import_profile_name);
        if (profile && profile.settings?.time_mapping?.manual_times) {
            setManualTimes(profile.settings.time_mapping.manual_times);
        } else if (profile && profile.settings?.manual_period_times) {
            setManualTimes(profile.settings.manual_period_times);
        }
    }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (!editingMatch) return;
    const value = e.target.value;
    setEditingMatch({ ...editingMatch, [key]: value });
    };

    const handleSave = async () => {
        if (!editingMatch) return;
        // No envíes el id en el body, solo en la URL
        const { id, ...matchData } = editingMatch;

        // Incluir el perfil seleccionado y los delays
        const updatedMatchData = {
            ...matchData,
            import_profile_name: selectedProfile || null,
            global_delay_seconds: globalDelay,
            event_delays: eventDelays
        };

        const res = await fetch(`http://localhost:5001/api/matches/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedMatchData),
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "Error al guardar");
            return;
        }
        handleCancel();
        fetchMatches();
    };

    const handleAddEventDelay = () => {
        if (!newEventType.trim()) return;
        setEventDelays(prev => ({
            ...prev,
            [newEventType.toUpperCase()]: newEventDelay
        }));
        setNewEventType("");
        setNewEventDelay(0);
    };

    const handleCancel = () => {
        setEditingMatch(null);
        setSelectedProfile("");
        setTimeMethod("profile");
        setGlobalDelay(0);
        setEventDelays({});
        setNewEventType("");
        setNewEventDelay(0);
        setAvailableEventTypes([]);
    };

    const handleRemoveEventDelay = (eventType: string) => {
        setEventDelays(prev => {
            const updated = { ...prev };
            delete updated[eventType];
            return updated;
        });
    };

    const handleSaveProfileSettings = async () => {
        if (!selectedProfile) return;

        const profile = profiles.find(p => p.name === selectedProfile);
        if (!profile) return;

        // Actualizar la configuración del perfil
        const updatedSettings = {
            ...profile.settings,
            manual_period_times: manualTimes
        };

        const res = await fetch(`http://localhost:5001/api/import/profiles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: profile.name,
                description: profile.description,
                settings: updatedSettings
            }),
        });

        if (res.ok) {
            alert("Configuración de tiempos guardada correctamente");
            fetchProfiles(); // Recargar perfiles
        } else {
            alert("Error al guardar la configuración");
        }
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
        <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold">Editar Partido</h2>

            {/* Campos básicos del partido */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Equipo</Label>
                    <Input
                        value={editingMatch.team || ""}
                        onChange={(e) => handleInputChange(e, "team")}
                    />
                </div>
                <div>
                    <Label>Rival</Label>
                    <Input
                        value={editingMatch.opponent || ""}
                        onChange={(e) => handleInputChange(e, "opponent")}
                    />
                </div>
                <div>
                    <Label>Fecha</Label>
                    <Input
                        type="date"
                        value={editingMatch.date || ""}
                        onChange={(e) => handleInputChange(e, "date")}
                    />
                </div>
                <div>
                    <Label>Ubicación</Label>
                    <Input
                        value={editingMatch.location || ""}
                        onChange={(e) => handleInputChange(e, "location")}
                    />
                </div>
                <div>
                    <Label>Competición</Label>
                    <Input
                        value={editingMatch.competition || ""}
                        onChange={(e) => handleInputChange(e, "competition")}
                    />
                </div>
                <div>
                    <Label>Ronda</Label>
                    <Input
                        value={editingMatch.round || ""}
                        onChange={(e) => handleInputChange(e, "round")}
                    />
                </div>
                <div>
                    <Label>Resultado</Label>
                    <Input
                        value={editingMatch.result || ""}
                        onChange={(e) => handleInputChange(e, "result")}
                    />
                </div>
                <div>
                    <Label>URL del Video</Label>
                    <Input
                        value={editingMatch.video_url || ""}
                        onChange={(e) => handleInputChange(e, "video_url")}
                    />
                </div>
            </div>

            {/* Configuración de perfil y tiempos */}
            <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Configuración de Tiempos</h3>

                <div className="mb-4">
                    <Label>Perfil de Importación</Label>
                    <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar perfil..." />
                        </SelectTrigger>
                        <SelectContent>
                            {profiles.map((profile) => (
                                <SelectItem key={profile.name} value={profile.name}>
                                    {profile.name} - {profile.description}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="mb-4">
                    <Label>Método de Configuración</Label>
                    <Select value={timeMethod} onValueChange={(value: "manual" | "profile") => setTimeMethod(value)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="profile">Usar configuración del perfil</SelectItem>
                            <SelectItem value="manual">Configurar manualmente</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {timeMethod === "manual" && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Kick Off 1er Tiempo (segundos)</Label>
                            <Input
                                type="number"
                                value={manualTimes.kick_off_1}
                                onChange={(e) => setManualTimes(prev => ({ ...prev, kick_off_1: parseInt(e.target.value) || 0 }))}
                            />
                        </div>
                        <div>
                            <Label>Fin 1er Tiempo (segundos)</Label>
                            <Input
                                type="number"
                                value={manualTimes.end_1}
                                onChange={(e) => setManualTimes(prev => ({ ...prev, end_1: parseInt(e.target.value) || 0 }))}
                            />
                        </div>
                        <div>
                            <Label>Kick Off 2do Tiempo (segundos)</Label>
                            <Input
                                type="number"
                                value={manualTimes.kick_off_2}
                                onChange={(e) => setManualTimes(prev => ({ ...prev, kick_off_2: parseInt(e.target.value) || 0 }))}
                            />
                        </div>
                        <div>
                            <Label>Fin 2do Tiempo (segundos)</Label>
                            <Input
                                type="number"
                                value={manualTimes.end_2}
                                onChange={(e) => setManualTimes(prev => ({ ...prev, end_2: parseInt(e.target.value) || 0 }))}
                            />
                        </div>
                    </div>
                )}

                {selectedProfile && timeMethod === "profile" && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">
                            Los tiempos se configurarán usando el perfil "{selectedProfile}".
                            Para modificarlos, ve a la página de Crear Perfil.
                        </p>
                    </div>
                )}
            </div>

            {/* Configuración de Delays */}
            <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Configuración de Delays</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Los delays permiten ajustar los tiempos de los eventos para corregir discrepancias entre el momento de etiquetado y la acción real en el video.
                </p>

                <div className="mb-4">
                    <Label>Delay Global (segundos)</Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={globalDelay}
                        onChange={(e) => setGlobalDelay(parseFloat(e.target.value) || 0)}
                        placeholder="Ej: -1.5 (para atrasar 1.5 segundos)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Delay aplicado a todos los eventos del partido. Valores negativos atrasan los tiempos.
                    </p>
                </div>

                <div className="mb-4">
                    <Label>Delays Específicos por Tipo de Evento</Label>
                    <div className="space-y-2">
                        {Object.entries(eventDelays).map(([eventType, delay]) => (
                            <div key={eventType} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <span className="font-medium">{eventType}</span>
                                <span className="text-sm text-gray-600">{delay}s</span>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRemoveEventDelay(eventType)}
                                >
                                    Eliminar
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 mt-2">
                        <Select value={newEventType} onValueChange={setNewEventType}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Seleccionar tipo de evento..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableEventTypes.map((eventType) => (
                                    <SelectItem key={eventType} value={eventType}>
                                        {eventType}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="number"
                            step="0.1"
                            placeholder="Delay (segundos)"
                            value={newEventDelay}
                            onChange={(e) => setNewEventDelay(parseFloat(e.target.value) || 0)}
                            className="w-32"
                        />
                        <Button onClick={handleAddEventDelay} disabled={!newEventType.trim()}>
                            Agregar
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Agrega delays específicos para tipos de eventos particulares. Se suman al delay global.
                    </p>
                </div>
            </div>

            <div className="flex gap-2 mt-6">
                <Button onClick={handleSave}>Guardar Partido</Button>
                {timeMethod === "manual" && (
                    <Button onClick={handleSaveProfileSettings} variant="outline">
                        Guardar Configuración de Tiempos
                    </Button>
                )}
                <Button variant="secondary" onClick={handleCancel}>Cancelar</Button>
            </div>
        </CardContent>
        </Card>
    )}
    </div>
    );
};

export default MatchesAdmin;
