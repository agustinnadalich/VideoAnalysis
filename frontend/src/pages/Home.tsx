import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-2">VideoAnalysis</h1>
      <p className="text-center text-gray-600 mb-8">
        Plataforma integral de análisis de video deportivo
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Ver todos los partidos disponibles y acceder al análisis individual o multi-partido.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Ir al Dashboard
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Administrar Partidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Gestionar partidos existentes: editar información, eliminar registros.
            </p>
            <Button onClick={() => navigate("/admin/matches")} className="w-full">
              Administrar Partidos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Importar Partido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Subir nuevos archivos de datos (Excel, XML, JSON) y vincular con videos.
            </p>
            <Button onClick={() => navigate("/import")} className="w-full">
              Importar Partido
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crear Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Configurar perfiles de importación personalizados para diferentes fuentes de datos.
            </p>
            <Button onClick={() => navigate("/create-profile")} className="w-full">
              Crear Perfil
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Para empezar, importa un partido nuevo o explora los datos existentes desde el dashboard.
        </p>
      </div>
    </div>
  );
};

export default Home;
