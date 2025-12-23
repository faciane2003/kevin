// File: src/App.tsx
import React from "react";
import BabylonWorld from "./world/BabylonWorld";
import HUD from "./components/hud/HUD";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <BabylonWorld />
      <HUD />
    </div>
  );
}

export default App;
