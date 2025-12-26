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
  lamp: number;
  amber: number;
  glow: number;
  fogEnabled: boolean;
  fogDensity: number;
  fogIntensity: number;
  fogHeightFalloff: number;
  fogColor: string;
  borderFogEnabled: boolean;
  borderFogOpacity: number;
  borderFogHeight: number;
  borderFogInset: number;
  borderFogFadeTop: number;
  borderFogOffsetX: number;
  borderFogOffsetY: number;
  borderFogOffsetZ: number;
  borderFogColor: string;
};

type BuildingSettings = {
  seed: number;
  count: number;
  scale: number;
};

type TopFogSettings = {
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

type SkySettings = {
  shootingStarsEnabled: boolean;
  shootingStarsCount: number;
};

type PerfSettings = {
  glow: boolean;
  postFx: boolean;
  collisions: boolean;
  windowFlicker: boolean;
  borderFog: boolean;
  gargoyles: boolean;
  shootingStars: boolean;
};

type StarSettings = {
  enabled: boolean;
  count: number;
  radius: number;
  minHeight: number;
  maxHeight: number;
  scale: number;
};

const DEFAULT_LIGHTS: LightSettings = {
  hemi: 0.3,
  ambient: 1.9,
  moon: 1.25,
  moonSpotIntensity: 2.8,
  moonSpotAngle: 1.18,
  moonSpotX: 1293,
  moonSpotY: 194,
  moonSpotZ: 1367,
  moonSpotYaw: -119,
  moonSpotPitch: 5,
  lamp: 1.3,
  amber: 0,
  glow: 0.85,
  fogEnabled: true,
  fogDensity: 0.0045,
  fogIntensity: 0.25,
  fogHeightFalloff: 0.005,
  fogColor: "#282f3e",
  borderFogEnabled: true,
  borderFogOpacity: 0.42,
  borderFogHeight: 50,
  borderFogInset: 26,
  borderFogFadeTop: 1,
  borderFogOffsetX: -4,
  borderFogOffsetY: -23,
  borderFogOffsetZ: 0,
  borderFogColor: "#1100ff",
};

const DEFAULT_BUILDINGS: BuildingSettings = {
  seed: 4864,
  count: 800,
  scale: 1.4,
};

const DEFAULT_TOP_FOG: TopFogSettings = {
  enabled: true,
  opacity: 0.08,
  height: 5,
  radius: 830,
  fadeTop: 1,
  offsetX: 14,
  offsetY: -4,
  offsetZ: 0,
  color: "#223366",
};

const DEFAULT_SKY: SkySettings = {
  shootingStarsEnabled: true,
  shootingStarsCount: 6,
};

const DEFAULT_PERF: PerfSettings = {
  glow: true,
  postFx: true,
  collisions: true,
  windowFlicker: true,
  borderFog: true,
  gargoyles: true,
  shootingStars: true,
};

const DEFAULT_GROUND_FOG: GroundFogSettings = {
  enabled: true,
  opacity: 0.08,
  height: 5,
  radius: 830,
  fadeTop: 1,
  offsetX: 14,
  offsetY: -4,
  offsetZ: 0,
  color: "#223366",
};

const DEFAULT_STARS: StarSettings = {
  enabled: true,
  count: 300,
  radius: 1080,
  minHeight: 170,
  maxHeight: 310,
  scale: 1,
};

const DebugPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [lights, setLights] = useState<LightSettings>(DEFAULT_LIGHTS);
  const [buildings, setBuildings] = useState<BuildingSettings>(DEFAULT_BUILDINGS);
  const [topFog, setTopFog] = useState<TopFogSettings>(DEFAULT_TOP_FOG);
  const [groundFog, setGroundFog] = useState<GroundFogSettings>(DEFAULT_GROUND_FOG);
  const [sky, setSky] = useState<SkySettings>(DEFAULT_SKY);
  const [perf, setPerf] = useState<PerfSettings>(DEFAULT_PERF);
  const [stars, setStars] = useState<StarSettings>(DEFAULT_STARS);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "g") setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("light-settings", { detail: lights }));
  }, [lights]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("building-settings", { detail: buildings }));
  }, [buildings]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("top-fog-settings", { detail: topFog }));
  }, [topFog]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("sky-effects-settings", { detail: sky }));
  }, [sky]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("performance-settings", { detail: perf }));
  }, [perf]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("star-settings", { detail: stars }));
  }, [stars]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("ground-fog-settings", { detail: groundFog }));
  }, [groundFog]);

  const copyAll = async () => {
    const payload = {
      lighting: lights,
      buildings,
      topFog,
      groundFog,
      sky,
      stars,
      performance: perf,
    };
    const text = JSON.stringify(payload, null, 2);
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

  if (!open) return null;

  return (
    <div className="debug-panel">
      <div className="debug-panel-header">
        <span>Debug Panel</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={copyAll}>Copy All</button>
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
      </div>

      <div className="debug-section">
        <div className="debug-section-title">Lighting</div>
        {(
          [
            ["hemi", "Hemi", 0, 3, 0.05],
            ["ambient", "Ambient", 0, 3, 0.05],
            ["moon", "Moon", 0, 3, 0.05],
            ["lamp", "Lamp", 0, 3, 0.05],
            ["amber", "Amber", 0, 3, 0.05],
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
              value={lights[key] as number}
              onChange={(e) =>
                setLights((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
              }
            />
            <span className="light-value">{(lights[key] as number).toFixed(2)}</span>
          </label>
        ))}
      </div>

      <div className="debug-section">
        <div className="debug-section-title">Moon Spotlight</div>
        {(
          [
            ["moonSpotIntensity", "Intensity", 0, 6, 0.05],
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
              value={lights[key] as number}
              onChange={(e) =>
                setLights((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
              }
            />
            <span className="light-value">{(lights[key] as number).toFixed(2)}</span>
          </label>
        ))}
      </div>

      <div className="debug-section">
        <div className="debug-section-title">Fog</div>
        <label className="light-row">
          <span>Enabled</span>
          <input
            type="checkbox"
            checked={lights.fogEnabled}
            onChange={(e) => setLights((prev) => ({ ...prev, fogEnabled: e.target.checked }))}
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
              value={lights[key] as number}
              onChange={(e) =>
                setLights((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
              }
            />
            <span className="light-value">{(lights[key] as number).toFixed(3)}</span>
          </label>
        ))}
        <label className="light-row">
          <span>Color</span>
          <input
            type="color"
            value={lights.fogColor}
            onChange={(e) => setLights((prev) => ({ ...prev, fogColor: e.target.value }))}
          />
        </label>
      </div>

      <div className="debug-section">
        <div className="debug-section-title">Border Fog</div>
        <label className="light-row">
          <span>Enabled</span>
          <input
            type="checkbox"
            checked={lights.borderFogEnabled}
            onChange={(e) =>
              setLights((prev) => ({ ...prev, borderFogEnabled: e.target.checked }))
            }
          />
        </label>
        {(
          [
            ["borderFogOpacity", "Opacity", 0, 1, 0.02],
            ["borderFogHeight", "Height", 10, 320, 2],
            ["borderFogInset", "Inset", 0, 200, 2],
            ["borderFogFadeTop", "Top Fade", 0, 1, 0.02],
            ["borderFogOffsetX", "Offset X", -200, 200, 1],
            ["borderFogOffsetY", "Offset Y", -50, 100, 1],
            ["borderFogOffsetZ", "Offset Z", -200, 200, 1],
          ] as Array<[keyof LightSettings, string, number, number, number]>
        ).map(([key, label, min, max, step]) => (
          <label key={key} className="light-row">
            <span>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={lights[key] as number}
              onChange={(e) =>
                setLights((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
              }
            />
            <span className="light-value">{(lights[key] as number).toFixed(2)}</span>
          </label>
        ))}
        <label className="light-row">
          <span>Color</span>
          <input
            type="color"
            value={lights.borderFogColor}
            onChange={(e) => setLights((prev) => ({ ...prev, borderFogColor: e.target.value }))}
          />
        </label>
      </div>

      <div className="debug-section">
        <div className="debug-section-title">Top Fog</div>
        <label className="light-row">
          <span>Enabled</span>
          <input
            type="checkbox"
            checked={topFog.enabled}
            onChange={(e) => setTopFog((prev) => ({ ...prev, enabled: e.target.checked }))}
          />
        </label>
        {(
          [
            ["opacity", "Opacity", 0, 1, 0.02],
            ["height", "Height", 2, 200, 1],
            ["radius", "Radius", 100, 1200, 10],
            ["fadeTop", "Top Fade", 0, 1, 0.02],
            ["offsetX", "Offset X", -300, 300, 1],
            ["offsetY", "Offset Y", -50, 150, 1],
            ["offsetZ", "Offset Z", -300, 300, 1],
          ] as Array<[keyof TopFogSettings, string, number, number, number]>
        ).map(([key, label, min, max, step]) => (
          <label key={key} className="light-row">
            <span>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={topFog[key] as number}
              onChange={(e) =>
                setTopFog((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
              }
            />
            <span className="light-value">{(topFog[key] as number).toFixed(2)}</span>
          </label>
        ))}
        <label className="light-row">
          <span>Color</span>
          <input
            type="color"
            value={topFog.color}
            onChange={(e) => setTopFog((prev) => ({ ...prev, color: e.target.value }))}
          />
        </label>
      </div>

      <div className="debug-section">
        <div className="debug-section-title">Stars</div>
        <label className="light-row">
          <span>Enabled</span>
          <input
            type="checkbox"
            checked={stars.enabled}
            onChange={(e) => setStars((prev) => ({ ...prev, enabled: e.target.checked }))}
          />
        </label>
        {(
          [
            ["count", "Count", 0, 300, 5],
            ["radius", "Radius", 200, 2000, 20],
            ["minHeight", "Min Y", 50, 400, 5],
            ["maxHeight", "Max Y", 80, 600, 5],
            ["scale", "Scale", 0.5, 4, 0.1],
          ] as Array<[keyof StarSettings, string, number, number, number]>
        ).map(([key, label, min, max, step]) => (
          <label key={key} className="light-row">
            <span>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={stars[key] as number}
              onChange={(e) =>
                setStars((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
              }
            />
            <span className="light-value">
              {key === "scale" ? (stars[key] as number).toFixed(2) : (stars[key] as number).toFixed(0)}
            </span>
          </label>
        ))}
      </div>

      <div className="debug-section">
        <div className="debug-section-title">Sky Effects</div>
        <label className="light-row">
          <span>Shooting Stars</span>
          <input
            type="checkbox"
            checked={sky.shootingStarsEnabled}
            onChange={(e) =>
              setSky((prev) => ({ ...prev, shootingStarsEnabled: e.target.checked }))
            }
          />
        </label>
        <label className="light-row">
          <span>Star Count</span>
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={sky.shootingStarsCount}
            onChange={(e) =>
              setSky((prev) => ({ ...prev, shootingStarsCount: parseInt(e.target.value, 10) }))
            }
          />
          <span className="light-value">{sky.shootingStarsCount}</span>
        </label>
      </div>

      <div className="debug-section">
        <div className="debug-section-title">Ground Fog</div>
        <label className="light-row">
          <span>Enabled</span>
          <input
            type="checkbox"
            checked={groundFog.enabled}
            onChange={(e) => setGroundFog((prev) => ({ ...prev, enabled: e.target.checked }))}
          />
        </label>
        {(
          [
            ["opacity", "Opacity", 0, 1, 0.02],
            ["height", "Height", 2, 200, 1],
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
              value={groundFog[key] as number}
              onChange={(e) =>
                setGroundFog((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
              }
            />
            <span className="light-value">{(groundFog[key] as number).toFixed(2)}</span>
          </label>
        ))}
        <label className="light-row">
          <span>Color</span>
          <input
            type="color"
            value={groundFog.color}
            onChange={(e) => setGroundFog((prev) => ({ ...prev, color: e.target.value }))}
          />
        </label>
      </div>

      <div className="debug-section">
        <div className="debug-section-title">Buildings</div>
        <label className="light-row">
          <span>Seed</span>
          <input
            type="range"
            min={1}
            max={9999}
            step={1}
            value={buildings.seed}
            onChange={(e) =>
              setBuildings((prev) => ({ ...prev, seed: parseInt(e.target.value, 10) }))
            }
          />
          <span className="light-value">{buildings.seed}</span>
        </label>
        <label className="light-row">
          <span>Count</span>
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={buildings.count}
            onChange={(e) =>
              setBuildings((prev) => ({ ...prev, count: parseInt(e.target.value, 10) }))
            }
          />
          <span className="light-value">{buildings.count}</span>
        </label>
        <label className="light-row">
          <span>Scale</span>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.05}
            value={buildings.scale}
            onChange={(e) =>
              setBuildings((prev) => ({ ...prev, scale: parseFloat(e.target.value) }))
            }
          />
          <span className="light-value">{buildings.scale.toFixed(2)}</span>
        </label>
      </div>

      <div className="debug-section">
        <div className="debug-section-title">Performance</div>
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
              checked={perf[key]}
              onChange={(e) =>
                setPerf((prev) => ({ ...prev, [key]: e.target.checked }))
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
};

export default DebugPanel;
