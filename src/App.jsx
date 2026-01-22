import { Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage/WelcomePage";
import ConsolePage from "./pages/ConsolePage/ConsolePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/console" element={<ConsolePage />} />
    </Routes>
  );
}

export default App;