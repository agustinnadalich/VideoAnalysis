
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AnalysisPage from "./pages/AnalysisPage";
import ImportMatch from "@/pages/ImportMatch";
import PreviewImport from "@/pages/PreviewImport";
import MatchesAdmin from "@/pages/MatchesAdmin";
import CreateProfile from "@/pages/CreateProfile";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
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
