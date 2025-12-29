import React, { useEffect, useState } from "react";
import "./HUD.css";

type LightSettings = {
  hemi: number;
  ambient: number;
  moon: number;
  moonSpotIntensity: number;
  moonSpotAngle: number;
  moonSpotX: number;
  moonSpotY: number;
  moonSpotZ: number;
  moonSpotYaw: number;
  moonSpotPitch: number;
  glow: number;
  fogEnabled: boolean;
  fogDensity: number;
  fogIntensity: number;
  fogHeightFalloff: number;
  fogColor: string;
};

const DEFAULTS: LightSettings = {
  hemi: 0.75,
  ambient: 1.2,
  moon: 1.3,
  moonSpotIntensity: 5,
  moonSpotAngle: 1.32,
  moonSpotX: 340,
  moonSpotY: 717,
  moonSpotZ: -130,
  moonSpotYaw: -93,
  moonSpotPitch: -47,
  glow: 0.7,
  fogEnabled: true,
  fogDensity: 0.0045,
  fogIntensity: 0.2,
  fogHeightFalloff: 0.001,
  fogColor: "#282f3e",
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
    const onDebug = (e: Event) => {
      const detail = (e as CustomEvent<{ open?: boolean }>).detail;
      if (detail?.open) setOpen(true);
    };
    window.addEventListener("debug-panels", onDebug as EventListener);
    return () => window.removeEventListener("debug-panels", onDebug as EventListener);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("light-settings", { detail: settings }));
  }, [settings]);

  if (!open) return null;

  const onChange = (key: keyof LightSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const onToggle = (key: keyof LightSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const onColorChange = (key: keyof LightSettings, value: string) => {
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
        <span>Lighting</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={copySettings}>Copy</button>
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
      </div>
      {(
        [
          ["hemi", "Hemi", 0, 2.5, 0.05],
          ["ambient", "Ambient", 0, 2.5, 0.05],
          ["moon", "Moon", 0, 2.5, 0.05],
          ["glow", "Glow", 0, 2, 0.05],
        ] as Array<[keyof LightSettings, string, number, number, number]>
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

      <div className="light-panel-header" style={{ marginTop: 8 }}>
        <span>Moon Spotlight</span>
      </div>
      {(
        [
          ["moonSpotIntensity", "Intensity", 0, 5, 0.05],
          ["moonSpotAngle", "Angle", 0.1, 1.6, 0.01],
          ["moonSpotX", "Pos X", -2000, 2000, 1],
          ["moonSpotY", "Pos Y", 0, 2000, 1],
          ["moonSpotZ", "Pos Z", -2000, 2000, 1],
          ["moonSpotYaw", "Yaw", -180, 180, 1],
          ["moonSpotPitch", "Pitch", -89, 89, 1],
        ] as Array<[keyof LightSettings, string, number, number, number]>
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

      <div className="light-panel-header" style={{ marginTop: 8 }}>
        <span>Fog</span>
      </div>
      <label className="light-row">
        <span>Enabled</span>
        <input
          type="checkbox"
          checked={settings.fogEnabled}
          onChange={(e) => onToggle("fogEnabled", e.target.checked)}
        />
      </label>
      {(
        [
          ["fogDensity", "Density", 0, 0.08, 0.0005],
          ["fogIntensity", "Intensity", 0, 3, 0.05],
          ["fogHeightFalloff", "Height", 0, 0.02, 0.0005],
        ] as Array<[keyof LightSettings, string, number, number, number]>
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
          <span className="light-value">{(settings[key] as number).toFixed(3)}</span>
        </label>
      ))}
      <label className="light-row">
        <span>Color</span>
        <input
          type="color"
          value={settings.fogColor}
          onChange={(e) => onColorChange("fogColor", e.target.value)}
        />
      </label>

    </div>
  );
};

export default LightControlPanel;
