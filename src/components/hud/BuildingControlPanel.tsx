import React, { useEffect, useState } from "react";
import "./HUD.css";

type BuildingSettings = {
  seed: number;
  count: number;
  scale: number;
};

const DEFAULTS: BuildingSettings = {
  seed: 4864,
  count: 800,
  scale: 1.4,
};

const BuildingControlPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<BuildingSettings>(DEFAULTS);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b") setOpen((v) => !v);
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
    window.dispatchEvent(new CustomEvent("building-settings", { detail: settings }));
  }, [settings]);

  if (!open) return null;

  const onChange = (key: keyof BuildingSettings, value: number) => {
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
        <span>Buildings</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={copySettings}>Copy</button>
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
      </div>
      <label className="light-row">
        <span>Seed</span>
        <input
          type="range"
          min={1}
          max={9999}
          step={1}
          value={settings.seed}
          onChange={(e) => onChange("seed", parseInt(e.target.value, 10))}
        />
        <span className="light-value">{settings.seed}</span>
      </label>
      <label className="light-row">
        <span>Count</span>
        <input
          type="range"
          min={100}
          max={2000}
          step={50}
          value={settings.count}
          onChange={(e) => onChange("count", parseInt(e.target.value, 10))}
        />
        <span className="light-value">{settings.count}</span>
      </label>
      <label className="light-row">
        <span>Scale</span>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.05}
          value={settings.scale}
          onChange={(e) => onChange("scale", parseFloat(e.target.value))}
        />
        <span className="light-value">{settings.scale.toFixed(2)}</span>
      </label>
      <div className="perf-panel-hint">Toggle: B</div>
    </div>
  );
};

export default BuildingControlPanel;
