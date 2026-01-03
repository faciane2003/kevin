// File: src/App.tsx
import BabylonWorld from "./worlds/BabylonWorld";
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
