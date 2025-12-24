// File: src/components/hud/StatsBars.tsx
import React from "react";
import "./HUD.css";
import { useHUD } from "./HUDContext";
import Compass from "./Compass";

const StatBar: React.FC<{ label: string; value: number; colorClass: string }> = ({ label, value, colorClass }) => {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`stat-bar ${colorClass}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span className="stat-label">{label} — {Math.round(pct)}%</span>
      <div className="bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
};

const StatsBars: React.FC = () => {
  const { health, mana, xp } = useHUD();
  return (
    <div className="stats-bars">
      <Compass />
      <StatBar label="Health" value={health} colorClass="health" />
      <StatBar label="Mana" value={mana} colorClass="mana" />
      <StatBar label="XP" value={xp} colorClass="xp" />
    </div>
  );
};

export default StatsBars;
