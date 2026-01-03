import React, { useEffect, useState } from "react";
import "./HUD.css";

type DebugDefaults = {
  lighting?: LightSettings;
  buildings?: BuildingSettings;
  fogSphere?: FogSphereSettings;
  stars?: StarSettings;
  shootingStars?: ShootingStarSettings;
  postFx?: PostFxSettings;
  assets?: AssetToggles;
  realism?: RealismSettings;
  atmosphereProps?: AtmospherePropsSettings;
  performance?: PerfSettings;
  cameraStart?: {
    pos: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  };
};

const DEBUG_DEFAULTS_KEY = "debug-defaults";

const loadStoredDefaults = (): DebugDefaults | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEBUG_DEFAULTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DebugDefaults;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveStoredDefaults = (payload: Record<string, unknown>) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEBUG_DEFAULTS_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures (private mode, quota, etc).
  }
};

type LightSettings = {
  hemi: number;
  ambient: number;
  moonlightEnabled: boolean;
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

type BuildingSettings = {
  seed: number;
  count: number;
  scale: number;
};

type PerfSettings = {
  glow: boolean;
  postFx: boolean;
  collisions: boolean;
  windowFlicker: boolean;
  gargoyles: boolean;
};

type StarSettings = {
  enabled: boolean;
  count: number;
  radius: number;
  minHeight: number;
  maxHeight: number;
  scale: number;
};

type ShootingStarSettings = {
  enabled: boolean;
  count: number;
  radius: number;
  minHeight: number;
  maxHeight: number;
  scale: number;
};

type FogSphereSettings = {
  enabled: boolean;
  opacity: number;
  blur: number;
  radius: number;
  fadeTop: number;
  fadeBottom: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  color: string;
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
  airplanes: boolean;
};

type RealismSettings = {
  aoDecals: boolean;
  puddles: boolean;
  lightCones: boolean;
  skyline: boolean;
  cameraBob: boolean;
  footstepZones: boolean;
  steamVents: boolean;
  movingShadows: boolean;
  debris: boolean;
  trafficLights: boolean;
  streetSigns: boolean;
  sirenSweep: boolean;
  banners: boolean;
  nightGrade: boolean;
  lod: boolean;
  vegetationSway: boolean;
  alleyFog: boolean;
};

type AtmospherePropsSettings = {
  enabled: boolean;
  count: number;
  seed: number;
  horror: boolean;
  action: boolean;
  thriller: boolean;
  dystopian: boolean;
  neon: boolean;
};

const DEFAULT_LIGHTS: LightSettings = {
  hemi: 0.85,
  ambient: 0.2,
  moonlightEnabled: false,
  moon: 2.5,
  moonSpotIntensity: 6,
  moonSpotAngle: 1.01,
  moonSpotX: 826,
  moonSpotY: 914,
  moonSpotZ: 279,
  moonSpotYaw: -103,
  moonSpotPitch: -33,
  glow: 0.4,
  fogEnabled: true,
  fogDensity: 0.002,
  fogIntensity: 0.6,
  fogHeightFalloff: 0.003,
  fogColor: "#202228",
};

const DEFAULT_BUILDINGS: BuildingSettings = {
  seed: 4864,
  count: 800,
  scale: 1.4,
};

const DEFAULT_PERF: PerfSettings = {
  glow: true,
  postFx: true,
  collisions: true,
  windowFlicker: true,
  gargoyles: true,
};

const DEFAULT_STARS: StarSettings = {
  enabled: true,
  count: 10,
  radius: 200,
  minHeight: 165,
  maxHeight: 440,
  scale: 0.8,
};

const DEFAULT_SHOOTING_STARS: ShootingStarSettings = {
  enabled: true,
  count: 4,
  radius: 800,
  minHeight: 260,
  maxHeight: 520,
  scale: 0.5,
};

const DEFAULT_FOG_SPHERE: FogSphereSettings = {
  enabled: true,
  opacity: 0.2,
  blur: 20,
  radius: 3000,
  fadeTop: 0.68,
  fadeBottom: 0,
  offsetX: 0,
  offsetY: -215,
  offsetZ: 0,
  color: "#6b758c",
};


const DEFAULT_POSTFX: PostFxSettings = {
  enabled: true,
  depthOfFieldEnabled: false,
  depthOfFieldFocusDistance: 10000,
  depthOfFieldFStop: 1,
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
  airplanes: true,
};

const DEFAULT_REALISM: RealismSettings = {
  aoDecals: true,
  puddles: true,
  lightCones: true,
  skyline: true,
  cameraBob: true,
  footstepZones: true,
  steamVents: true,
  movingShadows: true,
  debris: true,
  trafficLights: true,
  streetSigns: true,
  sirenSweep: true,
  banners: true,
  nightGrade: true,
  lod: true,
  vegetationSway: true,
  alleyFog: true,
};

const DEFAULT_ATMOSPHERE_PROPS: AtmospherePropsSettings = {
  enabled: true,
  count: 100,
  seed: 1337,
  horror: true,
  action: true,
  thriller: true,
  dystopian: true,
  neon: true,
};

const SECTION_KEYS = [
  "camera",
  "lighting",
  "moonSpotlight",
  "fog",
  "fogSphere",
  "stars",
  "shootingStars",
  "postFx",
  "buildings",
  "performance",
  "assets",
  "realism",
  "atmosphereProps",
  "rpgSystems",
] as const;

type SectionKey = typeof SECTION_KEYS[number];

const DebugPanel: React.FC = () => {
  const storedDefaults = loadStoredDefaults();
  const [open, setOpen] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [perfMaster, setPerfMaster] = useState(1);
  const [perfMasterLocked, setPerfMasterLocked] = useState(true);
  const [fps, setFps] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>(() => {
    const initial = {} as Record<SectionKey, boolean>;
    SECTION_KEYS.forEach((key) => {
      initial[key] = false;
    });
    return initial;
  });
  const [cameraInfo, setCameraInfo] = useState<{
    pos: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  } | null>(null);
  const [syncCameraStart, setSyncCameraStart] = useState(false);
  const [lights, setLights] = useState<LightSettings>(
    () => ({ ...DEFAULT_LIGHTS, ...(storedDefaults?.lighting ?? {}) })
  );
  const [buildings, setBuildings] = useState<BuildingSettings>(
    () => storedDefaults?.buildings ?? DEFAULT_BUILDINGS
  );
  const [perf, setPerf] = useState<PerfSettings>(() => {
    if (storedDefaults?.performance) return storedDefaults.performance;
    const isTouch =
      typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    if (!isTouch) return DEFAULT_PERF;
    return {
      glow: false,
      postFx: false,
      collisions: false,
      windowFlicker: false,
      gargoyles: false,
    };
  });
  const [stars, setStars] = useState<StarSettings>(() => storedDefaults?.stars ?? DEFAULT_STARS);
  const [shootingStars, setShootingStars] = useState<ShootingStarSettings>(
    () => storedDefaults?.shootingStars ?? DEFAULT_SHOOTING_STARS
  );
  const [fogSphere, setFogSphere] = useState<FogSphereSettings>(
    () => storedDefaults?.fogSphere ?? DEFAULT_FOG_SPHERE
  );
  const [postFx, setPostFx] = useState<PostFxSettings>(
    () => storedDefaults?.postFx ?? DEFAULT_POSTFX
  );
  const [assets, setAssets] = useState<AssetToggles>(
    () => storedDefaults?.assets ?? DEFAULT_ASSETS
  );
  const [realism, setRealism] = useState<RealismSettings>(
    () => storedDefaults?.realism ?? DEFAULT_REALISM
  );
  const [atmosphereProps, setAtmosphereProps] = useState<AtmospherePropsSettings>(
    () => storedDefaults?.atmosphereProps ?? DEFAULT_ATMOSPHERE_PROPS
  );
  const [rpgPanelOpen, setRpgPanelOpen] = useState(false);

  const setAllSections = (value: boolean) => {
    setExpandAll(value);
    setExpandedSections((prev) => {
      const next = { ...prev } as Record<SectionKey, boolean>;
      SECTION_KEYS.forEach((key) => {
        next[key] = value;
      });
      return next;
    });
  };

  const toggleSection = (key: SectionKey) => {
    setExpandedSections((prev) => {
      const next = { ...prev, [key]: !prev[key] } as Record<SectionKey, boolean>;
      const allExpanded = SECTION_KEYS.every((section) => next[section]);
      setExpandAll(allExpanded);
      return next;
    });
  };

  const renderSection = (key: SectionKey, title: string, children: React.ReactNode) => (
    <div className="debug-section">
      <button
        type="button"
        className="debug-section-title"
        onClick={() => toggleSection(key)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span>{title}</span>
        <span>{expandedSections[key] ? "v" : ">"}</span>
      </button>
      {expandedSections[key] ? <div>{children}</div> : null}
    </div>
  );

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
    window.dispatchEvent(new CustomEvent("performance-master", { detail: { value: perfMaster } }));
  }, [perfMaster]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let lastAdjust = 0;
    const tick = () => {
      frames += 1;
      const now = performance.now();
      if (now - last >= 1000) {
        const currentFps = Math.round((frames * 1000) / (now - last));
        setFps(currentFps);
        frames = 0;
        last = now;
        if (!perfMasterLocked && currentFps < 20 && now - lastAdjust > 900) {
          setPerfMaster((prev) => Math.max(0.1, parseFloat((prev - 0.05).toFixed(2))));
          lastAdjust = now;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [perfMasterLocked]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("building-settings", { detail: buildings }));
  }, [buildings]);


  useEffect(() => {
    window.dispatchEvent(new CustomEvent("performance-settings", { detail: perf }));
  }, [perf]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("star-settings", { detail: stars }));
  }, [stars]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("shooting-star-settings", { detail: shootingStars }));
  }, [shootingStars]);


  useEffect(() => {
    window.dispatchEvent(new CustomEvent("fog-sphere-settings", { detail: fogSphere }));
  }, [fogSphere]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("postfx-settings", { detail: postFx }));
  }, [postFx]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("asset-toggles", { detail: assets }));
  }, [assets]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("realism-settings", { detail: realism }));
  }, [realism]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("atmosphere-props-settings", { detail: atmosphereProps }));
  }, [atmosphereProps]);

  useEffect(() => {
    const onRpgState = (evt: Event) => {
      const detail = (evt as CustomEvent<{ open?: boolean }>).detail;
      setRpgPanelOpen(!!detail?.open);
    };
    window.addEventListener("rpg-panel-state", onRpgState as EventListener);
    return () => window.removeEventListener("rpg-panel-state", onRpgState as EventListener);
  }, []);

  const copyAll = async () => {
    const payload: Record<string, unknown> = {
      lighting: lights,
      buildings,
      fogSphere,
      stars,
      shootingStars,
      postFx,
      assets,
      realism,
      atmosphereProps,
      performance: perf,
    };
    saveStoredDefaults(payload);
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

  const exportGlb = () => {
    window.dispatchEvent(new CustomEvent("export-glb"));
  };

  if (!open) return null;

  return (
    <div className="debug-panel">
      <div className="debug-panel-header">
        <span>Debug Panel</span>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
          <input
            type="checkbox"
            checked={expandAll}
            onChange={(e) => setAllSections(e.target.checked)}
          />
          <span>Expand</span>
        </label>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={exportGlb}>Export GLB</button>
          <button onClick={copyAll}>Copy All</button>
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
      </div>

      <div className="debug-panel-master">
        <label className="light-row">
          <span>Performance Master</span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={perfMaster}
            onChange={(e) => setPerfMaster(parseFloat(e.target.value))}
            disabled={perfMasterLocked}
          />
          <span className="light-value">{perfMaster.toFixed(2)}</span>
        </label>
        <label className="light-row" style={{ marginTop: "4px" }}>
          <span>Lock</span>
          <input
            type="checkbox"
            checked={perfMasterLocked}
            onChange={(e) => setPerfMasterLocked(e.target.checked)}
          />
        </label>
        <div className="debug-panel-fps">FPS: {fps}</div>
      </div>

      <div className="debug-panel-grid">
      {renderSection(
        "camera",
        "Camera",
        <>
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
        </>
      )}

      {renderSection(
        "lighting",
        "Lighting",
        <>
          <label className="light-row">
            <span>Moonlight</span>
            <input
              type="checkbox"
              checked={lights.moonlightEnabled}
              onChange={(e) =>
                setLights((prev) => ({ ...prev, moonlightEnabled: e.target.checked }))
              }
            />
          </label>
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
        </>
      )}

      {renderSection(
        "moonSpotlight",
        "Moon Spotlight",
        <>
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
        </>
      )}

      {renderSection(
        "fog",
        "Fog",
        <>
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
        </>
      )}

      {renderSection(
        "fogSphere",
        "Fog Sphere",
        <>
          <label className="light-row">
            <span>Enabled</span>
            <input
              type="checkbox"
              checked={fogSphere.enabled}
              onChange={(e) => setFogSphere((prev) => ({ ...prev, enabled: e.target.checked }))}
            />
          </label>
          {(
            [
              ["opacity", "Opacity", 0, 0.2, 0.005],
              ["blur", "Blur", 0, 20, 1],
              ["radius", "Radius", 200, 3000, 50],
              ["fadeTop", "Fade Top", 0, 1, 0.02],
              ["fadeBottom", "Fade Bottom", 0, 1, 0.02],
              ["offsetX", "Offset X", -2000, 2000, 5],
              ["offsetY", "Offset Y", -2000, 2000, 5],
              ["offsetZ", "Offset Z", -2000, 2000, 5],
            ] as Array<[keyof FogSphereSettings, string, number, number, number]>
          ).map(([key, label, min, max, step]) => (
            <label key={key} className="light-row">
              <span>{label}</span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={fogSphere[key] as number}
                onChange={(e) =>
                  setFogSphere((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
                }
              />
              <span className="light-value">{(fogSphere[key] as number).toFixed(2)}</span>
            </label>
          ))}
          <label className="light-row">
            <span>Color</span>
            <input
              type="color"
              value={fogSphere.color}
              onChange={(e) => setFogSphere((prev) => ({ ...prev, color: e.target.value }))}
            />
          </label>
        </>
      )}

      {renderSection(
        "stars",
        "Stars",
        <>
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
                {key === "scale"
                  ? (stars[key] as number).toFixed(2)
                  : (stars[key] as number).toFixed(0)}
              </span>
            </label>
          ))}
        </>
      )}

      {renderSection(
        "shootingStars",
        "Shooting Stars",
        <>
          <label className="light-row">
            <span>Enabled</span>
            <input
              type="checkbox"
              checked={shootingStars.enabled}
              onChange={(e) =>
                setShootingStars((prev) => ({ ...prev, enabled: e.target.checked }))
              }
            />
          </label>
          {(
            [
              ["count", "Count", 0, 30, 1],
              ["radius", "Radius", 200, 2000, 50],
              ["minHeight", "Min Y", 50, 800, 10],
              ["maxHeight", "Max Y", 80, 1200, 10],
              ["scale", "Scale", 0.1, 5, 0.1],
            ] as Array<[keyof ShootingStarSettings, string, number, number, number]>
          ).map(([key, label, min, max, step]) => (
            <label key={key} className="light-row">
              <span>{label}</span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={shootingStars[key] as number}
                onChange={(e) =>
                  setShootingStars((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
                }
              />
              <span className="light-value">{(shootingStars[key] as number).toFixed(2)}</span>
            </label>
          ))}
        </>
      )}


      {renderSection(
        "postFx",
        "Post FX",
        <>
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
        </>
      )}

      {renderSection(
        "buildings",
        "Buildings",
        <>
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
        </>
      )}

      {renderSection(
        "performance",
        "Performance",
        <>
          {(
            [
              ["glow", "Glow Layer"],
              ["postFx", "Post FX Pipeline"],
              ["collisions", "Collisions"],
              ["windowFlicker", "Window Flicker"],
              ["gargoyles", "Gargoyles"],
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
        </>
      )}

      {renderSection(
        "assets",
        "Assets",
        <>
          {(
            [
              ["glowSculptures", "Glow Sculptures"],
              ["cats", "Cats"],
              ["neonBillboards", "Neon Billboards"],
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
        </>
      )}

      {renderSection(
        "realism",
        "Realism Extras",
        <>
          {(
            [
              ["aoDecals", "AO Decals"],
              ["puddles", "Puddles"],
              ["lightCones", "Light Cones"],
              ["skyline", "Skyline Backdrop"],
              ["cameraBob", "Camera Bob"],
              ["footstepZones", "Footstep Zones"],
              ["steamVents", "Steam Vents"],
              ["movingShadows", "Moving Shadows"],
              ["debris", "Debris Scatter"],
              ["trafficLights", "Traffic Lights"],
              ["streetSigns", "Street Signs"],
              ["sirenSweep", "Siren Sweep"],
              ["banners", "Banners"],
              ["nightGrade", "Night Color Grade"],
              ["lod", "LOD Manager"],
              ["vegetationSway", "Vegetation Sway"],
              ["alleyFog", "Alley Fog"],
            ] as Array<[keyof RealismSettings, string]>
          ).map(([key, label]) => (
            <label key={key} className="light-row">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={realism[key]}
                onChange={(e) => setRealism((prev) => ({ ...prev, [key]: e.target.checked }))}
              />
            </label>
          ))}
        </>
      )}

      {renderSection(
        "atmosphereProps",
        "Atmosphere Props",
        <>
          <label className="light-row">
            <span>Enabled</span>
            <input
              type="checkbox"
              checked={atmosphereProps.enabled}
              onChange={(e) =>
                setAtmosphereProps((prev) => ({ ...prev, enabled: e.target.checked }))
              }
            />
          </label>
          <label className="light-row">
            <span>Count</span>
            <input
              type="range"
              min={0}
              max={300}
              step={5}
              value={atmosphereProps.count}
              onChange={(e) =>
                setAtmosphereProps((prev) => ({
                  ...prev,
                  count: parseInt(e.target.value, 10),
                }))
              }
            />
            <span className="light-value">{atmosphereProps.count}</span>
          </label>
          <label className="light-row">
            <span>Seed</span>
            <input
              type="range"
              min={1}
              max={9999}
              step={1}
              value={atmosphereProps.seed}
              onChange={(e) =>
                setAtmosphereProps((prev) => ({
                  ...prev,
                  seed: parseInt(e.target.value, 10),
                }))
              }
            />
            <span className="light-value">{atmosphereProps.seed}</span>
          </label>
          {(
            [
              ["horror", "Horror"],
              ["action", "Action"],
              ["thriller", "Thriller"],
              ["dystopian", "Dystopian"],
              ["neon", "Neon"],
            ] as Array<[keyof AtmospherePropsSettings, string]>
          ).map(([key, label]) => (
            <label key={key} className="light-row">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={atmosphereProps[key] as boolean}
                onChange={(e) =>
                  setAtmosphereProps((prev) => ({ ...prev, [key]: e.target.checked }))
                }
              />
            </label>
          ))}
        </>
      )}

      {renderSection(
        "rpgSystems",
        "RPG Systems",
        <>
          <label className="light-row">
            <span>Panel</span>
            <input
              type="checkbox"
              checked={rpgPanelOpen}
              onChange={(e) => {
                const next = e.target.checked;
                setRpgPanelOpen(next);
                window.dispatchEvent(new CustomEvent("rpg-panel", { detail: { open: next } }));
              }}
            />
          </label>
          <div className="light-row">
            <button onClick={() => window.dispatchEvent(new CustomEvent("rpg-panel"))}>
              Toggle Panel
            </button>
          </div>
          <div className="light-row">
            <span>Systems loaded</span>
            <span className="light-value">23</span>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default DebugPanel;

