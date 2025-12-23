// File: src/components/hud/HUD.tsx
import React from "react";
import "./HUD.css";

const HUD: React.FC = () => {
  return (
    <div className="hud-container">
      <div className="health-bar">Health</div>
      <div className="mana-bar">Mana</div>
      <div className="xp-bar">XP</div>
    </div>
  );
};

export default HUD;
