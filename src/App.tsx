// File: src/App.tsx
import { useEffect, useState } from "react";
import BabylonWorld from "./worlds/BabylonWorld";
import FellowshipWorld from "./worlds/FellowshipWorld";
import HUD from "./components/hud/HUD";
import "./App.css";

function App() {
  const [activeWorld, setActiveWorld] = useState<"babylon" | "fellowship">("babylon");
  const [transitionVisible, setTransitionVisible] = useState(false);
  const [transitionFading, setTransitionFading] = useState(false);

  useEffect(() => {
    const onWorldSwitch = (event: Event) => {
      const detail = (event as CustomEvent<{ world?: string }>).detail;
      if (detail?.world === "babylon" || detail?.world === "fellowship") {
        try { document.exitPointerLock?.(); } catch {}
        if (detail.world === "babylon") {
          setTransitionVisible(true);
          setTransitionFading(false);
        } else {
          setTransitionVisible(false);
          setTransitionFading(false);
        }
        setActiveWorld(detail.world);
      }
    };
    window.addEventListener("world-switch", onWorldSwitch as EventListener);
    return () => window.removeEventListener("world-switch", onWorldSwitch as EventListener);
  }, []);

  useEffect(() => {
    const onWorldReady = (event: Event) => {
      const detail = (event as CustomEvent<{ world?: string }>).detail;
      if (detail?.world !== "babylon") return;
      if (!transitionVisible) return;
      setTransitionFading(true);
      window.setTimeout(() => {
        setTransitionVisible(false);
        setTransitionFading(false);
      }, 1400);
    };
    window.addEventListener("world-ready", onWorldReady as EventListener);
    return () => window.removeEventListener("world-ready", onWorldReady as EventListener);
  }, [transitionVisible]);

  return (
    <div className="app-container">
      {activeWorld === "babylon" ? <BabylonWorld /> : <FellowshipWorld />}
      <HUD />
      {transitionVisible ? (
        <div className={`world-transition ${transitionFading ? "fade-out" : ""}`}>
          Exiting the building...
        </div>
      ) : null}
    </div>
  );
}

export default App;
