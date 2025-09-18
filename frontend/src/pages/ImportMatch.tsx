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
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const navigate = useNavigate();

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Si es un archivo XML y no hay perfil seleccionado, sugerir "Importacion XML"
      if (selectedFile.name.toLowerCase().endsWith('.xml') && !selectedProfile) {
        const xmlProfile = profilesQuery.data?.find((p: any) => p.name === "Importacion XML");
        if (xmlProfile) {
          setSelectedProfile(xmlProfile.name);
          // Mostrar mensaje informativo
          setError(null); // Limpiar errores previos
        }
      }
    }
  };

  const handlePreview = async () => {
    if (!file || !selectedProfile) {
      setError("Selecciona un archivo y un perfil válido");
      return;
    }

    // Limpiar errores previos
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
        console.log("Perfil seleccionado:", selectedProfile);
        console.log("Archivo:", file.name, "Tamaño:", file.size);

        const res = await fetch(`http://localhost:5001/api/import/preview?profile=${encodeURIComponent(selectedProfile)}`, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
          const errorMessage = errorData.error || "Error al previsualizar archivo";
          throw new Error(errorMessage);
        }

        const data = await res.json();
        console.log("Datos de preview:", data);

        // No pasar el archivo en el state, solo la información necesaria
        // Buscar el objeto completo del perfil
        const profileObject = profilesQuery.data?.find((p: any) => p.name === selectedProfile);
        
        navigate("/preview", {
          state: {
            previewData: data,
            fileName: file.name,
            fileSize: file.size,
            profile: profileObject
          }
        });
    } catch (err: any) {
      console.error("Error en preview:", err);
      setError(err.message || "Error al procesar el archivo");
    }
  };

  const handleFileUpload = async () => {
    if (!file || !selectedProfile) {
      setError("Selecciona un archivo y un perfil válido");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("profile", selectedProfile);

    try {
      const res = await fetch("http://localhost:5001/api/import/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir el archivo");

      alert("Archivo subido correctamente");
    } catch (err) {
      setError("Fallo al subir el archivo. Intenta nuevamente.");
    }
  };

  if (profilesQuery.isLoading) return <div>Cargando perfiles...</div>;
  if (profilesQuery.isError) return <div>Error al cargar perfiles.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Importar Partido</h1>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Selector de perfil */}
          <div>
            <Label>Seleccionar Perfil</Label>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Seleccionar un perfil...</option>
              {profilesQuery.data?.map((profile: any) => (
                <option key={profile.name} value={profile.name}>
                  {profile.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              {selectedProfile
                ? `Usando perfil: ${selectedProfile}`
                : "Por favor, selecciona un perfil para continuar."}
            </p>
          </div>

          {/* Subir archivo */}
          <div>
            <Label>Selecciona un archivo (.xlsx, .csv, .json, .xml)</Label>
            <Input type="file" accept=".xlsx,.csv,.json,.xml" onChange={handleFileChange} />
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <Button onClick={() => navigate("/create-profile")}>Crear Nuevo Perfil</Button>
            <Button onClick={handlePreview} disabled={!file || !selectedProfile}>
              Previsualizar
            </Button>
            <Button onClick={handleFileUpload} disabled={!file || !selectedProfile}>
              Subir Archivo
            </Button>
          </div>

          {/* Mensaje de error */}
          {error && <p className="text-red-500">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportMatch;
