import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
// import DashboardPage from "./pages/DashboardPage";
import VideoAnalysisPage from "./pages/VideoAnalysisPage";
import MultiMatchReportPage from "./pages/MultiMatchReportPage";


const App = () => {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<DashboardPage />} /> */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/video-analysis/:id" element={<VideoAnalysisPage />} />
        <Route path="/multi-match-report" element={<MultiMatchReportPage />} />

      </Routes>
    </Router>
  );
};

export default App;