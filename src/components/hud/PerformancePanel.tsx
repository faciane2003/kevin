import React, { useEffect, useState } from "react";
import "./HUD.css";

type PerfSettings = {
  glow: boolean;
  postFx: boolean;
  collisions: boolean;
  windowFlicker: boolean;
  borderFog: boolean;
  gargoyles: boolean;
  shootingStars: boolean;
};

const DEFAULTS: PerfSettings = {
  glow: true,
  postFx: true,
  collisions: true,
  windowFlicker: true,
  borderFog: true,
  gargoyles: true,
  shootingStars: true,
};

const PerformancePanel: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [settings, setSettings] = useState<PerfSettings>(DEFAULTS);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "o") setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDebug = (e: Event) => {
      const detail = (e as CustomEvent<{ open?: boolean }>).detail;
      if (detail?.open) setOpen(true);
    };
    window.addEventListener("debug-panels", onDebug as EventListener);
    return () => window.removeEventListener("debug-panels", onDebug as EventListener);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("performance-settings", { detail: settings }));
  }, [settings]);

  if (!open) return null;

  const onToggle = (key: keyof PerfSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="perf-panel">
      <div className="light-panel-header">
        <span>Performance</span>
        <button onClick={() => setOpen(false)}>Close</button>
      </div>
        {(
          [
            ["glow", "Glow Layer"],
            ["postFx", "Post FX Pipeline"],
            ["collisions", "Collisions"],
            ["windowFlicker", "Window Flicker"],
            ["borderFog", "Border Fog"],
            ["gargoyles", "Gargoyles"],
            ["shootingStars", "Shooting Stars"],
          ] as Array<[keyof PerfSettings, string]>
      ).map(([key, label]) => (
        <label key={key} className="light-row">
          <span>{label}</span>
          <input
            type="checkbox"
            checked={settings[key]}
            onChange={(e) => onToggle(key, e.target.checked)}
          />
        </label>
      ))}
      <div className="perf-panel-hint">Toggle: O</div>
    </div>
  );
};

export default PerformancePanel;
