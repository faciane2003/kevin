// File: src/components/hud/HUD.tsx
import React, { useEffect } from "react";
import { HUDProvider, useHUD } from "./HUDContext";
import StatsBars from "./StatsBars";
import MenuTabs from "./MenuTabs";
import "./HUD.css";

const HUDInner: React.FC = () => {
  const { setActiveTab, setActiveSlot } = useHUD();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "m") setActiveTab((t) => (t === "Map" ? null : "Map"));
      if (e.key === "i") setActiveTab((t) => (t === "Items" ? null : "Items"));
      if (/^[1-9]$/.test(e.key) || e.key === "0") {
        // keep numeric shortcuts available but do not show the HUD hotbar
        const idx = e.key === "0" ? 9 : parseInt(e.key, 10) - 1;
        setActiveSlot(idx);
        setTimeout(() => setActiveSlot(null), 200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setActiveTab, setActiveSlot]);

  return (
    <div className="hud-container" aria-hidden={false}>
      <StatsBars />
      <MenuTabs />
      {/* Hotbar removed from UI per request */}
    </div>
  );
};

const HUD: React.FC = () => (
  <HUDProvider>
    <HUDInner />
  </HUDProvider>
);

export default HUD;
