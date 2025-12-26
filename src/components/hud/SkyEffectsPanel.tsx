import React, { useEffect, useState } from "react";
import "./HUD.css";

type SkySettings = {
  shootingStarsEnabled: boolean;
  shootingStarsCount: number;
};

const DEFAULTS: SkySettings = {
  shootingStarsEnabled: true,
  shootingStarsCount: 6,
};

const SkyEffectsPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<SkySettings>(DEFAULTS);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k") setOpen((v) => !v);
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
    window.dispatchEvent(new CustomEvent("sky-effects-settings", { detail: settings }));
  }, [settings]);

  if (!open) return null;

  const onToggle = (key: keyof SkySettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const onChange = (key: keyof SkySettings, value: number) => {
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
        <span>Sky Effects</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={copySettings}>Copy</button>
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
      </div>
      <label className="light-row">
        <span>Shooting Stars</span>
        <input
          type="checkbox"
          checked={settings.shootingStarsEnabled}
          onChange={(e) => onToggle("shootingStarsEnabled", e.target.checked)}
        />
      </label>
      <label className="light-row">
        <span>Star Count</span>
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={settings.shootingStarsCount}
          onChange={(e) => onChange("shootingStarsCount", parseInt(e.target.value, 10))}
        />
        <span className="light-value">{settings.shootingStarsCount}</span>
      </label>
      <div className="perf-panel-hint">Toggle: K</div>
    </div>
  );
};

export default SkyEffectsPanel;
