import React from "react";
import HUD from "./components/hud/HUD";
import BabylonWorld from "./world/BabylonWorld";
import "./App.css"; // Make sure this import points to the CSS file

const App: React.FC = () => {
  return (
    <div className="app-container">
      <BabylonWorld />
      <HUD />
    </div>
  );
};

export default App;
