// File: src/App.tsx
import { useEffect, useState } from "react";
import BabylonWorld from "./worlds/BabylonWorld";
import FellowshipWorld from "./worlds/FellowshipWorld";
import HUD from "./components/hud/HUD";
import "./App.css";

function App() {
  const [activeWorld, setActiveWorld] = useState<"babylon" | "fellowship">("babylon");

  useEffect(() => {
    const onWorldSwitch = (event: Event) => {
      const detail = (event as CustomEvent<{ world?: string }>).detail;
      if (detail?.world === "babylon" || detail?.world === "fellowship") {
        try { document.exitPointerLock?.(); } catch {}
        setActiveWorld(detail.world);
      }
    };
    window.addEventListener("world-switch", onWorldSwitch as EventListener);
    return () => window.removeEventListener("world-switch", onWorldSwitch as EventListener);
  }, []);

  return (
    <div className="app-container">
      {activeWorld === "babylon" ? <BabylonWorld /> : <FellowshipWorld />}
      {activeWorld === "babylon" ? <HUD /> : null}
    </div>
  );
}

export default App;
