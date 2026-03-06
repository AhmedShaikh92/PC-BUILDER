import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import LandingPage from "./pages/LandingPage";
import BuildPage from "./pages/BuildPage";
import RecommendationPage from "./pages/RecommendationPage";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-dark ">
        <Navigation />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/build" element={<BuildPage />} />
          <Route path="/recommend" element={<RecommendationPage />} />
        </Routes>
      </div>
    </Router>
  );
}
