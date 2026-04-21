import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Quiz from "@/pages/Quiz";
import Results from "@/pages/Results";
import History from "@/pages/History";
import Admin from "@/pages/Admin";
import { applyTheme, getInitialTheme } from "@/lib/theme";

function App() {
  useEffect(() => {
    applyTheme(getInitialTheme());
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quiz/:code" element={<Quiz />} />
          <Route path="/results" element={<Results />} />
          <Route path="/history" element={<History />} />
          <Route path="/admin-u7k2" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
