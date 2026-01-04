// File: src/worlds/BabylonWorld.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionManager,
  Color3,
  Color4,
  DynamicTexture,
  ExecuteCodeAction,
  GlowLayer,
  Mesh,
  MeshBuilder,
  ParticleSystem,
  PointerEventTypes,
  Scene,
  SpotLight,
  StandardMaterial,
  TransformNode,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
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
  AlleyRumble,
  AmbientOcclusionDecals,
  Banners,
  CameraBob,
  DebrisScatter,
  LightCones,
  LODManager,
  MovingShadows,
  NightColorGrade,
  PuddleDecals,
  SirenSweep,
  SkylineBackdrop,
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
    count: 2,
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

  useEffect(() => {
    if (!sceneInstance) return;
    if (!buildingInfos.length) return;
    const door = MeshBuilder.CreateBox(
      "fellowshipDoor",
      { width: 4, height: 6, depth: 0.3 },
      sceneInstance
    );
    const doorAnchor = new Vector3(-363.5620353494066, 0, 153.52140253706548);
    const nearestBuilding = buildingInfos.reduce((best, info) => {
      const dx = info.mesh.position.x - doorAnchor.x;
      const dz = info.mesh.position.z - doorAnchor.z;
      const dist = dx * dx + dz * dz;
      if (!best || dist < best.dist) {
        return { info, dist };
      }
      return best;
    }, null as null | { info: BuildingInfo; dist: number });
    const building = nearestBuilding?.info;
      let doorForward = new Vector3(0, 0, 1);
      if (building) {
        const yaw = building.mesh.rotation.y;
        const forward = new Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      const right = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
      const faceCandidates = [
        { center: building.mesh.position.add(forward.scale(building.depth / 2)), normal: forward },
        { center: building.mesh.position.subtract(forward.scale(building.depth / 2)), normal: forward.scale(-1) },
        { center: building.mesh.position.add(right.scale(building.width / 2)), normal: right },
        { center: building.mesh.position.subtract(right.scale(building.width / 2)), normal: right.scale(-1) },
      ];
      let bestFace = faceCandidates[0];
      let bestDist = Number.POSITIVE_INFINITY;
      faceCandidates.forEach((face) => {
        const dx = face.center.x - doorAnchor.x;
        const dz = face.center.z - doorAnchor.z;
        const dist = dx * dx + dz * dz;
        if (dist < bestDist) {
          bestDist = dist;
          bestFace = face;
        }
      });
        doorForward = bestFace.normal;
        building.mesh.setEnabled(false);
        building.mesh.isPickable = false;
        building.mesh.checkCollisions = false;
      }
      door.position = doorAnchor.clone().add(doorForward.scale(0.6));
      door.position.y = 3;
    door.rotation.y = Math.atan2(doorForward.x, doorForward.z) + Math.PI;
    door.isPickable = true;
    door.checkCollisions = false;
    const doorMat = new StandardMaterial("fellowshipDoorMat", sceneInstance);
    doorMat.diffuseColor = new Color3(0.35, 0.35, 0.38);
    doorMat.specularColor = new Color3(0.1, 0.1, 0.1);
    door.material = doorMat;

    const lineTex = new DynamicTexture("fellowshipDoorLinesTex", { width: 512, height: 512 }, sceneInstance, true);
    const lineCtx = lineTex.getContext() as CanvasRenderingContext2D;
    lineCtx.clearRect(0, 0, 512, 512);
    lineCtx.strokeStyle = "rgba(120,255,160,0.9)";
    lineCtx.lineWidth = 8;
    for (let y = 60; y < 512; y += 68) {
      lineCtx.beginPath();
      lineCtx.moveTo(30, y);
      lineCtx.lineTo(482, y);
      lineCtx.stroke();
    }
    lineTex.update();
    const linePlane = MeshBuilder.CreatePlane("fellowshipDoorLines", { width: 3.7, height: 5.5 }, sceneInstance);
    linePlane.position = door.position.add(doorForward.scale(0.18));
    linePlane.rotation.y = door.rotation.y;
    linePlane.isPickable = false;
    const lineMat = new StandardMaterial("fellowshipDoorLinesMat", sceneInstance);
    lineMat.diffuseTexture = lineTex;
    lineMat.emissiveTexture = lineTex;
    lineMat.opacityTexture = lineTex;
    lineMat.emissiveColor = new Color3(0.35, 1, 0.6);
    lineMat.backFaceCulling = false;
    linePlane.material = lineMat;

    const letterMeshes: Mesh[] = [];
    const letterTextures: DynamicTexture[] = [];
    const letterMaterials: StandardMaterial[] = [];
    const letterOscillators: Array<{ mesh: Mesh; baseY: number; phase: number; speed: number; amp: number }> = [];
    const lines = ["Speak Friend", "And Enter"];
    const textFacing = doorForward.scale(-1);
    const textRight = new Vector3(textFacing.z, 0, -textFacing.x);
    textRight.normalize();
    const scale = 3;
    const baseTextPos = door.position.add(new Vector3(0, 8.5, 0)).add(doorForward.scale(1.2));
    const runeTex = new DynamicTexture("fellowshipRuneParticleTex", { width: 64, height: 64 }, sceneInstance, true);
    const runeCtx = runeTex.getContext() as CanvasRenderingContext2D;
    const runeGradient = runeCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
    runeGradient.addColorStop(0, "rgba(255,240,180,1)");
    runeGradient.addColorStop(0.5, "rgba(255,170,60,0.85)");
    runeGradient.addColorStop(1, "rgba(255,140,40,0)");
    runeCtx.clearRect(0, 0, 64, 64);
    runeCtx.fillStyle = runeGradient;
    runeCtx.fillRect(0, 0, 64, 64);
    runeTex.update();

    const runeEmitter = new TransformNode("fellowshipRuneEmitter", sceneInstance);
    runeEmitter.position = baseTextPos.add(new Vector3(0, -0.9, 0));
    runeEmitter.rotation.y = Math.atan2(textFacing.x, textFacing.z);
    const runeParticles = new ParticleSystem("fellowshipRuneParticles", 220, sceneInstance);
    runeParticles.particleTexture = runeTex;
    runeParticles.emitter = runeEmitter as any;
    runeParticles.minEmitBox = new Vector3(-3.6 * scale, -0.8 * scale, -0.6 * scale);
    runeParticles.maxEmitBox = new Vector3(3.6 * scale, 0.8 * scale, 0.6 * scale);
    runeParticles.color1 = new Color4(1, 0.95, 0.65, 0.5);
    runeParticles.color2 = new Color4(1, 0.8, 0.35, 0.5);
    runeParticles.colorDead = new Color4(1, 0.75, 0.2, 0);
    runeParticles.minSize = 0.08 * scale;
    runeParticles.maxSize = 0.18 * scale;
    runeParticles.minLifeTime = 1.2;
    runeParticles.maxLifeTime = 2.6;
    runeParticles.emitRate = 45;
    runeParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
    runeParticles.gravity = new Vector3(0, 0.12, 0);
    runeParticles.minEmitPower = 0.2;
    runeParticles.maxEmitPower = 0.5;
    runeParticles.updateSpeed = 0.01;
    runeParticles.start();

    const doorSpot = new SpotLight(
      "fellowshipDoorSpot",
      baseTextPos.add(new Vector3(0, 6, 0)).add(textFacing.scale(2.5)),
      new Vector3(0, -1, 0),
      Math.PI / 4,
      2,
      sceneInstance
    );
    doorSpot.intensity = 1.2;
    doorSpot.diffuse = new Color3(0.95, 0.85, 0.55);
    const spaceWidth = 0.45 * scale;
    const getLetterWidth = (char: string) => (char === "." ? 0.28 * scale : 0.62 * scale);
    const letterHeight = 0.55 * scale;
    const lineSpacing = 0.95 * scale;
    let letterIndex = 0;

    lines.forEach((text, lineIndex) => {
      const widths = Array.from(text).map((char) => (char === " " ? spaceWidth : getLetterWidth(char)));
      const totalWidth = widths.reduce((sum, width) => sum + width, 0);
      let cursor = -totalWidth / 2;
      const lineBase = baseTextPos.add(new Vector3(0, -lineIndex * lineSpacing, 0));

      Array.from(text).forEach((char) => {
        if (char === " ") {
          cursor += spaceWidth;
          return;
        }
        const letterWidth = getLetterWidth(char);
        const plane = MeshBuilder.CreatePlane(
          `fellowshipLetter_${letterIndex}`,
          { width: letterWidth, height: letterHeight },
          sceneInstance
        );
        plane.position = lineBase.add(textRight.scale(cursor + letterWidth / 2));
        plane.rotation.y = Math.atan2(textFacing.x, textFacing.z);
        plane.isPickable = true;

        const tex = new DynamicTexture(
          `fellowshipLetterTex_${letterIndex}`,
          { width: 256, height: 128 },
          sceneInstance,
          true
        );
        const ctx = tex.getContext() as CanvasRenderingContext2D;
        ctx.clearRect(0, 0, 256, 128);
        ctx.font = '72px "Brush Script MT", "Segoe Script", "Snell Roundhand", cursive';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(90,255,140,0.8)";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#6bff8d";
        ctx.fillText(char, 128, 72);
        tex.update();

        const mat = new StandardMaterial(`fellowshipLetterMat_${letterIndex}`, sceneInstance);
        mat.diffuseTexture = tex;
        mat.emissiveTexture = tex;
        mat.opacityTexture = tex;
        mat.emissiveColor = new Color3(0.4, 1, 0.6);
        mat.backFaceCulling = false;
        plane.material = mat;

        letterMeshes.push(plane);
        letterTextures.push(tex);
        letterMaterials.push(mat);
        letterOscillators.push({
          mesh: plane,
          baseY: plane.position.y,
          phase: letterIndex * 0.6,
          speed: 1.1 + (letterIndex % 4) * 0.15,
          amp: 0.18 + (letterIndex % 3) * 0.05,
        });
        cursor += letterWidth;
        letterIndex += 1;
      });
    });

    const letterObserver = sceneInstance.onBeforeRenderObservable.add(() => {
      const t = performance.now() / 1000;
      letterOscillators.forEach(({ mesh, baseY, phase, speed, amp }) => {
        mesh.position.y = baseY + Math.sin(t * speed + phase) * amp;
      });
    });

    const switchToFellowship = () => {
      window.dispatchEvent(new CustomEvent("world-switch", { detail: { world: "fellowship" } }));
    };
    door.actionManager = door.actionManager || new ActionManager(sceneInstance);
    door.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, switchToFellowship));
    const pointerObserver = sceneInstance.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== PointerEventTypes.POINTERTAP) return;
      const picked = pointerInfo.pickInfo?.pickedMesh;
      if (!picked) return;
      if (picked === door || picked === linePlane || letterMeshes.includes(picked as Mesh)) {
        switchToFellowship();
      }
    });

    return () => {
      if (pointerObserver) sceneInstance.onPointerObservable.remove(pointerObserver);
      sceneInstance.onBeforeRenderObservable.remove(letterObserver);
      door.dispose();
      letterMeshes.forEach((mesh) => mesh.dispose());
      doorMat.dispose();
      linePlane.dispose();
      lineMat.dispose();
      lineTex.dispose();
      letterMaterials.forEach((mat) => mat.dispose());
      letterTextures.forEach((tex) => tex.dispose());
      runeParticles.dispose();
      runeTex.dispose();
      runeEmitter.dispose();
      doorSpot.dispose();
    };
  }, [sceneInstance, buildingInfos]);


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
      <AtmosphereProps scene={sceneInstance} settings={atmosphereProps} />
    </>
  );
};

export default BabylonWorld;
