import React, { useEffect, useState } from "react";
import "./HUD.css";

type LightSettings = {
  hemi: number;
  ambient: number;
  neonA: number;
  neonB: number;
  moon: number;
  glow: number;
};

const DEFAULTS: LightSettings = {
  hemi: 0,
  ambient: 0.45,
  neonA: 1.7,
  neonB: 1.1,
  moon: 0.85,
  glow: 0.15,
};

const LightControlPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<LightSettings>(DEFAULTS);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "l") setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("light-settings", { detail: settings }));
  }, [settings]);

  if (!open) return null;

  const onChange = (key: keyof LightSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="light-panel">
      <div className="light-panel-header">
        <span>Lighting</span>
        <button onClick={() => setOpen(false)}>Close</button>
      </div>
      {(
        [
          ["hemi", "Hemi"],
          ["ambient", "Ambient"],
          ["neonA", "Neon A"],
          ["neonB", "Neon B"],
          ["moon", "Moon"],
          ["glow", "Glow"],
        ] as Array<[keyof LightSettings, string]>
      ).map(([key, label]) => (
        <label key={key} className="light-row">
          <span>{label}</span>
          <input
            type="range"
            min="0"
            max={key === "glow" ? "2" : "2.5"}
            step="0.05"
            value={settings[key]}
            onChange={(e) => onChange(key, parseFloat(e.target.value))}
          />
          <span className="light-value">{settings[key].toFixed(2)}</span>
        </label>
      ))}
    </div>
  );
};

export default LightControlPanel;
