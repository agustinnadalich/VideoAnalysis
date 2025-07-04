import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const ImportMatch = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>("Default");
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handlePreview = async () => {
    if (!file || !selectedProfile) {
      setError("Selecciona un archivo y un perfil válido");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`http://localhost:5001/api/import/preview?profile=${selectedProfile}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al previsualizar archivo");
      const data = await res.json();
      navigate("/preview", { state: { previewData: data, file, profile: selectedProfile } });
    } catch (err) {
      setError("Error al procesar el archivo");
    }
  };

  const profilesQuery = useQuery({
    queryKey: ["importProfiles"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5001/api/import/profiles");
      if (!res.ok) throw new Error("Error al obtener perfiles");
      return res.json();
    },
  });

  useEffect(() => {
    if (!selectedProfile && profilesQuery.data) {
      const defaultProfile = profilesQuery.data.find((p: any) => p.name === "Default");
      if (defaultProfile) setSelectedProfile(defaultProfile.name);
    }
  }, [profilesQuery.data, selectedProfile]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Importar Partido - Paso 1</h1>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Selecciona un archivo (.xlsx, .csv, .json, .xml)</Label>
            <Input type="file" accept=".xlsx,.csv,.json,.xml" onChange={handleFileChange} />
            <Button onClick={handlePreview} disabled={!file}>Previsualizar</Button>
          </div>

          {error && <p className="text-red-500">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportMatch;
