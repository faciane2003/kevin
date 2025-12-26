import React, { useEffect, useState } from "react";
import "./HUD.css";

type GroundFogSettings = {
  enabled: boolean;
  opacity: number;
  height: number;
  radius: number;
  fadeTop: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  color: string;
};

const DEFAULTS: GroundFogSettings = {
  enabled: true,
  opacity: 0.04,
  height: 5,
  radius: 440,
  fadeTop: 1,
  offsetX: 14,
  offsetY: -4,
  offsetZ: 0,
  color: "#223366",
};

const GroundFogControlPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<GroundFogSettings>(DEFAULTS);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "u") setOpen((v) => !v);
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
    window.dispatchEvent(new CustomEvent("ground-fog-settings", { detail: settings }));
  }, [settings]);

  if (!open) return null;

  const onToggle = (key: keyof GroundFogSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const onChange = (key: keyof GroundFogSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const onColorChange = (key: keyof GroundFogSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const copySettings = async () => {
    const text = JSON.stringify(settings, null, 2);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  return (
    <div className="light-panel">
      <div className="light-panel-header">
        <span>Ground Fog</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={copySettings}>Copy</button>
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
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
          ["opacity", "Opacity", 0, 1, 0.02],
          ["height", "Height", 5, 200, 1],
          ["radius", "Radius", 100, 1200, 10],
          ["fadeTop", "Top Fade", 0, 1, 0.02],
          ["offsetX", "Offset X", -300, 300, 1],
          ["offsetY", "Offset Y", -50, 150, 1],
          ["offsetZ", "Offset Z", -300, 300, 1],
        ] as Array<[keyof GroundFogSettings, string, number, number, number]>
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
      <label className="light-row">
        <span>Color</span>
        <input
          type="color"
          value={settings.color}
          onChange={(e) => onColorChange("color", e.target.value)}
        />
      </label>
      <div className="perf-panel-hint">Toggle: U</div>
    </div>
  );
};

export default GroundFogControlPanel;
