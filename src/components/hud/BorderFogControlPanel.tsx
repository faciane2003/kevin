import React, { useEffect, useState } from "react";
import "./HUD.css";

type BorderFogSettings = {
  enabled: boolean;
  opacity: number;
  height: number;
  inset: number;
  fadeTop: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  color: string;
};

const DEFAULTS: BorderFogSettings = {
  enabled: true,
  opacity: 0.42,
  height: 258,
  inset: 0,
  fadeTop: 1,
  offsetX: -4,
  offsetY: -23,
  offsetZ: 0,
  color: "#0033ff",
};

const BorderFogControlPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<BorderFogSettings>(DEFAULTS);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f") setOpen((v) => !v);
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
    window.dispatchEvent(new CustomEvent("border-fog-settings", { detail: settings }));
  }, [settings]);

  if (!open) return null;

  const onChange = (key: keyof BorderFogSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const onToggle = (key: keyof BorderFogSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const onColorChange = (key: keyof BorderFogSettings, value: string) => {
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
        <span>Border Fog</span>
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
          ["height", "Height", 20, 320, 2],
          ["inset", "Inset", 0, 200, 2],
          ["fadeTop", "Top Fade", 0, 1, 0.02],
          ["offsetX", "Offset X", -200, 200, 1],
          ["offsetY", "Offset Y", -50, 100, 1],
          ["offsetZ", "Offset Z", -200, 200, 1],
        ] as Array<[keyof BorderFogSettings, string, number, number, number]>
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
      <div className="perf-panel-hint">Toggle: F</div>
    </div>
  );
};

export default BorderFogControlPanel;
