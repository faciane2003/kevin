// File: src/components/hud/HUD.tsx
import React from "react";
import "./HUD.css";
import StatsBars from "./StatsBars";
import Hotbar from "./Hotbar";
import MenuTabs from "./MenuTabs";

const HUD: React.FC = () => {
  return (
    <div className="hud-container">
      {/* Top-left menu tabs */}
      <MenuTabs />

      {/* Bottom-left hotbar */}
      <Hotbar />

      {/* Bottom-right player stats */}
      <StatsBars />
    </div>
  );
};

export default HUD;
