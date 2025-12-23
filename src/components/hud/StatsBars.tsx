// File: src/components/hud/StatsBars.tsx
import React from "react";
import "./HUD.css";

const StatsBars: React.FC = () => {
  return (
    <div className="stats-bars">
      <div className="stat-bar health">
        <span className="stat-label">Health</span>
        <div className="bar-fill" style={{ width: "70%" }}></div>
      </div>
      <div className="stat-bar mana">
        <span className="stat-label">Mana</span>
        <div className="bar-fill" style={{ width: "50%" }}></div>
      </div>
      <div className="stat-bar xp">
        <span className="stat-label">XP</span>
        <div className="bar-fill" style={{ width: "30%" }}></div>
      </div>
    </div>
  );
};

export default StatsBars;
