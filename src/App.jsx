import { Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage/WelcomePage";
import ConsolePage from "./pages/ConsolePage/ConsolePage";
import AnalysisPage from "./pages/AnalysisPage/AnalysisPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/console" element={<ConsolePage />} />
      <Route path="/analysis/:flightId" element={<AnalysisPage /> } />
    </Routes>
  );
}

export default App;