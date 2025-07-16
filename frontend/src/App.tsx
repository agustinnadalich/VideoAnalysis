
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home"; // si tenés
import AnalysisPage from "./pages/AnalysisPage";
import ImportMatch from "@/pages/ImportMatch"; // ajusta el path si es diferente
import PreviewImport from "@/pages/PreviewImport"; // ajusta el path si es diferente
import MatchesAdmin from "@/pages/MatchesAdmin"; // ajusta el path si es diferente
import CreateProfile from "@/pages/CreateProfile"; // ajusta el path si es diferente


function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analysis/:matchId" element={<AnalysisPage />} />
        <Route path="/match/:matchId" element={<AnalysisPage />} />
        <Route path="/admin/matches" element={<MatchesAdmin />} />
        <Route path="/import" element={<ImportMatch />} />
        <Route path="/preview" element={<PreviewImport />} />
        <Route path="/create-profile" element={<CreateProfile />} />
      </Routes>
  );
}

export default App;
