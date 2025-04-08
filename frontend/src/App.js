import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import VideoAnalysisPage from "./pages/VideoAnalysisPage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/video-analysis/:id" element={<VideoAnalysisPage />} />
      </Routes>
    </Router>
  );
};

export default App;