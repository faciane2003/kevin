// File: src/worlds/BabylonWorld.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Scene, UniversalCamera, Vector3, GlowLayer, StandardMaterial, Color3 } from "@babylonjs/core";
import WorldSounds from "../components/sounds/WorldSounds";
import BuildingWindowFlicker from "../components/world/BuildingWindowFlicker";
import GargoyleStatues from "../components/world/GargoyleStatues";
import TreeField from "../components/world/TreeField";
import CityStars from "../components/world/CityStars";
import ShootingStars from "../components/world/ShootingStars";
import FogSphere from "../components/world/FogSphere";
import { AtmosphereProps } from "../components/world/AtmosphereProps";
import WorldSceneController from "../components/world/WorldSceneController";
import {
  AlleyFog,
  AlleyRumble,
  AmbientOcclusionDecals,
  Banners,
  CameraBob,
  DebrisScatter,
  FootstepZones,
  LightCones,
  LODManager,
  MovingShadows,
  NightColorGrade,
  PuddleDecals,
  SirenSweep,
  SkylineBackdrop,
  SteamVents,
  StreetSigns,
  TrafficLights,
  VegetationSway,
} from "../components/world/RealismExtras";
import type { BuildingInfo } from "./types";

const BabylonWorld: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isTouchDevice =
    typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  const [sceneInstance, setSceneInstance] = useState<Scene | null>(null);
  const [buildingMaterials, setBuildingMaterials] = useState<StandardMaterial[]>([]);
  const [buildingInfos, setBuildingInfos] = useState<BuildingInfo[]>([]);
  const buildingInfosRef = useRef<BuildingInfo[]>([]);
  const fogOpacityRef = useRef(1);
  const [perfSettings, setPerfSettings] = useState(() =>
    isTouchDevice
      ? {
          glow: false,
          postFx: false,
          collisions: false,
          windowFlicker: false,
          gargoyles: false,
        }
      : {
          glow: true,
          postFx: true,
          collisions: true,
          windowFlicker: true,
          gargoyles: true,
        }
  );
  const [starSettings, setStarSettings] = useState({
    enabled: true,
    count: 55,
    radius: 200,
    minHeight: 165,
    maxHeight: 440,
    scale: 0.8,
  });
  const [shootingStarSettings, setShootingStarSettings] = useState({
    enabled: true,
    count: 4,
    radius: 800,
    minHeight: 260,
    maxHeight: 520,
    scale: 0.5,
  });
  const [fogSphereSettings, setFogSphereSettings] = useState(() => ({
    enabled: true,
    opacity: 0.2,
    blur: 20,
    radius: 3000,
    fadeTop: 0.68,
    fadeBottom: 0,
    offsetX: 0,
    offsetY: -215,
    offsetZ: 0,
    color: new Color3(0.42, 0.46, 0.55),
  }));
  const [assetToggles, setAssetToggles] = useState({
    glowSculptures: true,
    cats: true,
    neonBillboards: true,
    clouds: true,
    airplanes: true,
  });
  const [atmosphereProps, setAtmosphereProps] = useState({
    enabled: true,
    count: 100,
    seed: 1337,
    horror: true,
    action: true,
    thriller: true,
    dystopian: true,
    neon: true,
  });
  const [realismSettings, setRealismSettings] = useState({
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
    alleyRumble: false,
    lod: true,
    vegetationSway: true,
    alleyFog: true,
  });
  const [perfMaster, setPerfMaster] = useState(1);
  const cameraRef = useRef<UniversalCamera | null>(null);
  const [walkInputActive, setWalkInputActive] = useState(false);
  const walkInputActiveRef = useRef(false);
  const [postFxSettings, setPostFxSettings] = useState({
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
  });
  const [, setCloudMaskSettings] = useState({});
  const effectivePerfSettings = useMemo(
    () => ({
      glow: perfSettings.glow && perfMaster >= 0.2,
      postFx: perfSettings.postFx && perfMaster >= 0.35,
      collisions: perfSettings.collisions && perfMaster >= 0.5,
      windowFlicker: perfSettings.windowFlicker && perfMaster >= 0.7,
      gargoyles: perfSettings.gargoyles && perfMaster >= 0.85,
    }),
    [perfSettings, perfMaster]
  );
  const [treePositions, setTreePositions] = useState<Vector3[]>([]);
  const treePositionsRef = useRef<Vector3[]>([]);
  const glowLayerRef = useRef<GlowLayer | null>(null);
  const assetTogglesRef = useRef(assetToggles);
  const signPositions = useMemo(() => [new Vector3(-120, 0, 20), new Vector3(180, 0, 10)], []);
  const zRoads = useMemo(() => [-260, -180, -100, -20, 60, 140, 220, 300], []);
  const xRoads = useMemo(() => [-300, -220, -140, -60, 20, 100, 180, 260], []);
  useEffect(() => {
    treePositionsRef.current = treePositions;
  }, [treePositions]);

  useEffect(() => {
    assetTogglesRef.current = assetToggles;
  }, [assetToggles]);

  useEffect(() => {
    const onPerfMaster = (event: Event) => {
      const detail = (event as CustomEvent<{ value?: number }>).detail;
      if (typeof detail?.value === "number") {
        setPerfMaster(Math.max(0.1, Math.min(1, detail.value)));
      }
    };
    window.addEventListener("performance-master", onPerfMaster as EventListener);
    return () => window.removeEventListener("performance-master", onPerfMaster as EventListener);
  }, []);

  useEffect(() => {
    const onStarSettings = (event: Event) => {
      const detail = (event as CustomEvent<typeof starSettings>).detail;
      if (!detail) return;
      setStarSettings((prev) => ({ ...prev, ...detail }));
    };
    window.addEventListener("star-settings", onStarSettings as EventListener);
    return () => window.removeEventListener("star-settings", onStarSettings as EventListener);
  }, []);

  useEffect(() => {
    const onShootingStarSettings = (event: Event) => {
      const detail = (event as CustomEvent<typeof shootingStarSettings>).detail;
      if (!detail) return;
      setShootingStarSettings((prev) => ({ ...prev, ...detail }));
    };
    window.addEventListener("shooting-star-settings", onShootingStarSettings as EventListener);
    return () =>
      window.removeEventListener("shooting-star-settings", onShootingStarSettings as EventListener);
  }, []);

  useEffect(() => {
    const onFogSphere = (event: Event) => {
      const detail = (event as CustomEvent<{
        enabled?: boolean;
        opacity?: number;
        blur?: number;
        radius?: number;
        fadeTop?: number;
        fadeBottom?: number;
        offsetX?: number;
        offsetY?: number;
        offsetZ?: number;
        color?: string;
      }>).detail;
      if (!detail) return;
      setFogSphereSettings((prev) => ({
        ...prev,
        ...detail,
        color: detail.color ? Color3.FromHexString(detail.color) : prev.color,
      }));
    };
    window.addEventListener("fog-sphere-settings", onFogSphere as EventListener);
    return () => window.removeEventListener("fog-sphere-settings", onFogSphere as EventListener);
  }, []);


  useEffect(() => {
    if (!isTouchDevice) return;
    const stages: Array<keyof typeof perfSettings> = [
      "windowFlicker",
      "gargoyles",
      "collisions",
      "glow",
      "postFx",
    ];
    let index = 0;
    const timer = window.setInterval(() => {
      if (index >= stages.length) {
        window.clearInterval(timer);
        return;
      }
      const key = stages[index];
      index += 1;
      setPerfSettings((prev) => ({ ...prev, [key]: true }));
      window.dispatchEvent(new CustomEvent("performance-settings", { detail: { [key]: true } }));
    }, 3000);
    return () => window.clearInterval(timer);
  }, [isTouchDevice]);

  useEffect(() => {
    const buildings = buildingInfos.map((info) => ({
      x: info.mesh.position.x,
      z: info.mesh.position.z,
      width: info.width,
      depth: info.depth,
    }));
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;
    buildings.forEach((b) => {
      minX = Math.min(minX, b.x - b.width / 2);
      maxX = Math.max(maxX, b.x + b.width / 2);
      minZ = Math.min(minZ, b.z - b.depth / 2);
      maxZ = Math.max(maxZ, b.z + b.depth / 2);
    });
    signPositions.forEach((pos) => {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minZ = Math.min(minZ, pos.z);
      maxZ = Math.max(maxZ, pos.z);
    });
    zRoads.forEach((z) => {
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    });
    xRoads.forEach((x) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    });
    if (!Number.isFinite(minX)) {
      minX = -500;
      maxX = 500;
      minZ = -500;
      maxZ = 500;
    }
    window.dispatchEvent(
      new CustomEvent("minimap-data", {
        detail: {
          buildings,
          roads: { x: xRoads, z: zRoads },
          signs: signPositions.map((pos) => ({ x: pos.x, z: pos.z })),
          bounds: { minX, maxX, minZ, maxZ },
        },
      })
    );
  }, [buildingInfos, signPositions, xRoads, zRoads]);


  return (
    <>
      <WorldSceneController
        canvasRef={canvasRef}
        isTouchDevice={isTouchDevice}
        setSceneInstance={setSceneInstance}
        setBuildingMaterials={setBuildingMaterials}
        setBuildingInfos={setBuildingInfos}
        buildingInfosRef={buildingInfosRef}
        setTreePositions={setTreePositions}
        treePositionsRef={treePositionsRef}
        setWalkInputActive={setWalkInputActive}
        walkInputActiveRef={walkInputActiveRef}
        setPerfSettings={setPerfSettings}
        
        setPostFxSettings={setPostFxSettings}
        setAssetToggles={setAssetToggles}
        setAtmosphereProps={setAtmosphereProps}
        setRealismSettings={setRealismSettings}
        setStarSettings={setStarSettings}
        setShootingStarSettings={setShootingStarSettings}
        perfSettings={effectivePerfSettings}
        postFxSettings={postFxSettings}
        fogOpacityRef={fogOpacityRef}
        assetTogglesRef={assetTogglesRef}
        cameraRef={cameraRef}
        glowLayerRef={glowLayerRef}
        signPositions={signPositions}
        zRoads={zRoads}
        xRoads={xRoads}
      />
      <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }} />
      <WorldSounds scene={sceneInstance} />
      {effectivePerfSettings.windowFlicker ? (
        <BuildingWindowFlicker
          scene={sceneInstance}
          materials={buildingMaterials}
          intervalMs={8000}
          flickerPercent={0.05}
          stepMs={2000}
          offDurationMs={10000}
        />
      ) : null}
      <FogSphere scene={sceneInstance} settings={fogSphereSettings} />
      {starSettings.enabled ? (
        <CityStars
          scene={sceneInstance}
          glowLayer={glowLayerRef.current}
          count={starSettings.count}
          radius={starSettings.radius}
          minHeight={starSettings.minHeight}
          maxHeight={starSettings.maxHeight}
          scale={starSettings.scale}
        />
      ) : null}
      {shootingStarSettings.enabled ? (
        <ShootingStars
          scene={sceneInstance}
          enabled={shootingStarSettings.enabled}
          count={shootingStarSettings.count}
          radius={shootingStarSettings.radius}
          minHeight={shootingStarSettings.minHeight}
          maxHeight={shootingStarSettings.maxHeight}
          scale={shootingStarSettings.scale}
        />
      ) : null}
      {starSettings.enabled ? (
        <CityStars
          scene={sceneInstance}
          glowLayer={glowLayerRef.current}
          count={starSettings.count}
          radius={starSettings.radius}
          minHeight={starSettings.minHeight}
          maxHeight={starSettings.maxHeight}
          scale={starSettings.scale}
          rotationY={Math.PI / 2}
        />
      ) : null}
      {effectivePerfSettings.gargoyles ? (
        <GargoyleStatues scene={sceneInstance} buildings={buildingInfos} />
      ) : null}
      <TreeField scene={sceneInstance} buildings={buildingInfos} signPositions={signPositions} />
      <AmbientOcclusionDecals
        scene={sceneInstance}
        enabled={realismSettings.aoDecals}
        buildings={buildingInfos.map((b) => ({ mesh: b.mesh, width: b.width, depth: b.depth }))}
      />
      <PuddleDecals scene={sceneInstance} enabled={realismSettings.puddles} />
      <LightCones scene={sceneInstance} enabled={realismSettings.lightCones} />
      <SkylineBackdrop scene={sceneInstance} enabled={realismSettings.skyline} />
      <CameraBob
        scene={sceneInstance}
        camera={cameraRef.current}
        enabled={realismSettings.cameraBob && walkInputActive}
      />
      <FootstepZones
        scene={sceneInstance}
        camera={cameraRef.current}
        enabled={realismSettings.footstepZones}
      />
      <SteamVents scene={sceneInstance} enabled={realismSettings.steamVents} />
      <MovingShadows scene={sceneInstance} enabled={realismSettings.movingShadows} />
      <DebrisScatter scene={sceneInstance} enabled={realismSettings.debris} />
      <TrafficLights scene={sceneInstance} enabled={realismSettings.trafficLights} />
      <StreetSigns scene={sceneInstance} enabled={realismSettings.streetSigns} />
      <SirenSweep scene={sceneInstance} enabled={realismSettings.sirenSweep} />
      <Banners scene={sceneInstance} enabled={realismSettings.banners} />
      <NightColorGrade scene={sceneInstance} enabled={realismSettings.nightGrade} />
      <AlleyRumble enabled={realismSettings.alleyRumble} />
      <LODManager scene={sceneInstance} enabled={realismSettings.lod} />
      <VegetationSway
        scene={sceneInstance}
        enabled={realismSettings.vegetationSway}
        amount={0.09}
      />
      <AlleyFog scene={sceneInstance} enabled={realismSettings.alleyFog} />
      <AtmosphereProps scene={sceneInstance} settings={atmosphereProps} />
    </>
  );
};

export default BabylonWorld;



