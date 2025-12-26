import React, { useEffect, useState } from "react";
import "./HUD.css";

type RainSettings = {
  enabled: boolean;
  intensity: number;
  speed: number;
  dropSize: number;
  opacity: number;
  windX: number;
  windZ: number;
  height: number;
  radius: number;
};

const DEFAULTS: RainSettings = {
  enabled: false,
  intensity: 2200,
  speed: 50,
  dropSize: 0.2,
  opacity: 0.6,
  windX: 4,
  windZ: -2,
  height: 200,
  radius: 520,
};

const RainControlPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<RainSettings>(DEFAULTS);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("rain-settings", { detail: settings }));
  }, [settings]);

  if (!open) return null;

  const onChange = (key: keyof RainSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const onToggle = (key: keyof RainSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="light-panel" style={{ right: 300, top: 20 }}>
      <div className="light-panel-header">
        <span>Rain</span>
        <button onClick={() => setOpen(false)}>Close</button>
      </div>
      <label className="light-row">
        <span>Enabled</span>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onToggle("enabled", e.target.checked)}
        />
      </label>
      {(
        [
          ["intensity", "Drops", 200, 8000, 50],
          ["speed", "Speed", 5, 140, 1],
          ["dropSize", "Size", 0.05, 0.8, 0.01],
          ["opacity", "Opacity", 0.1, 1, 0.02],
          ["windX", "Wind X", -30, 30, 0.5],
          ["windZ", "Wind Z", -30, 30, 0.5],
          ["height", "Height", 40, 400, 2],
          ["radius", "Radius", 60, 1200, 10],
        ] as Array<[keyof RainSettings, string, number, number, number]>
      ).map(([key, label, min, max, step]) => (
        <label key={key} className="light-row">
          <span>{label}</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={settings[key] as number}
            onChange={(e) => onChange(key, parseFloat(e.target.value))}
          />
          <span className="light-value">{(settings[key] as number).toFixed(2)}</span>
        </label>
      ))}
    </div>
  );
};

export default RainControlPanel;
