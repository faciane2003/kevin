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
  blur: number;
  height: number;
  radius: number;
  fadeTop: number;
  timeScale: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  color: string;
};

type MiddleFogSettings = {
  enabled: boolean;
  opacity: number;
  blur: number;
  height: number;
  radius: number;
  fadeTop: number;
  timeScale: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  color: string;
};

type BottomFogSettings = {
  enabled: boolean;
  opacity: number;
  blur: number;
  height: number;
  radius: number;
  fadeTop: number;
  timeScale: number;
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

type CloudMaskSettings = {
  scale: number;
  scaleX: number;
  scaleY: number;
  feather: number;
  invert: boolean;
  lockScale: boolean;
};

type PostFxSettings = {
  enabled: boolean;
  depthOfFieldEnabled: boolean;
  depthOfFieldFocusDistance: number;
  depthOfFieldFStop: number;
  depthOfFieldBlurLevel: number;
  colorGradingEnabled: boolean;
  globalHue: number;
  globalDensity: number;
  globalSaturation: number;
  globalExposure: number;
  highlightsHue: number;
  highlightsDensity: number;
  highlightsSaturation: number;
  shadowsHue: number;
  shadowsDensity: number;
  shadowsSaturation: number;
};

type AssetToggles = {
  glowSculptures: boolean;
  cats: boolean;
  neonBillboards: boolean;
  clouds: boolean;
  airplanes: boolean;
};

const DEFAULT_LIGHTS: LightSettings = {
  hemi: 0.6,
  ambient: 2.65,
  moon: 1.4,
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
  borderFogEnabled: true,
  borderFogOpacity: 0.78,
  borderFogHeight: 274,
  borderFogInset: 26,
  borderFogFadeTop: 1,
  borderFogOffsetX: -6,
  borderFogOffsetY: -16,
  borderFogOffsetZ: 0,
  borderFogColor: "#110f33",
};

const DEFAULT_BUILDINGS: BuildingSettings = {
  seed: 4864,
  count: 800,
  scale: 1.4,
};

const DEFAULT_TOP_FOG: TopFogSettings = {
  enabled: true,
  opacity: 0.02,
  blur: 2,
  height: 164,
  radius: 1200,
  fadeTop: 0.94,
  timeScale: 0.1,
  offsetX: 48,
  offsetY: 150,
  offsetZ: 300,
  color: "#8782c9",
};

const DEFAULT_SKY: SkySettings = {
  shootingStarsEnabled: true,
  shootingStarsCount: 9,
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

const DEFAULT_MIDDLE_FOG: MiddleFogSettings = {
  enabled: true,
  opacity: 0.02,
  blur: 7,
  height: 74,
  radius: 1200,
  fadeTop: 1,
  timeScale: 0.1,
  offsetX: 48,
  offsetY: -16,
  offsetZ: -1,
  color: "#8782c9",
};

const DEFAULT_BOTTOM_FOG: BottomFogSettings = {
  enabled: true,
  opacity: 0.14,
  blur: 8,
  height: 19,
  radius: 1200,
  fadeTop: 1,
  timeScale: 0.1,
  offsetX: 48,
  offsetY: -16,
  offsetZ: -1,
  color: "#8782c9",
};

const DEFAULT_STARS: StarSettings = {
  enabled: true,
  count: 55,
  radius: 200,
  minHeight: 165,
  maxHeight: 440,
  scale: 0.8,
};

const DEFAULT_CLOUD_MASK: CloudMaskSettings = {
  scale: 0.55,
  scaleX: 0.8,
  scaleY: 0.7,
  feather: 0.98,
  invert: false,
  lockScale: false,
};

const DEFAULT_POSTFX: PostFxSettings = {
  enabled: true,
  depthOfFieldEnabled: false,
  depthOfFieldFocusDistance: 10250,
  depthOfFieldFStop: 2,
  depthOfFieldBlurLevel: 2,
  colorGradingEnabled: true,
  globalHue: 41,
  globalDensity: 46,
  globalSaturation: 49,
  globalExposure: 29,
  highlightsHue: 211,
  highlightsDensity: 52,
  highlightsSaturation: 38,
  shadowsHue: 227,
  shadowsDensity: 44,
  shadowsSaturation: 20,
};

const DEFAULT_ASSETS: AssetToggles = {
  glowSculptures: true,
  cats: true,
  neonBillboards: true,
  clouds: false,
  airplanes: true,
};

const DebugPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [cameraInfo, setCameraInfo] = useState<{
    pos: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  } | null>(null);
  const [syncCameraStart, setSyncCameraStart] = useState(false);
  const [lights, setLights] = useState<LightSettings>(DEFAULT_LIGHTS);
  const [buildings, setBuildings] = useState<BuildingSettings>(DEFAULT_BUILDINGS);
  const [topFog, setTopFog] = useState<TopFogSettings>(DEFAULT_TOP_FOG);
  const [middleFog, setMiddleFog] = useState<MiddleFogSettings>(DEFAULT_MIDDLE_FOG);
  const [bottomFog, setBottomFog] = useState<BottomFogSettings>(DEFAULT_BOTTOM_FOG);
  const [sky, setSky] = useState<SkySettings>(DEFAULT_SKY);
  const [perf, setPerf] = useState<PerfSettings>(DEFAULT_PERF);
  const [stars, setStars] = useState<StarSettings>(DEFAULT_STARS);
  const [cloudMask, setCloudMask] = useState<CloudMaskSettings>(DEFAULT_CLOUD_MASK);
  const [postFx, setPostFx] = useState<PostFxSettings>(DEFAULT_POSTFX);
  const [assets, setAssets] = useState<AssetToggles>(DEFAULT_ASSETS);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "g") setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onCamera = (e: Event) => {
      const detail = (e as CustomEvent<{
        pos: { x: number; y: number; z: number };
        target: { x: number; y: number; z: number };
      }>).detail;
      if (detail?.pos && detail?.target) setCameraInfo(detail);
    };
    window.addEventListener("camera-info", onCamera as EventListener);
    return () => window.removeEventListener("camera-info", onCamera as EventListener);
  }, []);

  useEffect(() => {
    if (!syncCameraStart || !cameraInfo) return;
    window.dispatchEvent(new CustomEvent("camera-start-update", { detail: cameraInfo }));
  }, [syncCameraStart, cameraInfo]);

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
    window.dispatchEvent(new CustomEvent("middle-fog-settings", { detail: middleFog }));
  }, [middleFog]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("bottom-fog-settings", { detail: bottomFog }));
  }, [bottomFog]);

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
    window.dispatchEvent(new CustomEvent("cloud-settings", { detail: cloudMask }));
  }, [cloudMask]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("postfx-settings", { detail: postFx }));
  }, [postFx]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("asset-toggles", { detail: assets }));
  }, [assets]);

  const copyAll = async () => {
    const payload: Record<string, unknown> = {
      lighting: lights,
      buildings,
      topFog,
      middleFog,
      bottomFog,
      sky,
      stars,
      cloudMask,
      postFx,
      assets,
      performance: perf,
    };
    if (syncCameraStart && cameraInfo) {
      payload.cameraStart = cameraInfo;
    }
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

  const copyCamera = async () => {
    if (!cameraInfo) return;
    const text = JSON.stringify(cameraInfo, null, 2);
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
        <div className="debug-section-title">Camera</div>
        <div className="light-row" style={{ justifyContent: "space-between" }}>
          <span>Position</span>
          <span className="light-value">
            {cameraInfo
              ? `${cameraInfo.pos.x.toFixed(2)}, ${cameraInfo.pos.y.toFixed(2)}, ${cameraInfo.pos.z.toFixed(2)}`
              : "-"}
          </span>
        </div>
        <div className="light-row" style={{ justifyContent: "space-between" }}>
          <span>Target</span>
          <span className="light-value">
            {cameraInfo
              ? `${cameraInfo.target.x.toFixed(2)}, ${cameraInfo.target.y.toFixed(2)}, ${cameraInfo.target.z.toFixed(2)}`
              : "-"}
          </span>
        </div>
        <label className="light-row">
          <span>Set Start</span>
          <input
            type="checkbox"
            checked={syncCameraStart}
            onChange={(e) => setSyncCameraStart(e.target.checked)}
          />
        </label>
        <button onClick={copyCamera} style={{ marginTop: "6px" }}>Copy Camera</button>
      </div>

      <div className="debug-section">
        <div className="debug-section-title">Lighting</div>
        {(
          [
            ["hemi", "Hemi", 0, 3, 0.05],
            ["ambient", "Ambient", 0, 3, 0.05],
            ["moon", "Moon", 0, 3, 0.05],
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
            ["blur", "Blur", 0, 16, 0.5],
            ["height", "Height", 2, 200, 1],
            ["radius", "Radius", 100, 1200, 10],
            ["fadeTop", "Top Fade", 0, 1, 0.02],
            ["timeScale", "Timing", 0.1, 3, 0.05],
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
        <div className="debug-section-title">Cloud Mask</div>
        {(
          [
            ["scale", "Scale", 0.2, 3, 0.05],
            ["scaleX", "Scale X", 0.2, 3, 0.05],
            ["scaleY", "Scale Y", 0.2, 3, 0.05],
            ["feather", "Feather", 0, 0.98, 0.02],
          ] as Array<[keyof CloudMaskSettings, string, number, number, number]>
        ).map(([key, label, min, max, step]) => (
          <label key={key} className="light-row">
            <span>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={cloudMask[key] as number}
              onChange={(e) =>
                setCloudMask((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
              }
            />
            <span className="light-value">{(cloudMask[key] as number).toFixed(2)}</span>
          </label>
        ))}
        <label className="light-row">
          <span>Invert</span>
          <input
            type="checkbox"
            checked={cloudMask.invert}
            onChange={(e) => setCloudMask((prev) => ({ ...prev, invert: e.target.checked }))}
          />
        </label>
        <label className="light-row">
          <span>Lock Ratio</span>
          <input
            type="checkbox"
            checked={cloudMask.lockScale}
            onChange={(e) => setCloudMask((prev) => ({ ...prev, lockScale: e.target.checked }))}
          />
        </label>
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
        <div className="debug-section-title">Middle Fog</div>
        <label className="light-row">
          <span>Enabled</span>
          <input
            type="checkbox"
            checked={middleFog.enabled}
            onChange={(e) => setMiddleFog((prev) => ({ ...prev, enabled: e.target.checked }))}
          />
        </label>
        {(
          [
            ["opacity", "Opacity", 0, 1, 0.02],
            ["blur", "Blur", 0, 16, 0.5],
            ["height", "Height", 2, 200, 1],
            ["radius", "Radius", 100, 1200, 10],
            ["fadeTop", "Top Fade", 0, 1, 0.02],
            ["timeScale", "Timing", 0.1, 3, 0.05],
            ["offsetX", "Offset X", -300, 300, 1],
            ["offsetY", "Offset Y", -50, 150, 1],
            ["offsetZ", "Offset Z", -300, 300, 1],
          ] as Array<[keyof MiddleFogSettings, string, number, number, number]>
        ).map(([key, label, min, max, step]) => (
          <label key={key} className="light-row">
            <span>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={middleFog[key] as number}
              onChange={(e) =>
                setMiddleFog((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
              }
            />
            <span className="light-value">{(middleFog[key] as number).toFixed(2)}</span>
          </label>
        ))}
        <label className="light-row">
          <span>Color</span>
          <input
            type="color"
            value={middleFog.color}
            onChange={(e) => setMiddleFog((prev) => ({ ...prev, color: e.target.value }))}
          />
        </label>
      </div>

      <div className="debug-section">
        <div className="debug-section-title">Post FX</div>
        <label className="light-row">
          <span>Enabled</span>
          <input
            type="checkbox"
            checked={postFx.enabled}
            onChange={(e) => setPostFx((prev) => ({ ...prev, enabled: e.target.checked }))}
          />
        </label>
        <label className="light-row">
          <span>Depth of Field</span>
          <input
            type="checkbox"
            checked={postFx.depthOfFieldEnabled}
            onChange={(e) =>
              setPostFx((prev) => ({ ...prev, depthOfFieldEnabled: e.target.checked }))
            }
          />
        </label>
        {(
          [
            ["depthOfFieldFocusDistance", "DOF Focus", 1000, 25000, 250],
            ["depthOfFieldFStop", "DOF F-Stop", 1, 12, 0.1],
            ["depthOfFieldBlurLevel", "DOF Blur", 0, 3, 1],
          ] as Array<[keyof PostFxSettings, string, number, number, number]>
        ).map(([key, label, min, max, step]) => (
          <label key={key} className="light-row">
            <span>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={postFx[key] as number}
              onChange={(e) =>
                setPostFx((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
              }
            />
            <span className="light-value">{(postFx[key] as number).toFixed(2)}</span>
          </label>
        ))}
        <label className="light-row">
          <span>Color Grading</span>
          <input
            type="checkbox"
            checked={postFx.colorGradingEnabled}
            onChange={(e) =>
              setPostFx((prev) => ({ ...prev, colorGradingEnabled: e.target.checked }))
            }
          />
        </label>
        {(
          [
            ["globalHue", "Hue", 0, 360, 1],
            ["globalDensity", "Density", 0, 100, 1],
            ["globalSaturation", "Saturation", 0, 100, 1],
            ["globalExposure", "Exposure", -50, 50, 1],
            ["highlightsHue", "Highlights Hue", 0, 360, 1],
            ["highlightsDensity", "Highlights Density", 0, 100, 1],
            ["highlightsSaturation", "Highlights Sat", 0, 100, 1],
            ["shadowsHue", "Shadows Hue", 0, 360, 1],
            ["shadowsDensity", "Shadows Density", 0, 100, 1],
            ["shadowsSaturation", "Shadows Sat", 0, 100, 1],
          ] as Array<[keyof PostFxSettings, string, number, number, number]>
        ).map(([key, label, min, max, step]) => (
          <label key={key} className="light-row">
            <span>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={postFx[key] as number}
              onChange={(e) =>
                setPostFx((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
              }
            />
            <span className="light-value">{(postFx[key] as number).toFixed(0)}</span>
          </label>
        ))}
      </div>

      <div className="debug-section">
        <div className="debug-section-title">Bottom Fog</div>
        <label className="light-row">
          <span>Enabled</span>
          <input
            type="checkbox"
            checked={bottomFog.enabled}
            onChange={(e) => setBottomFog((prev) => ({ ...prev, enabled: e.target.checked }))}
          />
        </label>
        {(
          [
            ["opacity", "Opacity", 0, 1, 0.02],
            ["blur", "Blur", 0, 16, 0.5],
            ["height", "Height", 2, 200, 1],
            ["radius", "Radius", 100, 1200, 10],
            ["fadeTop", "Top Fade", 0, 1, 0.02],
            ["timeScale", "Timing", 0.1, 3, 0.05],
            ["offsetX", "Offset X", -300, 300, 1],
            ["offsetY", "Offset Y", -50, 150, 1],
            ["offsetZ", "Offset Z", -300, 300, 1],
          ] as Array<[keyof BottomFogSettings, string, number, number, number]>
        ).map(([key, label, min, max, step]) => (
          <label key={key} className="light-row">
            <span>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={bottomFog[key] as number}
              onChange={(e) =>
                setBottomFog((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
              }
            />
            <span className="light-value">{(bottomFog[key] as number).toFixed(2)}</span>
          </label>
        ))}
        <label className="light-row">
          <span>Color</span>
          <input
            type="color"
            value={bottomFog.color}
            onChange={(e) => setBottomFog((prev) => ({ ...prev, color: e.target.value }))}
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

      <div className="debug-section">
        <div className="debug-section-title">Assets</div>
        {(
          [
            ["glowSculptures", "Glow Sculptures"],
            ["cats", "Cats"],
            ["neonBillboards", "Neon Billboards"],
            ["clouds", "Clouds"],
            ["airplanes", "Airplanes"],
          ] as Array<[keyof AssetToggles, string]>
        ).map(([key, label]) => (
          <label key={key} className="light-row">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={assets[key]}
              onChange={(e) => setAssets((prev) => ({ ...prev, [key]: e.target.checked }))}
            />
          </label>
        ))}
      </div>
    </div>
  );
};

export default DebugPanel;

