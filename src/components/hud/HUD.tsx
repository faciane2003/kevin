// File: src/components/hud/HUD.tsx
import React from "react";
import StatsBars from "./StatsBars";
import MenuTabs from "./MenuTabs";
import "./HUD.css";

const HUD: React.FC = () => {
  return (
    <div className="hud-container">
      {/* Stats bars at bottom right */}
      <StatsBars />

      {/* Menu tabs at bottom left */}
      <MenuTabs />
    </div>
  );
};

export default HUD;
