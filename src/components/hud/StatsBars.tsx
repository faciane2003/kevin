// File: src/components/hud/StatsBars.tsx
import React from "react";
import "./HUD.css";

interface StatsBarsProps {
  health?: number;
  mana?: number;
  xp?: number;
}

const StatsBars: React.FC<StatsBarsProps> = ({
  health = 80,
  mana = 50,
  xp = 20,
}) => {
  return (
    <div className="stats-bars">
      <div className="bar health">
        <div className="fill" style={{ width: `${health}%` }} />
      </div>
      <div className="bar mana">
        <div className="fill" style={{ width: `${mana}%` }} />
      </div>
      <div className="bar xp">
        <div className="fill" style={{ width: `${xp}%` }} />
      </div>
    </div>
  );
};

export default StatsBars;
