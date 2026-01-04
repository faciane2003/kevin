import React, { useEffect, useRef } from "react";
import "@babylonjs/loaders";
import {
  Engine,
  Scene,
  UniversalCamera,
  Vector3,
  Ray,
  HemisphericLight,
  DirectionalLight,
  SpotLight,
  GlowLayer,
  DefaultRenderingPipeline,
  ColorCurves,
  MeshBuilder,
  StandardMaterial,
  PBRMaterial,
  Color3,
  Color4,
  Material,
  Mesh,
  ParticleSystem,
  Texture,
  DynamicTexture,
  TransformNode,
  SceneLoader,
  ActionManager,
  ExecuteCodeAction,
} from "@babylonjs/core";
import { GLTF2Export } from "@babylonjs/serializers";
import type { BuildingInfo } from "../../worlds/types";

export type WorldSceneControllerProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isTouchDevice: boolean;
  setSceneInstance: React.Dispatch<React.SetStateAction<Scene | null>>;
  setBuildingMaterials: React.Dispatch<React.SetStateAction<StandardMaterial[]>>;
  setBuildingInfos: React.Dispatch<React.SetStateAction<BuildingInfo[]>>;
  buildingInfosRef: React.MutableRefObject<BuildingInfo[]>;
  setTreePositions: React.Dispatch<React.SetStateAction<Vector3[]>>;
  treePositionsRef: React.MutableRefObject<Vector3[]>;
  setWalkInputActive: React.Dispatch<React.SetStateAction<boolean>>;
  walkInputActiveRef: React.MutableRefObject<boolean>;
  setPerfSettings: React.Dispatch<React.SetStateAction<any>>;
  setPostFxSettings: React.Dispatch<React.SetStateAction<any>>;
  setAssetToggles: React.Dispatch<React.SetStateAction<any>>;
  setAtmosphereProps: React.Dispatch<React.SetStateAction<any>>;
  setRealismSettings: React.Dispatch<React.SetStateAction<any>>;
  setStarSettings: React.Dispatch<React.SetStateAction<any>>;
  setShootingStarSettings: React.Dispatch<React.SetStateAction<any>>;
  perfSettings: any;
  postFxSettings: any;
  fogOpacityRef: React.MutableRefObject<number>;
  assetTogglesRef: React.MutableRefObject<any>;
  cameraRef: React.MutableRefObject<UniversalCamera | null>;
  glowLayerRef: React.MutableRefObject<GlowLayer | null>;
  signPositions: Vector3[];
  zRoads: number[];
  xRoads: number[];
};

const WorldSceneController: React.FC<WorldSceneControllerProps> = (props) => {
  const {
    canvasRef,
    isTouchDevice,
    setSceneInstance,
    setBuildingMaterials,
    setBuildingInfos,
    buildingInfosRef,
    setTreePositions,
    treePositionsRef,
    setWalkInputActive,
    walkInputActiveRef,
    setPerfSettings,
    setPostFxSettings,
    setAssetToggles,
    setAtmosphereProps,
    setRealismSettings,
    setStarSettings,
    setShootingStarSettings,
    perfSettings,
    postFxSettings,
    fogOpacityRef,
    assetTogglesRef,
    cameraRef,
    glowLayerRef,
    signPositions,
    zRoads,
    xRoads,
  } = props;

  const groundGlowShapesRef = useRef<Mesh[]>([]);
  const catRootsRef = useRef<TransformNode[]>([]);
  const planeRootsRef = useRef<TransformNode[]>([]);
  const planeTrailsRef = useRef<any[]>([]);
  const signPoleRef = useRef<TransformNode[]>([]);
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    (scene as any).maxSimultaneousLights = 4;
    setSceneInstance(scene);
    (window as any).__babylonReady = false;
    scene.clearColor = new Color4(0.03, 0.04, 0.08, 1);
    let readySent = false;
    let stableFrames = 0;
    scene.onBeforeRenderObservable.add(() => {
      if (readySent) return;
      const isReady = scene.isReady();
      if (isReady) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
      }
      if (stableFrames >= 30) {
        readySent = true;
        (window as any).__babylonReady = true;
        window.dispatchEvent(new CustomEvent("world-ready", { detail: { world: "babylon" } }));
      }
    });


    // First-person camera
    const loadCameraStart = () => {
      try {
        const raw = window.localStorage.getItem("cameraStart");
        if (!raw) return null;
        const parsed = JSON.parse(raw) as {
          pos?: { x: number; y: number; z: number };
          target?: { x: number; y: number; z: number };
        };
        if (!parsed?.pos || !parsed?.target) return null;
        return parsed;
      } catch {
        return null;
      }
    };
    const savedStart = loadCameraStart();
    let startPos = new Vector3(-448.9918797028794, 2, 166.75881239074846);
    let startTarget = new Vector3(-412.54643712993385, 12.962425971562043, 154.4292996056369);
    if (savedStart?.pos && savedStart?.target) {
      startPos = new Vector3(savedStart.pos.x, savedStart.pos.y, savedStart.pos.z);
      startTarget = new Vector3(savedStart.target.x, savedStart.target.y, savedStart.target.z);
    }
    const camera = new UniversalCamera("camera", startPos.clone(), scene);
    cameraRef.current = camera;
    camera.setTarget(startTarget.clone());
    scene.collisionsEnabled = true;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(0.6, 1.1, 0.6);
    camera.ellipsoidOffset = new Vector3(0, 1.1, 0);

    const sprintModeRef = { current: false };

    const sparkleTexture = new DynamicTexture("sparkleTexture", { width: 64, height: 64 }, scene, true);
    const sparkleCtx = sparkleTexture.getContext();
    const sparkleGrad = sparkleCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
    sparkleGrad.addColorStop(0, "rgba(255,255,255,1)");
    sparkleGrad.addColorStop(0.4, "rgba(255,255,255,0.9)");
    sparkleGrad.addColorStop(1, "rgba(255,255,255,0)");
    sparkleCtx.clearRect(0, 0, 64, 64);
    sparkleCtx.fillStyle = sparkleGrad;
    sparkleCtx.fillRect(0, 0, 64, 64);
    sparkleTexture.update();

    const sparkleAnchor = new TransformNode("sparkleAnchor", scene);
    const sparkleTimers: number[] = [];
    let rollerSparkleTimer: number | null = null;
    const scheduleRollerSparkles = () => {
      if (!sprintModeRef.current) return;
      if (!walkInputActiveRef.current) return;
      const delay = 7000 + Math.random() * 8000;
      rollerSparkleTimer = window.setTimeout(() => {
        if (sprintModeRef.current && walkInputActiveRef.current) {
          spawnFootSparkles(new Color4(1, 0.25, 0.2, 1));
        }
        scheduleRollerSparkles();
      }, delay);
    };
    const updateRollerSparkles = () => {
      if (rollerSparkleTimer) {
        window.clearTimeout(rollerSparkleTimer);
        rollerSparkleTimer = null;
      }
      scheduleRollerSparkles();
    };
    const spawnFootSparkles = (color: Color4) => {
      const system = new ParticleSystem("footSparkles", 180, scene);
      system.particleTexture = sparkleTexture;
      const forward = camera.getDirection(new Vector3(0, 0, 1));
      sparkleAnchor.position = camera.position.add(forward.scale(2.2));
      sparkleAnchor.position.y = camera.position.y - 1.2;
      system.emitter = sparkleAnchor as any;
      system.minEmitBox = new Vector3(-7.2, -2.4, -7.2);
      system.maxEmitBox = new Vector3(7.2, 2.4, 7.2);
      system.color1 = color;
      system.color2 = color;
      system.colorDead = new Color4(color.r, color.g, color.b, 0);
      system.minSize = 0.175;
      system.maxSize = 0.45;
      system.minLifeTime = 6;
      system.maxLifeTime = 15;
      system.emitRate = 1600;
      system.gravity = new Vector3(0, 1.8, 0);
      system.direction1 = new Vector3(-0.6, 1.2, -0.6);
      system.direction2 = new Vector3(0.6, 1.6, 0.6);
      system.minEmitPower = 0.4;
      system.maxEmitPower = 1.2;
      system.updateSpeed = 0.02;
      system.blendMode = ParticleSystem.BLENDMODE_ADD;
      system.start();
      const timer = window.setTimeout(() => {
        system.stop();
        system.dispose();
      }, 5400);
      sparkleTimers.push(timer);
    };

    const onHudItemClick = (evt: Event) => {
      const { detail } = evt as CustomEvent<{ label?: string }>;
      const { label } = detail ?? {};
      if (!label) return;
      if (label !== "Rollerblades") return;
      sprintModeRef.current = !sprintModeRef.current;
      spawnFootSparkles(
        sprintModeRef.current ? new Color4(1, 0.84, 0.2, 1) : new Color4(0.3, 0.6, 1, 1)
      );
      updateRollerSparkles();
    };
    window.addEventListener("hud-item-click", onHudItemClick as EventListener);

    // Attach default controls so mouse drag looks around.
    camera.attachControl(canvasRef.current, true);
    const requestLock = () => {
      canvasRef.current?.requestPointerLock?.();
    };
    canvasRef.current?.addEventListener("click", requestLock);
    const onHudClose = () => {
      if (isTouchDevice) return;
      canvasRef.current?.requestPointerLock?.();
    };
    window.addEventListener("hud-close", onHudClose as EventListener);

    const debugOverlayWrap = document.createElement("div");
    debugOverlayWrap.style.position = "fixed";
    debugOverlayWrap.style.top = "12px";
    debugOverlayWrap.style.right = "12px";
    debugOverlayWrap.style.display = "none";
    debugOverlayWrap.style.zIndex = "20";
    debugOverlayWrap.style.pointerEvents = "auto";

    const debugOverlay = document.createElement("div");
    debugOverlay.style.padding = "8px 10px";
    debugOverlay.style.background = "rgba(0,0,0,0.6)";
    debugOverlay.style.color = "#e6f3ff";
    debugOverlay.style.fontFamily = "Consolas, Menlo, monospace";
    debugOverlay.style.fontSize = "12px";
    debugOverlay.style.whiteSpace = "pre";
    debugOverlay.style.pointerEvents = "none";

    const copyDebugButton = document.createElement("button");
    copyDebugButton.textContent = "Copy";
    copyDebugButton.style.marginTop = "6px";
    copyDebugButton.style.padding = "4px 8px";
    copyDebugButton.style.borderRadius = "6px";
    copyDebugButton.style.border = "1px solid rgba(255,255,255,0.2)";
    copyDebugButton.style.background = "rgba(10,12,20,0.85)";
    copyDebugButton.style.color = "#e6f3ff";
    copyDebugButton.style.cursor = "pointer";
    copyDebugButton.style.fontSize = "11px";
    copyDebugButton.style.pointerEvents = "auto";
    copyDebugButton.addEventListener("click", async () => {
      const pos = camera.position;
      const target = camera.getTarget();
      const { x: posX, y: posY, z: posZ } = pos;
      const text =
        `pos: (${posX.toFixed(2)}, ${posY.toFixed(2)}, ${posZ.toFixed(2)})\n` +
        `target: (${target.x.toFixed(2)}, ${target.y.toFixed(2)}, ${target.z.toFixed(2)})`;
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
    });

    debugOverlayWrap.appendChild(debugOverlay);
    debugOverlayWrap.appendChild(copyDebugButton);
    document.body.appendChild(debugOverlayWrap);
    const isTextInputActive = () => {
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName.toLowerCase();
      return tag === "input" || tag === "textarea";
    };
    let lastCameraUiUpdate = 0;

    document.body.style.userSelect = "none";
    (document.body.style as any).webkitUserSelect = "none";
    (document.body.style as any).webkitTouchCallout = "none";
    document.body.style.touchAction = "none";
    const onDialogueOpen = () => {
      try { document.exitPointerLock?.(); } catch {}
    };
    window.addEventListener("npc-dialogue", onDialogueOpen as EventListener);
    const onCameraStartUpdate = (evt: Event) => {
      const { detail } = evt as CustomEvent<{
        pos?: { x: number; y: number; z: number };
        target?: { x: number; y: number; z: number };
      }>;
      const { pos, target } = detail ?? {};
      if (!pos || !target) return;
      const { x: px, y: py, z: pz } = pos;
      const { x: tx, y: ty, z: tz } = target;
      camera.position.set(px, py, pz);
      camera.setTarget(new Vector3(tx, ty, tz));
      try {
        window.localStorage.setItem("cameraStart", JSON.stringify(detail));
      } catch {}
    };
    window.addEventListener("camera-start-update", onCameraStartUpdate as EventListener);


    const buildingTilingState = { u: 1, v: 2.5 };
    const parseHexColor = (hex: string) => {
      const cleaned = hex.replace("#", "");
      const expanded =
        cleaned.length === 3
          ? cleaned
              .split("")
              .map((c) => `${c}${c}`)
              .join("")
          : cleaned;
      const value = parseInt(expanded, 16);
      const r = (value >> 16) & 255;
      const g = (value >> 8) & 255;
      const b = value & 255;
      return new Color3(r / 255, g / 255, b / 255);
    };


    if (isTouchDevice) {
      try {
        // @ts-ignore - touch input may not be publicly typed in some versions
        if (camera.inputs?.attached?.touch) {
          // Lower values = faster rotation on touch
          // @ts-ignore
          camera.inputs.attached.touch.touchAngularSensibility = 3000;
        }
      } catch {}
    }

    let interactZone: HTMLDivElement | null = null;
    let lookZone: HTMLDivElement | null = null;
    let walkZone: HTMLDivElement | null = null;
    let walkLabelZone: HTMLDivElement | null = null;
    let walkPointerActive = false;
    let walkPointerId: number | null = null;
    let walkInputX = 0;
    let walkInputY = 0;
    let lookPointerActive = false;
    let lookPointerId: number | null = null;
    let lastLookX = 0;
    let lastLookY = 0;
    let lookTargetX = 0;
    let lookTargetY = 0;
    const hintTimers: number[] = [];
    const hintAnimations: Animation[] = [];
    const lookSensitivity = 0.00112;
    const lookHoldSpeed = 1.4;
    const clampPitch = (value: number) => Math.max(-1.4, Math.min(1.4, value));
    if (isTouchDevice) {
      interactZone = document.createElement("div");
      interactZone.style.position = "fixed";
      interactZone.style.left = "0";
      interactZone.style.top = "0";
      interactZone.style.width = "100vw";
      interactZone.style.height = "50vh";
      interactZone.style.border = "none";
      interactZone.style.background = "transparent";
      interactZone.style.boxShadow = "none";
      interactZone.style.outline = "none";
      interactZone.style.userSelect = "none";
      interactZone.style.zIndex = "16";
      interactZone.style.pointerEvents = "auto";
      interactZone.style.touchAction = "none";
      document.body.appendChild(interactZone);
      const setInteract = (active: boolean) => {
        window.dispatchEvent(new CustomEvent("interact-input", { detail: { active } }));
      };
      interactZone.addEventListener("pointerdown", () => setInteract(true));
      interactZone.addEventListener("pointerup", () => setInteract(false));
      interactZone.addEventListener("pointercancel", () => setInteract(false));

      walkZone = document.createElement("div");
      walkZone.style.position = "fixed";
      walkZone.style.left = "0";
      walkZone.style.top = "50vh";
      walkZone.style.width = "50vw";
      walkZone.style.height = "50vh";
      walkZone.style.border = "none";
      walkZone.style.background = "transparent";
      walkZone.style.boxShadow = "none";
      walkZone.style.outline = "none";
      walkZone.style.userSelect = "none";
      walkZone.style.zIndex = "17";
      walkZone.style.pointerEvents = "auto";
      walkZone.style.touchAction = "none";
      document.body.appendChild(walkZone);

      walkLabelZone = document.createElement("div");
      walkLabelZone.style.position = "fixed";
      walkLabelZone.style.left = "0";
      walkLabelZone.style.top = "50vh";
      walkLabelZone.style.width = "50vw";
      walkLabelZone.style.height = "50vh";
      walkLabelZone.style.border = "none";
      walkLabelZone.style.background = "transparent";
      walkLabelZone.style.boxShadow = "none";
      walkLabelZone.style.outline = "none";
      walkLabelZone.style.userSelect = "none";
      walkLabelZone.style.zIndex = "18";
      walkLabelZone.style.pointerEvents = "none";
      walkLabelZone.style.display = "flex";
      walkLabelZone.style.flexDirection = "column";
      walkLabelZone.style.alignItems = "center";
      walkLabelZone.style.justifyContent = "flex-start";
      walkLabelZone.style.paddingTop = "20vh";
      walkLabelZone.style.paddingLeft = "8px";
      walkLabelZone.style.color = "#38e26f";
      walkLabelZone.style.fontFamily = "Consolas, Menlo, monospace";
      walkLabelZone.style.fontSize = "18px";
      walkLabelZone.style.textAlign = "center";
      walkLabelZone.style.textShadow = "0 2px 0 rgba(0,0,0,0.6), 0 0 12px rgba(56,226,111,0.7)";

      const walkUp = document.createElement("div");
      walkUp.textContent = "\u25B2";
      walkUp.style.fontSize = "12px";

      const walkLabel = document.createElement("div");
      walkLabel.textContent = "Walk";
      walkLabel.style.fontSize = "18px";

      const walkDown = document.createElement("div");
      walkDown.textContent = "\u25BC";
      walkDown.style.fontSize = "12px";

      walkLabelZone.appendChild(walkUp);
      walkLabelZone.appendChild(walkLabel);
      walkLabelZone.appendChild(walkDown);
      document.body.appendChild(walkLabelZone);

      lookZone = document.createElement("div");
      lookZone.style.position = "fixed";
      lookZone.style.right = "0";
      lookZone.style.top = "50vh";
      lookZone.style.width = "50vw";
      lookZone.style.height = "50vh";
      lookZone.style.borderLeft = "none";
      lookZone.style.border = "none";
      lookZone.style.background = "transparent";
      lookZone.style.boxShadow = "none";
      lookZone.style.outline = "none";
      lookZone.style.userSelect = "none";
      lookZone.style.zIndex = "18";
      lookZone.style.pointerEvents = "auto";
      lookZone.style.touchAction = "none";
      lookZone.style.display = "flex";
      lookZone.style.flexDirection = "column";
      lookZone.style.alignItems = "center";
      lookZone.style.justifyContent = "flex-start";
      lookZone.style.paddingTop = "20vh";
      lookZone.style.paddingRight = "8px";
      lookZone.style.color = "#38e26f";
      lookZone.style.fontFamily = "Consolas, Menlo, monospace";
      lookZone.style.fontSize = "18px";
      lookZone.style.textAlign = "center";
      lookZone.style.textShadow = "0 2px 0 rgba(0,0,0,0.6), 0 0 12px rgba(56,226,111,0.7)";

      const lookUp = document.createElement("div");
      lookUp.textContent = "\u25B2";
      lookUp.style.fontSize = "12px";

      const lookLabel = document.createElement("div");
      lookLabel.textContent = "Look";
      lookLabel.style.fontSize = "18px";

      const lookDown = document.createElement("div");
      lookDown.textContent = "\u25BC";
      lookDown.style.fontSize = "12px";

      lookZone.appendChild(lookUp);
      lookZone.appendChild(lookLabel);
      lookZone.appendChild(lookDown);
      document.body.appendChild(lookZone);

      const addSparkles = (el: HTMLElement, count: number) => {
        el.style.overflow = "visible";
        el.style.position = "fixed";
        const baseColor = "rgba(56,226,111,0.95)";
        const cappedCount = Math.min(count, isTouchDevice ? 8 : 18);
        for (let i = 0; i < cappedCount; i += 1) {
          const sparkle = document.createElement("span");
          sparkle.style.position = "absolute";
          const size = 3 + Math.random() * 3;
          sparkle.style.width = `${size}px`;
          sparkle.style.height = `${size}px`;
          sparkle.style.borderRadius = "999px";
          sparkle.style.background = baseColor;
          sparkle.style.boxShadow = "0 0 8px rgba(56,226,111,0.9), 0 0 14px rgba(56,226,111,0.6)";
          sparkle.style.left = `${35 + Math.random() * 30}%`;
          sparkle.style.top = `${20 + Math.random() * 30}%`;
          el.appendChild(sparkle);
          const anim = sparkle.animate(
            [
              { transform: "translate(0,0) scale(0.6)", opacity: 0 },
              { transform: "translate(6px,-22px) scale(1)", opacity: 1 },
              { transform: "translate(-6px,12px) scale(0.7)", opacity: 0 },
            ],
            {
              duration: 2000 + Math.random() * 3000,
              iterations: Infinity,
              easing: "ease-in-out",
              delay: Math.random() * 800,
            }
          );
          hintAnimations.push(anim);
        }
      };

      const runHintAnimation = (el: HTMLElement) => {
        const baseShadow = "0 2px 0 rgba(0,0,0,0.6), 0 0 12px rgba(56,226,111,0.7)";
        const glowShadow = "0 2px 0 rgba(0,0,0,0.6), 0 0 20px rgba(56,226,111,0.95)";
        el.style.opacity = "0";
        el.style.transform = "translateY(40px) scale(1)";
        el.style.textShadow = baseShadow;
        hintAnimations.push(
          el.animate(
            [
              { transform: "translateY(0) scale(1)" },
              { transform: "translateY(-6px) scale(1)" },
            ],
            { duration: 2400, easing: "ease-in-out", direction: "alternate", iterations: Infinity }
          )
        );
        const scheduleHide = (target: HTMLElement, delayMs: number) => {
          const timer = window.setTimeout(() => {
            hintAnimations.push(
              target.animate(
                [
                  { opacity: 1, transform: "translateY(0) scale(1)", textShadow: baseShadow },
                  { opacity: 0, transform: "translateY(40px) scale(0.98)", textShadow: baseShadow },
                ],
                { duration: 1200, easing: "ease-in", fill: "forwards" }
              )
            );
          }, delayMs);
          hintTimers.push(timer);
        };

        const start = window.setTimeout(() => {
          hintAnimations.push(
            el.animate(
              [
                { opacity: 0, transform: "translateY(40px) scale(1)", textShadow: baseShadow },
                { opacity: 1, transform: "translateY(0) scale(1)", textShadow: baseShadow },
              ],
              { duration: 1000, easing: "ease-out", fill: "forwards" }
            )
          );
          hintAnimations.push(
            el.animate(
              [
                { transform: "translateY(0) scale(1)", textShadow: baseShadow },
                { transform: "translateY(0) scale(1.05)", textShadow: glowShadow },
                { transform: "translateY(0) scale(1)", textShadow: baseShadow },
              ],
              { duration: 1400, easing: "ease-in-out", fill: "forwards" }
            )
          );
        }, 3000);
        hintTimers.push(start);

        let dismissed = false;
        const dismiss = () => {
          if (dismissed) return;
          dismissed = true;
          scheduleHide(el, 3000);
        };

        return { dismiss };
      };
      addSparkles(walkLabelZone, 18);
      addSparkles(lookZone, 18);
      const walkHint = runHintAnimation(walkLabelZone);
      const lookHint = runHintAnimation(lookZone);

      const updateWalkInput = (evt: PointerEvent) => {
        if (!walkZone) return;
        const rect = walkZone.getBoundingClientRect();
        const nx = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((evt.clientY - rect.top) / rect.height) * 2 - 1;
        walkInputX = Math.max(-1, Math.min(1, nx));
        walkInputY = Math.max(-1, Math.min(1, ny));
      };

      walkZone.addEventListener("pointerdown", (evt) => {
        walkPointerActive = true;
        walkPointerId = evt.pointerId;
        updateWalkInput(evt);
        walkZone?.setPointerCapture(evt.pointerId);
        window.dispatchEvent(new CustomEvent("walk-input", { detail: { active: true } }));
        walkHint.dismiss();
      });

      walkZone.addEventListener("pointermove", (evt) => {
        if (!walkPointerActive || walkPointerId !== evt.pointerId) return;
        updateWalkInput(evt);
      });

      const endWalk = (evt: PointerEvent) => {
        if (!walkPointerActive || walkPointerId !== evt.pointerId) return;
        walkPointerActive = false;
        walkPointerId = null;
        walkInputX = 0;
        walkInputY = 0;
        window.dispatchEvent(new CustomEvent("walk-input", { detail: { active: false } }));
        try { walkZone?.releasePointerCapture(evt.pointerId); } catch {}
      };

      walkZone.addEventListener("pointerup", endWalk);
      walkZone.addEventListener("pointercancel", endWalk);

      const updateLookInput = (evt: PointerEvent) => {
        if (!lookZone) return;
        const rect = lookZone.getBoundingClientRect();
        const nx = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((evt.clientY - rect.top) / rect.height) * 2 - 1;
        lookTargetX = Math.max(-1, Math.min(1, nx));
        lookTargetY = Math.max(-1, Math.min(1, ny));
      };

      lookZone.addEventListener("pointerdown", (evt) => {
        lookPointerActive = true;
        lookPointerId = evt.pointerId;
        lastLookX = evt.clientX;
        lastLookY = evt.clientY;
        updateLookInput(evt);
        lookZone?.setPointerCapture(evt.pointerId);
        lookHint.dismiss();
        window.dispatchEvent(new CustomEvent("look-input", { detail: { active: true } }));
      });

      lookZone.addEventListener("pointermove", (evt) => {
        if (!lookPointerActive || lookPointerId !== evt.pointerId) return;
        const dx = evt.clientX - lastLookX;
        const dy = evt.clientY - lastLookY;
        lastLookX = evt.clientX;
        lastLookY = evt.clientY;
        lookTargetX = Math.max(-1, Math.min(1, lookTargetX + dx * lookSensitivity));
        lookTargetY = Math.max(-1, Math.min(1, lookTargetY + dy * lookSensitivity));
        updateLookInput(evt);
      });

      const endLook = (evt: PointerEvent) => {
        if (!lookPointerActive || lookPointerId !== evt.pointerId) return;
        lookPointerActive = false;
        lookPointerId = null;
        lookTargetX = 0;
        lookTargetY = 0;
        window.dispatchEvent(new CustomEvent("look-input", { detail: { active: false } }));
        try { lookZone?.releasePointerCapture(evt.pointerId); } catch {}
      };

      lookZone.addEventListener("pointerup", endLook);
      lookZone.addEventListener("pointercancel", endLook);
    }

    // Try to remove default camera inputs to avoid double-handling. The
    // exact property paths can vary between Babylon versions so guard with try/catch.
    try {
      // @ts-ignore - internal inputs may not be publicly typed in some versions
      if (camera.inputs && camera.inputs.attached) {
        // Remove keyboard/mousewheel camera inputs so movement is handled only by our own WASD logic
        if (camera.inputs.attached.keyboard) {
          // @ts-ignore
          camera.inputs.remove(camera.inputs.attached.keyboard);
        }
        if (camera.inputs.attached.mousewheel) {
          // @ts-ignore
          camera.inputs.remove(camera.inputs.attached.mousewheel);
        }
      }
    } catch (err) {
      // ignore if inputs not present
    }

    // Mouse look handled by default camera controls.

    // Multiplayer disabled for now.

    // Ambient light and neon city glow
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0;
    hemi.diffuse = new Color3(0.2, 0.45, 0.9);
    hemi.groundColor = new Color3(0.05, 0.05, 0.5);

    const ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), scene);
    ambientLight.intensity = 3;
    ambientLight.diffuse = new Color3(0.08, 0.12, 0.2);
    ambientLight.groundColor = new Color3(0.02, 0.03, 0.06);

    // Sky (large inverted sphere)
    const sky = MeshBuilder.CreateSphere("sky", { diameter: 8000, segments: 16 }, scene);
    const skyMat = new StandardMaterial("skyMat", scene);
    skyMat.backFaceCulling = false;
    skyMat.emissiveTexture = new Texture("/textures/sky_galaxy.png", scene);
    skyMat.diffuseColor = new Color3(0, 0, 0);
    skyMat.specularColor = new Color3(0, 0, 0);
    skyMat.disableLighting = true;
    skyMat.fogEnabled = false;
    sky.material = skyMat;
    sky.isPickable = false;

    // Moon (emissive sphere with texture)
    const moon = MeshBuilder.CreateSphere("moon", { diameter: 120, segments: 24 }, scene);
    const moonMat = new StandardMaterial("moonMat", scene);
    moonMat.diffuseTexture = new Texture("/textures/moon.jpg", scene);
    moonMat.emissiveTexture = moonMat.diffuseTexture;
    moonMat.emissiveColor = new Color3(0.35, 0.35, 0.3);
    moonMat.specularColor = new Color3(0, 0, 0);
    moonMat.disableLighting = false;
    moonMat.fogEnabled = false;
    moon.material = moonMat;
    moon.position = new Vector3(700, 450, -130);
    moon.isPickable = false;
    const moonSafeRadius = 240;

    let moonlightEnabled = false;
    const moonLight = new DirectionalLight("moonLight", new Vector3(0.4, -1, 0.2), scene);
    moonLight.position = moon.position;
    moonLight.intensity = moonlightEnabled ? 0.5 : 0;
    moonLight.diffuse = new Color3(0.7, 0.8, 1.0);

    const moonSpotPos = new Vector3(340, 717, -130);
    const moonSpot = new SpotLight(
      "moonSpot",
      moonSpotPos.clone(),
      new Vector3(0, -1, 0),
      1.32,
      2,
      scene
    );
    moonSpot.intensity = moonlightEnabled ? 5 : 0;
    moonSpot.diffuse = new Color3(0.85, 0.9, 1.0);

    let moonSpotYaw = -93;
    let moonSpotPitch = -47;
    const updateMoonSpotDirection = () => {
      const yaw = (moonSpotYaw * Math.PI) / 180;
      const pitch = (moonSpotPitch * Math.PI) / 180;
      const dir = new Vector3(
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.cos(yaw) * Math.cos(pitch)
      );
      moonSpot.direction = dir;
    };
    updateMoonSpotDirection();


    moon.scaling.set(2.3, 2.3, 2.3);

    const createNeonSignTexture = (name: string, label: string, glow: string, flipX = false) => {
      const tex = new DynamicTexture(name, { width: 512, height: 256 }, scene, false);
      const ctx = tex.getContext() as CanvasRenderingContext2D;
      const size = tex.getSize();
      ctx.save();
      if (flipX) {
        ctx.translate(size.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fillRect(0, 0, size.width, size.height);
      ctx.fillStyle = glow;
      ctx.font = "bold 40px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = glow;
      ctx.shadowBlur = 18;
      const lines = label.split("\n");
      const lineHeight = 52;
      const totalHeight = lines.length * lineHeight;
      const startY = (size.height - totalHeight) / 2 + lineHeight / 2;
      lines.forEach((line, index) => {
        ctx.fillText(line, size.width / 2, startY + index * lineHeight);
      });
      ctx.restore();
      tex.update();
      return tex;
    };

    // Ground (flat black plane)
    const ground = MeshBuilder.CreateGround("ground", { width: 2400, height: 2400 }, scene);
    const groundMat = new PBRMaterial("groundMat", scene);
    groundMat.albedoTexture = new Texture(
      "/textures/cracked_asphalt_sivodcfa_1k_ue_low/Textures/T_sivodcfa_1K_B%20copy.jpg",
      scene
    );

    if (!isTouchDevice) {
      groundMat.bumpTexture = new Texture(
        "/textures/cracked_asphalt_sivodcfa_1k_ue_low/Textures/T_sivodcfa_1K_N.jpg",
        scene
      );
      groundMat.bumpTexture.level = 1.25;
      groundMat.metallicTexture = new Texture(
        "/textures/cracked_asphalt_sivodcfa_1k_ue_low/Textures/T_sivodcfa_1K_ORM.jpg",
        scene
      );
      groundMat.useAmbientOcclusionFromMetallicTextureRed = true;
      groundMat.useRoughnessFromMetallicTextureGreen = true;
      groundMat.useMetallnessFromMetallicTextureBlue = true;
    }

    groundMat.metallic = 1;
    groundMat.roughness = 1;

    const groundTiling = isTouchDevice ? 40 : 70;
    if (groundMat.albedoTexture) {
      const albedoTex = groundMat.albedoTexture as Texture;
      albedoTex.uScale = groundTiling;
      albedoTex.vScale = groundTiling;
    }
    if (groundMat.bumpTexture) {
      const bumpTex = groundMat.bumpTexture as Texture;
      bumpTex.uScale = groundTiling;
      bumpTex.vScale = groundTiling;
    }
    if (groundMat.metallicTexture) {
      const ormTex = groundMat.metallicTexture as Texture;
      ormTex.uScale = groundTiling;
      ormTex.vScale = groundTiling;
    }
    ground.material = groundMat;
    ground.checkCollisions = true;

    const walkMeshes = new Set([ground.name]);

    // Distant mountains removed for now

    // Sky texture already applied above.
    // Atmospheric fog
    const fogSettings = {
      enabled: true,
      density: 0.0045,
      intensity: 0.2,
      heightFalloff: 0.001,
      color: parseHexColor("#282f3e"),
    };
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = fogSettings.density;
    scene.fogColor = fogSettings.color;
    const fogObserver = scene.onBeforeRenderObservable.add(() => {
      scene.fogDensity = fogSettings.enabled ? fogSettings.density * fogOpacityRef.current : 0;
      scene.fogColor = fogSettings.color;
    });

    const lodObserver = scene.onBeforeRenderObservable.add(() => {
      if (!camera) return;
      const camPos = (camera as any).globalPosition || camera.position;
      for (const mesh of buildingMeshes) {
        const lodData = (mesh as any)._lodData;
        if (!lodData) continue;

        const dx = mesh.position.x - camPos.x;
        const dz = mesh.position.z - camPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        const collider: Mesh | undefined = lodData.collider;
        const neonPanels: Mesh[] = lodData.neonPanels || [];

        const isVeryFar = dist > veryFarBuildingDistance;
        const isFar = dist > farBuildingDistance;

        if (collider) {
          collider.checkCollisions = !isVeryFar && perfSettings.collisions;
        }

        for (const panel of neonPanels) {
          panel.setEnabled(!isFar);
        }

        const mat = mesh.material as StandardMaterial | null;
        if (mat?.emissiveTexture) {
          mat.emissiveColor = isVeryFar ? new Color3(0, 0, 0) : new Color3(0.2, 0.2, 0.2);
        }
      }
    });

    // Post-processing: glow, depth of field, motion blur, color grading
    const glowLayer = new GlowLayer("glow", scene, { blurKernelSize: 32 });
    glowLayerRef.current = glowLayer;
    glowLayer.intensity = 0.2;
    glowLayer.addExcludedMesh(moon);

    const pipeline = new DefaultRenderingPipeline(
      "defaultPipeline",
      true,
      scene,
      [camera]
    );
    pipeline.fxaaEnabled = !isTouchDevice;
    pipeline.bloomEnabled = false;
    pipeline.depthOfFieldEnabled = !isTouchDevice;
    pipeline.depthOfFieldBlurLevel = 2;
    if (pipeline.depthOfField) {
      pipeline.depthOfField.focusDistance = 12000;
      pipeline.depthOfField.fStop = 3.2;
    }

    const curves = new ColorCurves();
    curves.globalHue = 12;
    curves.globalDensity = 8;
    curves.globalSaturation = 10;
    curves.globalExposure = 0;
    curves.highlightsHue = 25;
    curves.highlightsDensity = 15;
    curves.highlightsSaturation = 10;
    curves.shadowsHue = 220;
    curves.shadowsDensity = 20;
    curves.shadowsSaturation = 10;
    scene.imageProcessingConfiguration.colorCurves = curves;
    scene.imageProcessingConfiguration.colorCurvesEnabled = true;

    const applyPostFx = (detail: any) => {
      if (typeof detail.enabled === "boolean") {
        (pipeline as any).enabled = detail.enabled && perfSettings.postFx;
      }
      if (typeof detail.depthOfFieldEnabled === "boolean") {
        pipeline.depthOfFieldEnabled = detail.depthOfFieldEnabled;
      }
      if (typeof detail.depthOfFieldBlurLevel === "number") {
        pipeline.depthOfFieldBlurLevel = detail.depthOfFieldBlurLevel;
      }
      if (pipeline.depthOfField) {
        if (typeof detail.depthOfFieldFocusDistance === "number") {
          pipeline.depthOfField.focusDistance = detail.depthOfFieldFocusDistance;
        }
        if (typeof detail.depthOfFieldFStop === "number") {
          pipeline.depthOfField.fStop = detail.depthOfFieldFStop;
        }
      }
      if (typeof detail.colorGradingEnabled === "boolean") {
        scene.imageProcessingConfiguration.colorCurvesEnabled = detail.colorGradingEnabled;
      }
      if (typeof detail.globalHue === "number") curves.globalHue = detail.globalHue;
      if (typeof detail.globalDensity === "number") curves.globalDensity = detail.globalDensity;
      if (typeof detail.globalSaturation === "number") curves.globalSaturation = detail.globalSaturation;
      if (typeof detail.globalExposure === "number") curves.globalExposure = detail.globalExposure;
      if (typeof detail.highlightsHue === "number") curves.highlightsHue = detail.highlightsHue;
      if (typeof detail.highlightsDensity === "number") curves.highlightsDensity = detail.highlightsDensity;
      if (typeof detail.highlightsSaturation === "number") curves.highlightsSaturation = detail.highlightsSaturation;
      if (typeof detail.shadowsHue === "number") curves.shadowsHue = detail.shadowsHue;
      if (typeof detail.shadowsDensity === "number") curves.shadowsDensity = detail.shadowsDensity;
      if (typeof detail.shadowsSaturation === "number") curves.shadowsSaturation = detail.shadowsSaturation;
    };
    applyPostFx(postFxSettings);

    // Reduce quality on touch devices
    if (isTouchDevice) {
      pipeline.depthOfFieldBlurLevel = 1;
      glowLayer.intensity = 0.18;
      scene.fogDensity *= 0.8;
    }

    const onLightSettings = (evt: Event) => {
      const detail = (evt as CustomEvent<any>).detail;
      if (!detail) return;
      if (typeof detail.hemi === "number") hemi.intensity = detail.hemi;
      if (typeof detail.ambient === "number") ambientLight.intensity = detail.ambient;
      if (typeof detail.moonlightEnabled === "boolean") {
        moonlightEnabled = detail.moonlightEnabled;
      }
      if (typeof detail.moon === "number") moonLight.intensity = detail.moon;
      if (typeof detail.moonSpotIntensity === "number") moonSpot.intensity = detail.moonSpotIntensity;
      if (typeof detail.moonSpotAngle === "number") moonSpot.angle = detail.moonSpotAngle;
      if (typeof detail.moonSpotX === "number") moonSpot.position.x = detail.moonSpotX;
      if (typeof detail.moonSpotY === "number") moonSpot.position.y = detail.moonSpotY;
      if (typeof detail.moonSpotZ === "number") moonSpot.position.z = detail.moonSpotZ;
      if (typeof detail.moonSpotYaw === "number") {
        moonSpotYaw = detail.moonSpotYaw;
        updateMoonSpotDirection();
      }
      if (typeof detail.moonSpotPitch === "number") {
        moonSpotPitch = detail.moonSpotPitch;
        updateMoonSpotDirection();
      }
      if (!moonlightEnabled) {
        moonLight.intensity = 0;
        moonSpot.intensity = 0;
      }
      if (typeof detail.glow === "number") glowLayer.intensity = detail.glow;
      if (typeof detail.fogEnabled === "boolean") fogSettings.enabled = detail.fogEnabled;
      if (typeof detail.fogDensity === "number") fogSettings.density = detail.fogDensity;
      if (typeof detail.fogIntensity === "number") fogSettings.intensity = detail.fogIntensity;
      if (typeof detail.fogHeightFalloff === "number") fogSettings.heightFalloff = detail.fogHeightFalloff;
      if (typeof detail.fogColor === "string") {
        fogSettings.color = parseHexColor(detail.fogColor);
        scene.fogColor = fogSettings.color;
      }
    };
    window.addEventListener("light-settings", onLightSettings as EventListener);
    const onExportGlb = () => {
      const scrubbed: Array<{
        target: any;
        key: string;
        hadOwn: boolean;
        descriptor?: PropertyDescriptor;
        value: any;
      }> = [];
      const scrubbedMethods: Array<{ target: any; key: string; value: any }> = [];
      let exportFallbackTexture: DynamicTexture | null = null;
      const collectPropertyNames = (obj: any) => {
        const names = new Set<string>();
        let current = obj;
        for (let depth = 0; depth < 3; depth += 1) {
          if (!current || current === Object.prototype) break;
          Object.getOwnPropertyNames(current).forEach((name) => names.add(name));
          current = Object.getPrototypeOf(current);
        }
        return names;
      };
      const isTextureKey = (key: string) => /texture$/i.test(key);
      const getFallbackTexture = () => {
        if (exportFallbackTexture) return exportFallbackTexture;
        exportFallbackTexture = new DynamicTexture("exportFallbackTexture", { width: 1, height: 1 }, scene, false);
        const ctx = exportFallbackTexture.getContext();
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.fillRect(0, 0, 1, 1);
        exportFallbackTexture.update();
        return exportFallbackTexture;
      };
      const setFallbackTexture = (target: any, key: string, value: any) => {
        const hadOwn = Object.prototype.hasOwnProperty.call(target, key);
        const descriptor = Object.getOwnPropertyDescriptor(target, key);
        scrubbed.push({ target, key, hadOwn, descriptor, value });
        const fallback = getFallbackTexture();
        try {
          target[key] = fallback;
          return;
        } catch {}
        try {
          Object.defineProperty(target, key, {
            value: fallback,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        } catch {}
      };
      const scrubMaterials = () => {
        scene.materials.forEach((mat) => {
          const target = mat as any;
          const keys = collectPropertyNames(target);
          keys.forEach((key) => {
            if (!isTextureKey(key)) return;
            let value: any;
            try {
              value = target[key];
            } catch {
              return;
            }
            if (value === null) {
              setFallbackTexture(target, key, value);
              return;
            }
            if (value && typeof value.getInternalTexture === "function") {
              try {
                let internal = value.getInternalTexture();
                if (!internal && value instanceof DynamicTexture) {
                  value.update(true);
                  internal = value.getInternalTexture();
                }
                if (!internal) {
                  const className = value.getClassName?.();
                  if (className === "RenderTargetTexture") {
                    setFallbackTexture(target, key, value);
                  } else {
                    setFallbackTexture(target, key, value);
                  }
                }
              } catch {
                setFallbackTexture(target, key, value);
              }
            }
          });

          if (Array.isArray(target.subMaterials) && target.subMaterials.some((m: any) => m == null)) {
            scrubbed.push({
              target,
              key: "subMaterials",
              hadOwn: Object.prototype.hasOwnProperty.call(target, "subMaterials"),
              descriptor: Object.getOwnPropertyDescriptor(target, "subMaterials"),
              value: target.subMaterials,
            });
            target.subMaterials = target.subMaterials.filter((m: any) => m != null);
          }
          if (typeof target.getActiveTextures === "function") {
            scrubbedMethods.push({ target, key: "getActiveTextures", value: target.getActiveTextures });
            target.getActiveTextures = () => {
              try {
                const active = scrubbedMethods[scrubbedMethods.length - 1].value.call(target) ?? [];
                return active.filter((tex: any) => tex != null);
              } catch {
                return [];
              }
            };
          }
        });
      };
      const restoreMaterials = () => {
        scrubbed.forEach(({ target, key, hadOwn, descriptor, value }) => {
          if (!hadOwn) {
            try {
              delete target[key];
              return;
            } catch {}
          }
          if (descriptor) {
            try {
              Object.defineProperty(target, key, descriptor);
              return;
            } catch {}
          }
          try {
            target[key] = value;
          } catch {}
        });
        scrubbedMethods.forEach(({ target, key, value }) => {
          try {
            target[key] = value;
          } catch {}
        });
        if (exportFallbackTexture) {
          exportFallbackTexture.dispose();
          exportFallbackTexture = null;
        }
      };
      scrubMaterials();
      GLTF2Export.GLBAsync(scene, "jacuzzi-city", { exportWithoutWaitingForScene: true })
        .then((result) => {
          const file = result.glTFFiles["jacuzzi-city.glb"];
          if (file) {
            const blob = typeof file === "string" ? new Blob([file]) : file;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "jacuzzi-city.glb";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            return;
          }
          result.downloadFiles();
        })
        .catch((err) => {
          console.error("[export glb] failed", err);
        })
        .finally(restoreMaterials);
    };
    window.addEventListener("export-glb", onExportGlb as EventListener);
    const onPerfSettings = (evt: Event) => {
      const detail = (evt as CustomEvent<any>).detail;
      if (!detail) return;
      setPerfSettings((prev: any) => ({
        glow: typeof detail.glow === "boolean" ? detail.glow : prev.glow,
        postFx: typeof detail.postFx === "boolean" ? detail.postFx : prev.postFx,
        collisions: typeof detail.collisions === "boolean" ? detail.collisions : prev.collisions,
        windowFlicker: typeof detail.windowFlicker === "boolean" ? detail.windowFlicker : prev.windowFlicker,
        gargoyles: typeof detail.gargoyles === "boolean" ? detail.gargoyles : prev.gargoyles,
      }));
      if (typeof detail.glow === "boolean") {
        glowLayer.isEnabled = detail.glow;
      }
      if (typeof detail.postFx === "boolean") {
        (pipeline as any).enabled = detail.postFx && postFxSettings.enabled;
      }
      if (typeof detail.collisions === "boolean") {
        scene.collisionsEnabled = detail.collisions;
        camera.checkCollisions = detail.collisions;
        buildingMeshes.forEach((mesh) => {
          mesh.checkCollisions = detail.collisions;
        });
      }
    };
    window.addEventListener("performance-settings", onPerfSettings as EventListener);
    // Cloud settings handler removed (setCloudMaskSettings is not in scope here).
    // If you reintroduce cloud masks, wire a handler here via props/context and add/remove the event listener.
    const onPostFxSettings = (evt: Event) => {
      const detail = (evt as CustomEvent<any>).detail;
      if (!detail) return;
      setPostFxSettings((prev: any) => ({
        enabled: typeof detail.enabled === "boolean" ? detail.enabled : prev.enabled,
        depthOfFieldEnabled:
          typeof detail.depthOfFieldEnabled === "boolean"
            ? detail.depthOfFieldEnabled
            : prev.depthOfFieldEnabled,
        depthOfFieldFocusDistance:
          typeof detail.depthOfFieldFocusDistance === "number"
            ? detail.depthOfFieldFocusDistance
            : prev.depthOfFieldFocusDistance,
        depthOfFieldFStop:
          typeof detail.depthOfFieldFStop === "number" ? detail.depthOfFieldFStop : prev.depthOfFieldFStop,
        depthOfFieldBlurLevel:
          typeof detail.depthOfFieldBlurLevel === "number"
            ? detail.depthOfFieldBlurLevel
            : prev.depthOfFieldBlurLevel,
        colorGradingEnabled:
          typeof detail.colorGradingEnabled === "boolean"
            ? detail.colorGradingEnabled
            : prev.colorGradingEnabled,
        globalHue: typeof detail.globalHue === "number" ? detail.globalHue : prev.globalHue,
        globalDensity: typeof detail.globalDensity === "number" ? detail.globalDensity : prev.globalDensity,
        globalSaturation:
          typeof detail.globalSaturation === "number" ? detail.globalSaturation : prev.globalSaturation,
        globalExposure: typeof detail.globalExposure === "number" ? detail.globalExposure : prev.globalExposure,
        highlightsHue:
          typeof detail.highlightsHue === "number" ? detail.highlightsHue : prev.highlightsHue,
        highlightsDensity:
          typeof detail.highlightsDensity === "number" ? detail.highlightsDensity : prev.highlightsDensity,
        highlightsSaturation:
          typeof detail.highlightsSaturation === "number"
            ? detail.highlightsSaturation
            : prev.highlightsSaturation,
        shadowsHue: typeof detail.shadowsHue === "number" ? detail.shadowsHue : prev.shadowsHue,
        shadowsDensity:
          typeof detail.shadowsDensity === "number" ? detail.shadowsDensity : prev.shadowsDensity,
        shadowsSaturation:
          typeof detail.shadowsSaturation === "number" ? detail.shadowsSaturation : prev.shadowsSaturation,
      }));
      applyPostFx(detail);
    };
    window.addEventListener("postfx-settings", onPostFxSettings as EventListener);
    const onAssetToggles = (evt: Event) => {
      const detail = (evt as CustomEvent<any>).detail;
      if (!detail) return;
      const nextToggles = {
        glowSculptures:
          typeof detail.glowSculptures === "boolean" ? detail.glowSculptures : assetTogglesRef.current.glowSculptures,
        cats: typeof detail.cats === "boolean" ? detail.cats : assetTogglesRef.current.cats,
        neonBillboards:
          typeof detail.neonBillboards === "boolean" ? detail.neonBillboards : assetTogglesRef.current.neonBillboards,
        clouds: typeof detail.clouds === "boolean" ? detail.clouds : assetTogglesRef.current.clouds,
        airplanes: typeof detail.airplanes === "boolean" ? detail.airplanes : assetTogglesRef.current.airplanes,
      };
      setAssetToggles(nextToggles);
      groundGlowShapesRef.current.forEach((shape) => shape.setEnabled(nextToggles.glowSculptures));
      catRootsRef.current.forEach((root) => root.setEnabled(nextToggles.cats));
      signPoleRef.current.forEach((root) => root.setEnabled(nextToggles.neonBillboards));
      planeRootsRef.current.forEach((root) => root.setEnabled(nextToggles.airplanes));
      planeTrailsRef.current.forEach((trail) => {
        if (trail?.setEnabled) trail.setEnabled(nextToggles.airplanes);
      });
    };
    window.addEventListener("asset-toggles", onAssetToggles as EventListener);
    const onAtmosphereProps = (evt: Event) => {
        const detail = (evt as CustomEvent<any>).detail;
        if (!detail) return;
        setAtmosphereProps((prev: any) => ({
          enabled: typeof detail.enabled === "boolean" ? detail.enabled : prev.enabled,
          count: typeof detail.count === "number" ? detail.count : prev.count,
          seed: typeof detail.seed === "number" ? detail.seed : prev.seed,
          horror: typeof detail.horror === "boolean" ? detail.horror : prev.horror,
          action: typeof detail.action === "boolean" ? detail.action : prev.action,
          thriller: typeof detail.thriller === "boolean" ? detail.thriller : prev.thriller,
          dystopian: typeof detail.dystopian === "boolean" ? detail.dystopian : prev.dystopian,
          neon: typeof detail.neon === "boolean" ? detail.neon : prev.neon,
        }));
      };
      window.addEventListener("atmosphere-props-settings", onAtmosphereProps as EventListener);
      const onRealismSettings = (evt: Event) => {
        const detail = (evt as CustomEvent<any>).detail;
        if (!detail) return;
        setRealismSettings((prev: any) => ({ ...prev, ...detail }));
    };
    window.addEventListener("realism-settings", onRealismSettings as EventListener);
    const onWalkInput = (evt: Event) => {
      const detail = (evt as CustomEvent<{ active?: boolean }>).detail;
      const active = !!detail?.active;
      walkInputActiveRef.current = active;
      setWalkInputActive(active);
      updateRollerSparkles();
    };
    window.addEventListener("walk-input", onWalkInput as EventListener);
    const onStarSettings = (evt: Event) => {
      const { detail } = evt as CustomEvent<any>;
      if (!detail) return;
      setStarSettings((prev: any) => {
        const {
          enabled,
          count,
          radius,
          minHeight,
          maxHeight,
          scale,
        } = detail as {
          enabled?: boolean;
          count?: number;
          radius?: number;
          minHeight?: number;
          maxHeight?: number;
          scale?: number;
        };
        return {
          enabled: typeof enabled === "boolean" ? enabled : prev.enabled,
          count: typeof count === "number" ? count : prev.count,
          radius: typeof radius === "number" ? radius : prev.radius,
          minHeight: typeof minHeight === "number" ? minHeight : prev.minHeight,
          maxHeight: typeof maxHeight === "number" ? maxHeight : prev.maxHeight,
          scale: typeof scale === "number" ? scale : prev.scale,
        };
      });
    };
    window.addEventListener("star-settings", onStarSettings as EventListener);
    const onBuildingSettings = (evt: Event) => {
      const detail = (evt as CustomEvent<any>).detail;
      if (!detail) return;
      if (typeof detail.seed === "number") buildingSeedState.value = detail.seed;
      if (typeof detail.count === "number") buildingCountState.value = detail.count;
      if (typeof detail.scale === "number") buildingScaleState.value = detail.scale;
      scheduleRebuildBuildings();
    };
    window.addEventListener("building-settings", onBuildingSettings as EventListener);
    const onTreePositions = (evt: Event) => {
      const detail = (evt as CustomEvent<{ x: number; y: number; z: number }[]>).detail;
      if (!detail || !Array.isArray(detail)) return;
      setTreePositions(detail.map((p) => new Vector3(p.x, p.y, p.z)));
    };
    window.addEventListener("tree-positions", onTreePositions as EventListener);


    // Procedural buildings (simple boxes with varied heights)
    const createBuildingMaterial = (
      name: string,
      facadeUrl: string,
      windowOn: string,
      windowOff: string,
      rand: () => number
    ) => {
      const mat = new StandardMaterial(name, scene);
      const facade = new Texture(facadeUrl, scene);
      facade.wrapU = Texture.WRAP_ADDRESSMODE;
      facade.wrapV = Texture.WRAP_ADDRESSMODE;
      facade.uScale = 6;
      facade.vScale = 10;

      const winTex = new DynamicTexture(`${name}_windows`, { width: 512, height: 512 }, scene, false);
      const ctx = winTex.getContext();
      const size = winTex.getSize();
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fillRect(0, 0, size.width, size.height);
        const pickWindowColor = () => {
          const roll = rand();
          if (roll < 0.3) return "#ffb347"; // amber (30%)
          if (roll < 0.6) return "#ffe066"; // yellow (30%)
          if (roll < 0.7) return "#b27dff"; // purple (10%)
          if (roll < 0.8) return "#6bb7ff"; // blue (10%)
          if (roll < 0.9) return "#ff5f6d"; // red (10%)
          return "#f7f4ea"; // warm white (10%)
        };
      const windowOffPalette = ["#0a0d12", "#10131a", "#0b0f16", "#0f1218"];
      const windowRects: {
        x: number;
        y: number;
        w: number;
        h: number;
        lit: boolean;
        onColor: string;
        offColor: string;
      }[] = [];
      let y = 20;
      while (y < size.height - 30) {
        const winH = 18 + Math.floor(rand() * 14);
        const gapY = 8 + Math.floor(rand() * 12);
        let x = 16;
        while (x < size.width - 28) {
          const winW = 12 + Math.floor(rand() * 18);
          const gapX = 6 + Math.floor(rand() * 12);
            const lit = rand() > 0.15;
          const litColor = pickWindowColor();
          const offColor = windowOffPalette[Math.floor(rand() * windowOffPalette.length)];
          ctx.fillStyle = lit ? litColor : offColor;
          ctx.fillRect(x, y, winW, winH);
          windowRects.push({ x, y, w: winW, h: winH, lit, onColor: litColor, offColor });
          x += winW + gapX;
        }
        y += winH + gapY;
      }
      winTex.update();
      winTex.uScale = 1.0;
      winTex.vScale = 2.4;

      mat.diffuseTexture = facade;
      mat.diffuseColor = new Color3(0.55, 0.55, 0.55);
      mat.emissiveTexture = winTex;
      mat.emissiveColor = new Color3(0, 0, 0);
      mat.specularColor = new Color3(0.04, 0.04, 0.04);
      mat.ambientColor = new Color3(0.08, 0.1, 0.14);
      mat.useAlphaFromDiffuseTexture = false;
      mat.alpha = 1;
      mat.transparencyMode = Material.MATERIAL_OPAQUE;
      (mat as any).metadata = { facadeTex: facade, windowTex: winTex, windowRects, windowOn, windowOff, ctx };
      return mat;
    };

    let buildingMeshes: any[] = [];
    let buildingMats: StandardMaterial[] = [];
    let buildingNeonMeshes: Mesh[] = [];
    let buildingNeonMats: StandardMaterial[] = [];
    let neonFrameTex: DynamicTexture | null = null;

    // Cache reusable building materials and neon frame texture across rebuilds
    const cachedBuildingMatsRef = { current: [] as StandardMaterial[] };
    let cachedNeonFrameTex: DynamicTexture | null = null;
    const makeRng = (seed: number) => {
      let t = seed >>> 0;
      return () => {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
    };

    const roadHalfWidth = 35;
    const crossHalfWidth = 30;
    const roadBuffer = 4;
    const isNearRoad = (x: number, z: number) =>
      zRoads.some((zr) => Math.abs(z - zr) < roadHalfWidth + roadBuffer) ||
      xRoads.some((xr) => Math.abs(x - xr) < crossHalfWidth + roadBuffer);

    const applyBuildingTiling = () => {
      buildingMats.forEach((mat) => {
        const tex = mat.diffuseTexture as Texture | null;
        if (!tex) return;
        tex.uScale = buildingTilingState.u;
        tex.vScale = buildingTilingState.v;
      });
    };

    const farBuildingDistance = 600;
    const veryFarBuildingDistance = 900;

    const rebuildBuildings = (seed: number, count: number, scale: number) => {
      // Dispose meshes only; reuse cached materials/textures
      buildingMeshes.forEach((mesh) => mesh.dispose());
      buildingMeshes = [];
      buildingNeonMeshes.forEach((mesh) => mesh.dispose());
      buildingNeonMeshes = [];
      buildingNeonMats.forEach((mat) => mat.dispose(true, true));
      buildingNeonMats = [];

      const rand = makeRng(seed);
      const newBuildingInfos: BuildingInfo[] = [];
      const isNearSign = (x: number, z: number) =>
        signPositions.some((s) => {
          const dx = x - s.x;
          const dz = z - s.z;
          return dx * dx + dz * dz < 20 * 20;
        });
      if (cachedBuildingMatsRef.current.length === 0) {
        cachedBuildingMatsRef.current = [
          createBuildingMaterial("buildingMat_brick", "/textures/building_brick.jpg", "#c9c9c9", "#10131a", rand),
          createBuildingMaterial("buildingMat_concrete", "/textures/building_concrete.jpg", "#c9c9c9", "#0a0d12", rand),
          createBuildingMaterial("buildingMat_modern", "/textures/building_facade.jpg", "#c9c9c9", "#0a0d12", rand),
          createBuildingMaterial("buildingMat_sand", "/textures/building_concrete.jpg", "#c9c9c9", "#0a0b10", rand),
        ];
      }
      buildingMats = cachedBuildingMatsRef.current;

      if (!cachedNeonFrameTex) {
        cachedNeonFrameTex = new DynamicTexture("neonFrameTex", { width: 256, height: 256 }, scene, false);
        const frameCtx = cachedNeonFrameTex.getContext() as CanvasRenderingContext2D;
        frameCtx.clearRect(0, 0, 256, 256);
        frameCtx.strokeStyle = "rgba(0, 0, 0, 0.9)";
        frameCtx.lineWidth = 24;
        frameCtx.strokeRect(18, 18, 220, 220);
        frameCtx.strokeStyle = "rgba(255, 209, 102, 1)";
        frameCtx.lineWidth = 10;
        frameCtx.strokeRect(24, 24, 208, 208);
        cachedNeonFrameTex.update();
        cachedNeonFrameTex.hasAlpha = true;
      }
      neonFrameTex = cachedNeonFrameTex;
      const neonFrameMat = new StandardMaterial("neonFrameMat", scene);
      neonFrameMat.diffuseTexture = neonFrameTex;
      neonFrameMat.opacityTexture = neonFrameTex;
      neonFrameMat.emissiveTexture = neonFrameTex;
      neonFrameMat.emissiveColor = new Color3(1, 0.85, 0.35);
      neonFrameMat.disableLighting = true;
      neonFrameMat.backFaceCulling = false;
      neonFrameMat.transparencyMode = Material.MATERIAL_ALPHABLEND;
      buildingNeonMats.push(neonFrameMat);
      const neonColors = [
        new Color3(1.0, 0.25, 0.8),
        new Color3(0.1, 0.9, 1.0),
        new Color3(0.3, 1.0, 0.6),
        new Color3(1.0, 0.55, 0.2),
        new Color3(0.85, 0.3, 0.95),
        new Color3(0.95, 0.2, 0.35),
      ];
      const neonPanelMats = neonColors.map((color, index) => {
        const mat = new StandardMaterial(`neonPanelMat_${index}`, scene);
        mat.emissiveColor = color;
        mat.diffuseColor = color.scale(0.2);
        mat.disableLighting = true;
        mat.backFaceCulling = false;
        mat.transparencyMode = Material.MATERIAL_ALPHABLEND;
        mat.alpha = 0.95;
        buildingNeonMats.push(mat);
        return mat;
      });
      const enableBuildingNeonPanels = false;
      for (let i = 0; i < count; i++) {
        const shapeRoll = rand();
        let w = 0;
        let d = 0;
        let h = 0;
        if (shapeRoll < 0.2) {
          w = 6 + rand() * 10;
          d = 6 + rand() * 10;
          h = 70 + rand() * 150;
        } else if (shapeRoll < 0.4) {
          w = 24 + rand() * 40;
          d = 24 + rand() * 40;
          h = 18 + rand() * 50;
        } else if (shapeRoll < 0.6) {
          w = 10 + rand() * 18;
          d = 22 + rand() * 46;
          h = 30 + rand() * 90;
        } else {
          w = 8 + rand() * 24;
          d = 8 + rand() * 24;
          h = 16 + rand() * 90;
        }
        w *= scale;
        d *= scale;
        h *= scale;
        const b = MeshBuilder.CreateBox(`building_${i}`, { width: w, depth: d, height: h }, scene);
        let x = 0;
        let z = 0;
        let attempts = 0;
        do {
          x = (rand() - 0.5) * 760;
          z = (rand() - 0.5) * 760 - 120;
          attempts += 1;
        } while ((isNearRoad(x, z) || isNearSign(x, z)) && attempts < 40);
        b.position = new Vector3(x, h / 2, z);
        b.rotation.y = rand() * Math.PI * 2;
        b.material = buildingMats[Math.floor(rand() * buildingMats.length)];
        b.isPickable = false;
        b.checkCollisions = true;
        if (enableBuildingNeonPanels && rand() < 0.15) {
          const face = Math.floor(rand() * 4);
          const panelWidth = Math.max(6 * scale, Math.min(w * 0.9, 26 * scale));
          const panelHeight = Math.max(4 * scale, Math.min(h * 0.25, 12 * scale));
          const panelY = Math.min(6 * scale, h * 0.2);
          const normal = new Vector3(0, 0, 1);
          let rotationY = 0;
          if (face === 1) {
            normal.z = -1;
            rotationY = Math.PI;
          } else if (face === 2) {
            normal.x = 1;
            normal.z = 0;
            rotationY = Math.PI / 2;
          } else if (face === 3) {
            normal.x = -1;
            normal.z = 0;
            rotationY = -Math.PI / 2;
          }
          const panel = MeshBuilder.CreatePlane(`building_neon_${i}`, { width: panelWidth, height: panelHeight }, scene);
          panel.parent = b;
          panel.material = neonPanelMats[Math.floor(rand() * neonPanelMats.length)];
          panel.isPickable = false;
          panel.position = new Vector3(normal.x * (w / 2 + 0.12), panelY, normal.z * (d / 2 + 0.12));
          panel.rotation.y = rotationY;
          buildingNeonMeshes.push(panel);

          const frame = MeshBuilder.CreatePlane(
            `building_neon_frame_${i}`,
            { width: panelWidth * 1.08, height: panelHeight * 1.08 },
            scene
          );
          frame.parent = b;
          frame.material = neonFrameMat;
          frame.isPickable = false;
          frame.position = new Vector3(
            normal.x * (w / 2 + 0.18),
            panelY,
            normal.z * (d / 2 + 0.18)
          );
          frame.rotation.y = rotationY;
          buildingNeonMeshes.push(frame);
        }
        const collider = MeshBuilder.CreateBox(
          `building_collider_${i}`,
          { width: w * 1.1, depth: d * 1.1, height: h * 1.1 },
          scene
        );
        collider.isVisible = false;
        collider.checkCollisions = true;
        collider.parent = b;
        collider.position = new Vector3(0, 0, 0);

        // Attach LOD metadata: collider + neon panels for this building
        (b as any)._lodData = {
          collider,
          neonPanels: buildingNeonMeshes.filter((m) => m.parent === b),
        };

        buildingMeshes.push(b);
        newBuildingInfos.push({ mesh: b, width: w, depth: d, height: h });
      }
      applyBuildingTiling();
      setBuildingMaterials([...buildingMats]);
        buildingInfosRef.current = [...newBuildingInfos];
        setBuildingInfos(newBuildingInfos);
        const maxHeight = newBuildingInfos.length
          ? Math.max(...newBuildingInfos.map((b) => b.height))
          : 120;
        setShootingStarSettings((prev: any) => {
          const minHeight = Math.max(220, maxHeight + 60);
          const maxHeightBound = Math.max(minHeight + 140, maxHeight + 320);
          return {
            ...prev,
            minHeight,
            maxHeight: maxHeightBound,
          };
        });
      };

    const buildingSeedState = { value: 4864 };
    const buildingCountState = { value: 800 };
    const buildingScaleState = { value: 1.4 };
    let rebuildBuildingsTimer: number | null = null;

    const scheduleRebuildBuildings = () => {
      if (rebuildBuildingsTimer != null) {
        window.clearTimeout(rebuildBuildingsTimer);
      }
      rebuildBuildingsTimer = window.setTimeout(() => {
        rebuildBuildings(
          buildingSeedState.value,
          buildingCountState.value,
          buildingScaleState.value
        );
      }, 120);
    };

    rebuildBuildings(buildingSeedState.value, buildingCountState.value, buildingScaleState.value);


    // Street props and neon set dressing
    const metalMat = new StandardMaterial("metalMat", scene);
    metalMat.diffuseColor = new Color3(0.16, 0.18, 0.26);
    metalMat.specularColor = new Color3(0.3, 0.3, 0.4);

    const neonCyan = new StandardMaterial("neonCyan", scene);
    neonCyan.emissiveColor = new Color3(0.1, 0.9, 1.0);
    neonCyan.diffuseColor = new Color3(0.1, 0.6, 0.7);
    neonCyan.backFaceCulling = false;

    const neonMagenta = new StandardMaterial("neonMagenta", scene);
    neonMagenta.emissiveColor = new Color3(1.0, 0.25, 0.8);
    neonMagenta.diffuseColor = new Color3(0.6, 0.1, 0.5);
    neonMagenta.backFaceCulling = false;

    const neonGreen = new StandardMaterial("neonGreen", scene);
    neonGreen.emissiveColor = new Color3(0.3, 1.0, 0.6);
    neonGreen.diffuseColor = new Color3(0.1, 0.5, 0.3);

    // Lamp post lights removed for performance.

    // Neon billboards
    const signBulbMats: StandardMaterial[] = [];
    const addBillboardBulbs = (
      sign: any,
      width: number,
      height: number,
      color: Color3,
      namePrefix: string,
      zOffset: number
    ) => {
      const bulbMat = new StandardMaterial(`${namePrefix}_bulbMat`, scene);
      bulbMat.emissiveColor = color;
      bulbMat.diffuseColor = color.scale(0.3);
      bulbMat.disableLighting = true;
      signBulbMats.push(bulbMat);

      const halfW = width / 2;
      const halfH = height / 2;
      const baseSpacing = 4;
      const spacing = isTouchDevice ? baseSpacing * 1.5 : baseSpacing;

      // Single source mesh, instances for all bulbs
      const bulbSource = MeshBuilder.CreateSphere(`${namePrefix}_bulb_src`, { diameter: 1.1 }, scene);
      bulbSource.material = bulbMat;
      bulbSource.isVisible = false;

      let idx = 0;
      for (let x = -halfW; x <= halfW; x += spacing) {
        const top = bulbSource.createInstance(`${namePrefix}_bulb_top_${idx}`);
        top.parent = sign;
        top.position = new Vector3(x, halfH, zOffset);
        glowLayer.addExcludedMesh(top as unknown as Mesh);

        const bottom = bulbSource.createInstance(`${namePrefix}_bulb_bottom_${idx}`);
        bottom.parent = sign;
        bottom.position = new Vector3(x, -halfH, zOffset);
        glowLayer.addExcludedMesh(bottom as unknown as Mesh);
        idx += 1;
      }
      for (let y = -halfH + spacing; y <= halfH - spacing; y += spacing) {
        const left = bulbSource.createInstance(`${namePrefix}_bulb_left_${idx}`);
        left.parent = sign;
        left.position = new Vector3(-halfW, y, zOffset);
        glowLayer.addExcludedMesh(left as unknown as Mesh);

        const right = bulbSource.createInstance(`${namePrefix}_bulb_right_${idx}`);
        right.parent = sign;
        right.position = new Vector3(halfW, y, zOffset);
        glowLayer.addExcludedMesh(right as unknown as Mesh);
        idx += 1;
      }
    };
    const signTexA = createNeonSignTexture("signTexA", "Welcome to Jacuzzi City!", "#6af6ff", true);
    const signMatA = new StandardMaterial("signMatA", scene);
    signMatA.diffuseTexture = signTexA;
    signMatA.diffuseColor = new Color3(1, 1, 1);
    signMatA.emissiveColor = new Color3(0, 0, 0);
    signMatA.disableLighting = false;
    signMatA.backFaceCulling = false;
    const signPoleA = MeshBuilder.CreateCylinder("billboard_pole_a", { height: 92, diameter: 1.6 }, scene);
    signPoleA.position = new Vector3(-120, 46, 20);
    signPoleA.material = metalMat;
    const signAGroup = new TransformNode("billboard_a_group", scene);
    signAGroup.parent = signPoleA;
    signAGroup.position = new Vector3(0, 55, 0);
    const signA = MeshBuilder.CreatePlane("billboard_a", { width: 50, height: 18 }, scene);
    signA.rotation = new Vector3(0, Math.PI / 6, 0);
    signA.material = signMatA;
    glowLayer.addExcludedMesh(signA);
    signA.parent = signAGroup;
    signA.position.z = 0.12;
    const signA_back = MeshBuilder.CreatePlane("billboard_a_back", { width: 50, height: 18 }, scene);
    signA_back.rotation = new Vector3(0, Math.PI / 6 + Math.PI, 0);
    signA_back.material = signMatA;
    glowLayer.addExcludedMesh(signA_back);
    signA_back.parent = signAGroup;
    signA_back.position.z = -0.12;
    const signA_black = MeshBuilder.CreatePlane("billboard_a_black", { width: 50, height: 18 }, scene);
    signA_black.material = metalMat;
    glowLayer.addExcludedMesh(signA_black);
    signA_black.parent = signAGroup;
    signA_black.rotation = new Vector3(0, Math.PI / 6 + Math.PI, 0);
    signA_black.position.z = -0.16;
    addBillboardBulbs(signA, 50, 18, new Color3(1.0, 0.7, 0.2), "signA_front", 0.6);
    addBillboardBulbs(signA_back, 50, 18, new Color3(1.0, 0.7, 0.2), "signA_back", 0.6);

    const signTexB = createNeonSignTexture("signTexB", "Welcome to Jacuzzi City!", "#ff6bd6", true);
    const signMatB = new StandardMaterial("signMatB", scene);
    signMatB.diffuseTexture = signTexB;
    signMatB.diffuseColor = new Color3(1, 1, 1);
    signMatB.emissiveColor = new Color3(0, 0, 0);
    signMatB.disableLighting = false;
    signMatB.backFaceCulling = false;
    const signPoleB = MeshBuilder.CreateCylinder("billboard_pole_b", { height: 84, diameter: 1.6 }, scene);
    signPoleB.position = new Vector3(180, 42, 10);
    signPoleB.material = metalMat;
    const signBGroup = new TransformNode("billboard_b_group", scene);
    signBGroup.parent = signPoleB;
    signBGroup.position = new Vector3(0, 50, 0);
    const signB = MeshBuilder.CreatePlane("billboard_b", { width: 46, height: 16 }, scene);
    signB.rotation = new Vector3(0, -Math.PI / 5, 0);
    signB.material = signMatB;
    glowLayer.addExcludedMesh(signB);
    signB.parent = signBGroup;
    signB.position.z = 0.12;
    const signB_back = MeshBuilder.CreatePlane("billboard_b_back", { width: 46, height: 16 }, scene);
    signB_back.rotation = new Vector3(0, -Math.PI / 5 + Math.PI, 0);
    signB_back.material = signMatB;
    glowLayer.addExcludedMesh(signB_back);
    signB_back.parent = signBGroup;
    signB_back.position.z = -0.12;
    const signB_black = MeshBuilder.CreatePlane("billboard_b_black", { width: 46, height: 16 }, scene);
    signB_black.material = metalMat;
    glowLayer.addExcludedMesh(signB_black);
    signB_black.parent = signBGroup;
    signB_black.rotation = new Vector3(0, -Math.PI / 5 + Math.PI, 0);
    signB_black.position.z = -0.16;
    addBillboardBulbs(signB, 46, 16, new Color3(1.0, 0.7, 0.2), "signB_front", 0.6);
    addBillboardBulbs(signB_back, 46, 16, new Color3(1.0, 0.7, 0.2), "signB_back", 0.6);
    signPoleRef.current = [signPoleA, signPoleB];
    signPoleRef.current.forEach((root) => root.setEnabled(assetTogglesRef.current.neonBillboards));

    const adsEnabled = false;
    const adNames = [
      "Fellowship! (10).jpg",
      "Fellowship! (103).jpg",
      "Fellowship! (117).jpg",
      "Fellowship! (125).jpg",
      "Fellowship! (126).jpg",
      "Fellowship! (127).jpg",
      "Fellowship! (13).jpg",
      "Fellowship! (131).jpg",
      "Fellowship! (134).jpg",
      "Fellowship! (137).jpg",
      "Fellowship! (138).jpg",
      "Fellowship! (144).jpg",
      "Fellowship! (145).jpg",
      "Fellowship! (148).jpg",
      "Fellowship! (172).jpg",
      "Fellowship! (179).jpg",
      "Fellowship! (18).jpg",
      "Fellowship! (188).jpg",
      "Fellowship! (195).jpg",
      "Fellowship! (196).jpg",
      "Fellowship! (199).jpg",
      "Fellowship! (202).jpg",
      "Fellowship! (208).jpg",
      "Fellowship! (215).jpg",
      "Fellowship! (223).jpg",
      "Fellowship! (224).jpg",
      "Fellowship! (237).jpg",
      "Fellowship! (241).jpg",
      "Fellowship! (246).jpg",
      "Fellowship! (253).jpg",
      "Fellowship! (256).jpg",
      "Fellowship! (257).jpg",
      "Fellowship! (260).jpg",
      "Fellowship! (277).jpg",
      "Fellowship! (282).jpg",
      "Fellowship! (290).jpg",
      "Fellowship! (32).jpg",
      "Fellowship! (34).jpg",
      "Fellowship! (43).jpg",
      "Fellowship! (5).jpg",
      "Fellowship! (54).jpg",
      "Fellowship! (57).jpg",
      "Fellowship! (7).jpg",
      "Fellowship! (94).jpg",
    ];
    const adPlaneBaseHeight = 18;
    const adSettings = {
      x: 425,
      y: 330,
      z: 45,
      scale: 10,
      rotX: (28 * Math.PI) / 180,
      rotY: (-90 * Math.PI) / 180,
      rotZ: (180 * Math.PI) / 180,
    };
    const adAnchor = new Vector3(adSettings.x, adSettings.y, adSettings.z);
    const adPlane = MeshBuilder.CreatePlane("ad_plane_main", { width: adPlaneBaseHeight, height: adPlaneBaseHeight }, scene);
    adPlane.position = adAnchor.clone();
    adPlane.rotation = new Vector3(adSettings.rotX, adSettings.rotY, adSettings.rotZ);
    adPlane.checkCollisions = false;
    const adMaterial = new StandardMaterial("ad_plane_main_mat", scene);
    adMaterial.emissiveColor = new Color3(0.4, 0.4, 0.4);
    adMaterial.backFaceCulling = false;
    adMaterial.disableLighting = true;
    adPlane.material = adMaterial;
    glowLayer.addExcludedMesh(adPlane);

    const shuffledAds = [...adNames];
    for (let i = shuffledAds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledAds[i], shuffledAds[j]] = [shuffledAds[j], shuffledAds[i]];
    }
    let adIndex = 0;
    let currentAdTexture: Texture | null = null;
    const applyAdTexture = (name: string) => {
      const adUrl = encodeURI(`/ads/small/${name}`);
      const tex = new Texture(adUrl, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE, () => {
        const size = tex.getSize();
        if (size.height > 0) {
          const aspect = size.width / size.height;
          adPlane.scaling.x = adSettings.scale * aspect;
          adPlane.scaling.y = adSettings.scale;
          adPlane.scaling.z = adSettings.scale;
          adPlane.rotation.set(adSettings.rotX, adSettings.rotY, adSettings.rotZ);
        }
        const previous = currentAdTexture;
        currentAdTexture = tex;
        adMaterial.diffuseTexture = tex;
        adMaterial.emissiveTexture = tex;
        if (previous && previous !== tex) previous.dispose();
      });
    };
    let adTimer: number | null = null;
    if (adsEnabled) {
      applyAdTexture(shuffledAds[adIndex]);
      adTimer = window.setInterval(() => {
        adIndex = (adIndex + 1) % shuffledAds.length;
        applyAdTexture(shuffledAds[adIndex]);
      }, 6000);
    } else {
      adPlane.isVisible = false;
    }

    const updateAdTransform = () => {
      adPlane.position.set(adSettings.x, adSettings.y, adSettings.z);
      adPlane.rotation.set(adSettings.rotX, adSettings.rotY, adSettings.rotZ);
      adPlane.scaling.set(adSettings.scale, adSettings.scale, adSettings.scale);
    };
    updateAdTransform();

    // Benches
    for (let i = 0; i < 6; i++) {
      const bench = MeshBuilder.CreateBox(`bench_${i}`, { width: 8, height: 1, depth: 2 }, scene);
      bench.position = new Vector3(-120 + i * 40, 0.6, -90);
      bench.material = metalMat;
    }

    // Crates
    for (let i = 0; i < 80; i++) {
      const crate = MeshBuilder.CreateBox(`crate_${i}`, { size: 3 }, scene);
      crate.position = new Vector3(-60 + (i % 4) * 6, 1.5, 80 + Math.floor(i / 4) * 6);
      crate.material = metalMat;
    }

    // Vent stacks
    for (let i = 0; i < 6; i++) {
      const vent = MeshBuilder.CreateCylinder(`vent_${i}`, { height: 4, diameter: 2.4 }, scene);
      vent.position = new Vector3(-160 + i * 30, 2, 120);
      vent.material = metalMat;
    }

    // Power pylons
    for (let i = 0; i < 8; i++) {
      const pylon = MeshBuilder.CreateBox(`pylon_${i}`, { width: 4, height: 16, depth: 4 }, scene);
      pylon.position = new Vector3(200, 8, -100 + i * 60);
      pylon.material = metalMat;
      const cap = MeshBuilder.CreateBox(`pylon_cap_${i}`, { width: 6, height: 1, depth: 6 }, scene);
      cap.position = new Vector3(200, 16.5, -100 + i * 60);
      cap.material = neonCyan;
    }

    const pickups: { mesh: any; baseY: number; phase: number }[] = [];
    const flickerMats: { mat: StandardMaterial; base: Color3 }[] = [
      { mat: neonCyan, base: new Color3(0.1, 0.9, 1.0) },
      { mat: neonMagenta, base: new Color3(1.0, 0.25, 0.8) },
      { mat: neonGreen, base: new Color3(0.3, 1.0, 0.6) },
      { mat: signMatA, base: new Color3(0.4, 0.8, 1.0) },
      { mat: signMatB, base: new Color3(1.0, 0.35, 0.8) },
    ];
    signBulbMats.forEach((mat) => {
      flickerMats.push({ mat, base: mat.emissiveColor.clone() });
    });

    // NPCs with dialogue
    const npcMat = new StandardMaterial("npcMat", scene);
    npcMat.diffuseColor = new Color3(0.18, 0.2, 0.3);
    npcMat.emissiveColor = new Color3(0.2, 0.6, 1.0);
    const npcIds = ["aria", "kade", "mira", "vex", "lux", "zed"];
    const npcHeight = 5;
    const npcBaseY = npcHeight / 2;
    const npcWalkers: {
      mesh: any;
      angle: number;
      radius: number;
      center: Vector3;
      speed: number;
      baseY: number;
    }[] = [];
    npcIds.forEach((id, idx) => {
      const npc = MeshBuilder.CreateCylinder(`npc_${id}`, { height: npcHeight, diameter: 2.8 }, scene);
      npc.position = new Vector3(-30 + idx * 12, npcBaseY, -60 + (idx % 2) * 10);
      npc.material = npcMat;
      npc.isPickable = true;
      npc.metadata = { type: "npc", id };
      npcWalkers.push({
        mesh: npc,
        angle: Math.random() * Math.PI * 2,
        radius: 2.5 + Math.random() * 2.5,
        center: npc.position.clone(),
        speed: 0.2 + Math.random() * 0.4,
        baseY: npcBaseY,
      });
    });

    const npcDialogueState = { active: false, lastScan: 0 };
    const npcCooldowns = new Map<string, number>();
    const onNpcOpen = (evt: Event) => {
      const detail = (evt as CustomEvent<{ npcId?: string }>).detail;
      npcDialogueState.active = true;
      if (detail?.npcId) npcCooldowns.set(detail.npcId, performance.now());
    };
    const onNpcClose = () => {
      npcDialogueState.active = false;
    };
    window.addEventListener("npc-dialogue-open", onNpcOpen as EventListener);
    window.addEventListener("npc-dialogue-close", onNpcClose as EventListener);

    const npcModelUrls = ["/models/RiggedFigure.glb", "/models/CesiumMan.glb"];
    const npcModelScales = [3.6, 3.2];
    const loadNpcModels = async () => {
      const containers = await Promise.all(
        npcModelUrls.map((url) => SceneLoader.LoadAssetContainerAsync("", url, scene))
      );
      npcWalkers.forEach((npc, idx) => {
        const container = containers[idx % containers.length];
        const scale = npcModelScales[idx % npcModelScales.length];
        const inst = container.instantiateModelsToScene((name) => `${npc.mesh.name}_${name}`);
          inst.rootNodes.forEach((node) => {
            const tnode = node as TransformNode;
            tnode.parent = npc.mesh;
            if ((tnode as any).position) tnode.position = new Vector3(0, -npcBaseY, 0);
            if ((tnode as any).scaling) tnode.scaling = new Vector3(scale, scale, scale);
          });
        if (inst.animationGroups && inst.animationGroups.length > 0) {
          inst.animationGroups.forEach((group) => group.start(true));
        }
        npc.mesh.visibility = 0;
      });
    };
    loadNpcModels();

    // Imported models removed (external URLs 404)

    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== 1) return;
      const pick = pointerInfo.pickInfo;
      if (!pick?.hit || !pick.pickedMesh) return;
      const meta = (pick.pickedMesh as any).metadata;
      if (!meta) return;
      if (meta.type === "pickup") {
        window.dispatchEvent(new CustomEvent("pickup-item", { detail: { item: meta.item } }));
        let root: any = pick.pickedMesh;
        while (root.parent) root = root.parent;
        root.dispose();
        for (let i = pickups.length - 1; i >= 0; i--) {
          if (pickups[i].mesh === root) pickups.splice(i, 1);
        }
      }
      if (meta.type === "npc") {
        window.dispatchEvent(new CustomEvent("npc-dialogue", { detail: { npcId: meta.id } }));
      }
    });

    // Groundcover disabled for neon city vibe

    // Drones (flying) - simple circular paths with bobbing
    const drones: { mesh: any; angle: number; radius: number; center: Vector3; speed: number; height: number }[] = [];
    const getAvoidCenters = () => {
      const buildingCenters = buildingInfosRef.current.map((b) => ({
        position: b.mesh.position,
        radius: Math.max(b.width, b.depth) / 2 + 20,
      }));
      const treeCenters = treePositionsRef.current.map((p) => ({ position: p, radius: 20 }));
      const signCenters = signPositions.map((p) => ({ position: p, radius: 20 }));
      return [...buildingCenters, ...treeCenters, ...signCenters];
    };
    const isNearAvoid = (pos: Vector3, padding = 0) => {
      const centers = getAvoidCenters();
      return centers.some((c) => {
        const dx = pos.x - c.position.x;
        const dz = pos.z - c.position.z;
        const r = c.radius + padding;
        return dx * dx + dz * dz < r * r;
      });
    };
    for (let i = 0; i < 10; i++) {
      const d = MeshBuilder.CreateSphere(`drone_${i}`, { diameter: 1.2 }, scene);
      const mat = new StandardMaterial(`droneMat_${i}`, scene);
      mat.emissiveColor = new Color3(0.3, 0.9, 1.0);
      d.material = mat;
      let center = new Vector3((Math.random() - 0.5) * 260, 0, (Math.random() - 0.5) * 260 - 40);
      const radius = 18 + Math.random() * 80;
      for (let attempt = 0; attempt < 30; attempt += 1) {
        center = new Vector3((Math.random() - 0.5) * 260, 0, (Math.random() - 0.5) * 260 - 40);
        if (!isNearAvoid(center, radius + 20)) break;
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.9 + Math.random() * 1.3) * 0.3;
      const height = 12 + Math.random() * 30;
      drones.push({ mesh: d, angle, radius, center, speed, height });
    }

    // Cats (cat.glb instances) wandering around the city
    const catBounds = { minX: -420, maxX: 420, minZ: -420, maxZ: 420 };
    const cats: { root: TransformNode; dir: Vector3; speed: number; nextTurn: number }[] = [];
    const catRoots: TransformNode[] = [];
    let catContainer: any | null = null;
    const loadCats = async () => {
      let container;
      try {
        container = await SceneLoader.LoadAssetContainerAsync("", "/models/cat.glb", scene);
      } catch {
        return;
      }
      if (scene.isDisposed) {
        container.dispose();
        return;
      }
      catContainer = container;
      container.addAllToScene();
      container.animationGroups.forEach((group) => {
        group.stop();
        group.dispose();
      });
      const baseMeshes = container.meshes.filter((m) => m instanceof Mesh && m.name !== "__root__") as Mesh[];
      baseMeshes.forEach((mesh) => {
        mesh.setEnabled(false);
        mesh.isVisible = false;
      });
      for (let i = 0; i < 40; i += 1) {
        const catRoot = new TransformNode(`cat_${i}`, scene);
        const inst = container.instantiateModelsToScene((name) => `cat_${i}_${name}`);
        inst.rootNodes.forEach((node) => {
          const tnode = node as TransformNode;
          tnode.parent = catRoot;
          if ((tnode as any).position) tnode.position = new Vector3(0, 0, 0);
        });
        inst.animationGroups?.forEach((group) => group.stop());
        catRoot.position = new Vector3(
          catBounds.minX + Math.random() * (catBounds.maxX - catBounds.minX),
          0.1,
          catBounds.minZ + Math.random() * (catBounds.maxZ - catBounds.minZ)
        );
        const scale = 0.7 + Math.random() * 0.5;
        catRoot.scaling = new Vector3(scale, scale, scale);
        catRoots.push(catRoot);
        const dir = new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5);
        dir.normalize();
        cats.push({ root: catRoot, dir, speed: 0.5 + Math.random() * 0.4, nextTurn: performance.now() + 5000 });
      }
      const previewRoot = new TransformNode("cat_preview", scene);
      const previewInst = container.instantiateModelsToScene((name) => `cat_preview_${name}`);
      previewInst.rootNodes.forEach((node) => {
        const tnode = node as TransformNode;
        tnode.parent = previewRoot;
        if ((tnode as any).position) tnode.position = new Vector3(0, 0, 0);
      });
      previewInst.animationGroups?.forEach((group) => group.stop());
      const previewDir = startTarget.subtract(startPos).normalize();
      previewRoot.position = startPos.add(previewDir.scale(8));
      previewRoot.position.y = 0.1;
      previewRoot.scaling = new Vector3(0.9, 0.9, 0.9);
      catRoots.push(previewRoot);
      catRootsRef.current = catRoots;
      catRootsRef.current.forEach((root) => root.setEnabled(assetTogglesRef.current.cats));
    };
    loadCats();

    // Glowing ground shapes
    const groundGlowShapes: Mesh[] = [];
    const glowShapeColliders: { mesh: Mesh; radius: number }[] = [];
    const glowColors = [
      new Color3(0.1, 0.8, 1.0),
      new Color3(1.0, 0.3, 0.7),
      new Color3(0.6, 0.9, 0.2),
      new Color3(1.0, 0.75, 0.2),
      new Color3(0.7, 0.4, 1.0),
    ];
    for (let i = 0; i < 48; i += 1) {
      const type = i % 4;
      let shape: Mesh;
      let baseRadius = 1.5;
      if (type === 0) {
        shape = MeshBuilder.CreateTorus(`glow_torus_${i}`, { diameter: 3, thickness: 0.4, tessellation: 12 }, scene);
        baseRadius = 1.5;
      } else if (type === 1) {
        shape = MeshBuilder.CreateSphere(`glow_sphere_${i}`, { diameter: 2.4, segments: 10 }, scene);
        baseRadius = 1.2;
      } else if (type === 2) {
        shape = MeshBuilder.CreateBox(`glow_box_${i}`, { size: 2.2 }, scene);
        baseRadius = 1.6;
      } else {
        shape = MeshBuilder.CreateCylinder(`glow_cyl_${i}`, { height: 0.6, diameter: 2.6, tessellation: 12 }, scene);
        baseRadius = 1.3;
      }
      const mat = new StandardMaterial(`glow_mat_${i}`, scene);
      const color = glowColors[Math.floor(Math.random() * glowColors.length)];
      mat.emissiveColor = color.scale(0.5);
      mat.diffuseColor = color.scale(0.12);
      mat.specularColor = new Color3(0, 0, 0);
      mat.fogEnabled = true;
      shape.material = mat;
      shape.position = new Vector3(
        (Math.random() - 0.5) * 520,
        0.2 + Math.random() * 0.4,
        (Math.random() - 0.5) * 520
      );
      const scale = (0.6 + Math.random() * 1.6) * 3;
      shape.scaling = new Vector3(scale, scale, scale);
      shape.rotation.y = Math.random() * Math.PI * 2;
      shape.isPickable = false;
      glowShapeColliders.push({ mesh: shape, radius: baseRadius * scale + 3 });
      groundGlowShapes.push(shape);
    }
    groundGlowShapesRef.current = groundGlowShapes;
    groundGlowShapesRef.current.forEach((shape) => shape.setEnabled(assetTogglesRef.current.glowSculptures));

    // Airplanes with white trails
    const planeMat = new StandardMaterial("planeMat", scene);
    planeMat.diffuseColor = new Color3(0.9, 0.92, 0.95);
    planeMat.emissiveColor = new Color3(0.1, 0.1, 0.12);
    planeMat.fogEnabled = false;
    const maxBuildingHeight =
      buildingInfosRef.current.length > 0
        ? Math.max(...buildingInfosRef.current.map((b) => b.height))
        : 120;
    const skyRadius = sky.getBoundingInfo().boundingSphere.radius;
    const planeCeiling = skyRadius * 0.6;
    const planeBaseHeight = maxBuildingHeight + 50;
    const planeBounds = { minX: -520, maxX: 520, minZ: -520, maxZ: 520 };
    const planes: {
      root: TransformNode;
      angle: number;
      radius: number;
      center: Vector3;
      speed: number;
      height: number;
      drift: Vector3;
      trail: any;
      trailPoints: Vector3[];
      trailColors: Color4[];
    }[] = [];
    for (let i = 0; i < 4; i++) {
      const root = new TransformNode(`plane_${i}`, scene);
      const body = MeshBuilder.CreateBox(`plane_body_${i}`, { width: 6, height: 1.2, depth: 2 }, scene);
      body.material = planeMat;
      body.parent = root;
      body.checkCollisions = false;
      const wing = MeshBuilder.CreateBox(`plane_wing_${i}`, { width: 10, height: 0.2, depth: 2.8 }, scene);
      wing.material = planeMat;
      wing.parent = root;
      wing.checkCollisions = false;
      wing.position = new Vector3(0, 0, 0);
      const tail = MeshBuilder.CreateBox(`plane_tail_${i}`, { width: 2, height: 0.8, depth: 0.2 }, scene);
      tail.material = planeMat;
      tail.parent = root;
      tail.checkCollisions = false;
      tail.position = new Vector3(-2.8, 0.7, 0);

      const { minX, maxX, minZ, maxZ } = planeBounds;
      const center = new Vector3(
        minX + Math.random() * (maxX - minX),
        0,
        minZ + Math.random() * (maxZ - minZ)
      );
      const radius = 420 + i * 40;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.12 + Math.random() * 0.08;
      const height = Math.min(planeBaseHeight + i * 14, planeCeiling);
      const driftAngle = Math.random() * Math.PI * 2;
      const driftSpeed = 1 + Math.random() * 2;
      const drift = new Vector3(Math.cos(driftAngle) * driftSpeed, 0, Math.sin(driftAngle) * driftSpeed);
      const trailLength = 30;
      const trailPoints = Array.from({ length: trailLength }, () => new Vector3(0, height, 0));
      const trailColors = Array.from({ length: trailLength }, (_, idx) => {
        const t = 1 - idx / (trailLength - 1);
        const alpha = 0.9 * t;
        return new Color4(1, 1, 1, alpha);
      });
      const trail = MeshBuilder.CreateLines(
        `plane_trail_${i}`,
        { points: trailPoints, updatable: true, colors: trailColors },
        scene
      );
      trail.color = new Color3(1, 1, 1);
      trail.alpha = 1;
      (trail as any).fogEnabled = false;
      root.setEnabled(assetTogglesRef.current.airplanes);
      trail.setEnabled(assetTogglesRef.current.airplanes);
      planes.push({ root, angle, radius, center, speed, height, drift, trail, trailPoints, trailColors });
    }
    planeRootsRef.current = planes.map((p) => p.root);
    planeTrailsRef.current = planes.map((p) => p.trail);

    // Cars removed (car1.glb deleted).

    // Animation updates: people, drones, pickups
    scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime() / 1000;
      const heightFactor =
        fogSettings.heightFalloff > 0
          ? Math.max(0, 1 - camera.position.y * fogSettings.heightFalloff)
          : 1;
      const effectiveFog = fogSettings.density * fogSettings.intensity * heightFactor;
      scene.fogDensity = fogSettings.enabled ? effectiveFog : 0;

      drones.forEach((d) => {
        d.angle += d.speed * dt * 0.6;
        const dx = d.center.x + Math.cos(d.angle) * d.radius;
        const dz = d.center.z + Math.sin(d.angle) * d.radius;
        if (isNearAvoid(new Vector3(dx, 0, dz), 10)) {
          d.center.x += (Math.random() - 0.5) * 20;
          d.center.z += (Math.random() - 0.5) * 20;
        }
        d.mesh.position.set(dx, d.height + Math.sin(d.angle * 2) * 2.0, dz);
      });

      const now = performance.now();
      if (assetTogglesRef.current.cats) {
        cats.forEach((cat) => {
          if (now >= cat.nextTurn) {
            const dir = new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5);
            dir.normalize();
            cat.dir = dir;
            cat.nextTurn = now + 5000;
          }
          const step = cat.dir.scale(cat.speed * dt);
          const nextPos = cat.root.position.add(step);
          if (nextPos.x < catBounds.minX || nextPos.x > catBounds.maxX) cat.dir.x *= -1;
          if (nextPos.z < catBounds.minZ || nextPos.z > catBounds.maxZ) cat.dir.z *= -1;
          cat.root.position.addInPlace(cat.dir.scale(cat.speed * dt));
          cat.root.rotation.y = Math.atan2(cat.dir.x, cat.dir.z);
        });
      }

        if (assetTogglesRef.current.airplanes) {
          const minPlaneHeight = buildingInfosRef.current.length
            ? Math.max(...buildingInfosRef.current.map((b) => b.height)) + 50
            : planeBaseHeight;
          planes.forEach((p) => {
            p.center.addInPlace(p.drift.scale(dt));
            if (p.center.x > planeBounds.maxX) p.center.x = planeBounds.minX;
            if (p.center.x < planeBounds.minX) p.center.x = planeBounds.maxX;
            if (p.center.z > planeBounds.maxZ) p.center.z = planeBounds.minZ;
            if (p.center.z < planeBounds.minZ) p.center.z = planeBounds.maxZ;

            p.angle += p.speed * dt;
            let px = p.center.x + Math.cos(p.angle) * p.radius;
            let pz = p.center.z + Math.sin(p.angle) * p.radius;
            let flightY = Math.max(Math.min(p.height, planeCeiling), minPlaneHeight);
            const dx = px - moon.position.x;
            const dy = flightY - moon.position.y;
            const dz = pz - moon.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < moonSafeRadius) {
              const scale = moonSafeRadius / Math.max(dist, 0.001);
              px = moon.position.x + dx * scale;
              flightY = moon.position.y + dy * scale;
              pz = moon.position.z + dz * scale;
            }
            p.root.position.set(px, flightY, pz);
            p.root.rotation.y = -p.angle + Math.PI / 2;

          p.trailPoints.pop();
          p.trailPoints.unshift(new Vector3(px, flightY, pz));
          MeshBuilder.CreateLines(
            "plane_trail_update",
            { points: p.trailPoints, colors: p.trailColors, instance: p.trail },
            scene
          );
        });
      }

      pickups.forEach((p) => {
        p.mesh.position.y = p.baseY + Math.sin(performance.now() * 0.002 + p.phase) * 0.8;
        p.mesh.rotation.y += dt * 0.8;
      });

      npcWalkers.forEach((n) => {
        n.angle += n.speed * dt;
        const nx = n.center.x + Math.cos(n.angle) * n.radius;
        const nz = n.center.z + Math.sin(n.angle) * n.radius;
        n.mesh.position.set(nx, n.baseY, nz);
        n.mesh.rotation.y = -n.angle + Math.PI / 2;
      });

      if (!npcDialogueState.active) {
        const now = performance.now();
        if (now - npcDialogueState.lastScan > 300) {
          npcDialogueState.lastScan = now;
          const maxDistSq = 25;
          for (const npc of npcWalkers) {
            const meta = (npc.mesh as any).metadata;
            if (!meta?.id) continue;
            const last = npcCooldowns.get(meta.id) || 0;
            if (now - last < 5000) continue;
            const { x: camX, z: camZ } = camera.position;
            const dx = camX - npc.mesh.position.x;
            const dz = camZ - npc.mesh.position.z;
            if (dx * dx + dz * dz <= maxDistSq) {
              npcCooldowns.set(meta.id, now);
              npcDialogueState.active = true;
              window.dispatchEvent(new CustomEvent("npc-dialogue", { detail: { npcId: meta.id } }));
              break;
            }
          }
        }
      }

      const t = performance.now() * 0.002;
      flickerMats.forEach((f, i) => {
        const pulse = 0.6 + Math.sin(t + i) * 0.2 + Math.sin(t * 2.3 + i) * 0.1;
        f.mat.emissiveColor = f.base.scale(pulse);
      });

      signAGroup.rotation.y += dt * 0.8;
      signBGroup.rotation.y += dt * 0.8;

      moon.rotation.y += dt * 0.08;

      const pos = camera.position;
      const target = camera.getTarget();
      const { x: posXNum, y: posYNum, z: posZNum } = pos;
      debugOverlay.textContent =
        `pos: (${posXNum.toFixed(2)}, ${posYNum.toFixed(2)}, ${posZNum.toFixed(2)})\n` +
        `target: (${target.x.toFixed(2)}, ${target.y.toFixed(2)}, ${target.z.toFixed(2)})`;
      const nowTs = performance.now();
      if (nowTs - lastCameraUiUpdate > 250) {
        lastCameraUiUpdate = nowTs;
        const { x: posX, y: posY, z: posZ } = pos;
        const { x: targetX, y: targetY, z: targetZ } = target;
        window.dispatchEvent(
          new CustomEvent("camera-info", {
            detail: {
              pos: { x: posX, y: posY, z: posZ },
              target: { x: targetX, y: targetY, z: targetZ },
            },
          })
        );
      }

    });

    // First-person camera height above ground
    const eyeHeight = 2;

    // WASD movement for first-person camera.
    const inputMap: { [key: string]: boolean } = {};
    scene.actionManager = new ActionManager(scene);
    let jumpRequested = false;
    let verticalVel = 0;
    const gravity = -20;
    const jumpSpeed = 8;

    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
        if (isTextInputActive()) return;
        const key = evt.sourceEvent.key.toLowerCase();
        // Prevent default browser behavior for movement keys to avoid scrolling
        if (key === "w" || key === "a" || key === "s" || key === "d" || key === " ") {
          try { evt.sourceEvent.preventDefault(); } catch {}
        }
        inputMap[key] = true;
        const walkActive = !!(inputMap["w"] || inputMap["a"] || inputMap["s"] || inputMap["d"]);
        window.dispatchEvent(new CustomEvent("walk-input", { detail: { active: walkActive } }));
        if (evt.sourceEvent.code === "Space") {
          jumpRequested = true;
          inputMap["space"] = true;
        }
      })
    );

    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        if (isTextInputActive()) return;
        inputMap[evt.sourceEvent.key.toLowerCase()] = false;
        const walkActive = !!(inputMap["w"] || inputMap["a"] || inputMap["s"] || inputMap["d"]);
        window.dispatchEvent(new CustomEvent("walk-input", { detail: { active: walkActive } }));
        if (evt.sourceEvent.code === "Space") {
          inputMap["space"] = false;
        }
      })
    );
    const onJumpInput = (evt: Event) => {
      const { detail } = evt as CustomEvent<{ active: boolean }>;
      if (detail?.active) jumpRequested = true;
    };
    window.addEventListener("jump-input", onJumpInput as EventListener);

    const clearWalkInput = () => {
      inputMap["w"] = false;
      inputMap["a"] = false;
      inputMap["s"] = false;
      inputMap["d"] = false;
      window.dispatchEvent(new CustomEvent("walk-input", { detail: { active: false } }));
    };

    const onKeyUpFallback = (evt: KeyboardEvent) => {
      const key = evt.key.toLowerCase();
      if (key !== "w" && key !== "a" && key !== "s" && key !== "d") return;
      inputMap[key] = false;
      const walkActive = !!(inputMap["w"] || inputMap["a"] || inputMap["s"] || inputMap["d"]);
      window.dispatchEvent(new CustomEvent("walk-input", { detail: { active: walkActive } }));
    };

    const onWindowBlur = () => {
      clearWalkInput();
    };

    const onVisibilityChange = () => {
      if (document.hidden) clearWalkInput();
    };

    window.addEventListener("keyup", onKeyUpFallback);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);

    let lastHeading = 0;
    let lastMoving = false;

    // Movement: W/S move forward/back relative to camera view, A/D strafe left/right
    const moveSpeed = 10.67; // world units per second (tuned)
    scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime() / 1000;
      if (lookPointerActive || Math.abs(lookTargetX) > 0.0001 || Math.abs(lookTargetY) > 0.0001) {
        camera.rotation.y += lookTargetX * lookHoldSpeed * dt;
        camera.rotation.x = clampPitch(camera.rotation.x + lookTargetY * lookHoldSpeed * dt);
      }
      // forward vector: camera look direction flattened to XZ plane
      const forward = camera.getDirection(new Vector3(0, 0, 1));
      forward.y = 0;
      forward.normalize();
      // right vector (perpendicular on XZ plane)
      const right = Vector3.Cross(forward, Vector3.Up());
      right.normalize();

      const move = new Vector3(0, 0, 0);
      if (inputMap["w"]) move.addInPlace(forward);
      if (inputMap["s"]) move.addInPlace(forward.scale(-1));
      if (inputMap["a"]) move.addInPlace(right);
      if (inputMap["d"]) move.addInPlace(right.scale(-1));
      if (isTouchDevice) {
        const touchMagnitude = Math.max(Math.abs(walkInputX), Math.abs(walkInputY));
        if (touchMagnitude > 0.05) {
          move.addInPlace(forward.scale(-walkInputY));
          move.addInPlace(right.scale(-walkInputX));
        }
      }

      const isMoving = move.lengthSquared() > 0;
      if (isMoving) {
        move.normalize();
        const touchMagnitude = Math.max(Math.abs(walkInputX), Math.abs(walkInputY));
        const touchSprintScale = isTouchDevice && touchMagnitude > 0.05 ? 1 + Math.min(1, touchMagnitude) : 1;
        const sprintMultiplier = sprintModeRef.current ? 5 : 1;
        const baseMultiplier = sprintModeRef.current ? sprintMultiplier : (inputMap["shift"] ? 4 : 1);
        const touchMultiplier = sprintModeRef.current ? 1 : touchSprintScale;
        const speed = moveSpeed * baseMultiplier * touchMultiplier;
        move.scaleInPlace(speed * dt);
      }
      if (isMoving !== lastMoving) {
        lastMoving = isMoving;
        window.dispatchEvent(new CustomEvent("player-move", { detail: { moving: isMoving } }));
      }

      // Try to move while preventing going below the ground. We raycast down at the proposed
      // XZ position to find the ground height and then clamp the camera Y to stay above it.
      const tryMove = (delta: Vector3) => {
        const horizontal = new Vector3(delta.x, 0, delta.z);
        if (horizontal.lengthSquared() > 0) {
          const candidate = camera.position.add(horizontal);
          const blockedByGlow = glowShapeColliders.some(({ mesh, radius }) => {
            const dx = candidate.x - mesh.position.x;
            const dz = candidate.z - mesh.position.z;
            return dx * dx + dz * dz < radius * radius;
          });
          if (!blockedByGlow) {
            if (camera.checkCollisions && scene.collisionsEnabled && typeof (camera as any)._collideWithWorld === "function") {
              (camera as any)._collideWithWorld(horizontal);
            } else {
              camera.position.addInPlace(horizontal);
            }
          }
        }
        const proposedPos = camera.position.clone();

        // Raycast down from a high point above the proposed position to find the ground
        const rayOrigin = new Vector3(proposedPos.x, 50, proposedPos.z);
        const down = new Vector3(0, -1, 0);
        const ray = new Ray(rayOrigin, down, 200);
        const pick = scene.pickWithRay(ray, (mesh) => walkMeshes.has(mesh.name));
        const groundY = pick && pick.hit && pick.pickedPoint ? pick.pickedPoint.y : 0;

        if (jumpRequested && Math.abs(camera.position.y - (groundY + eyeHeight)) < 0.1) {
          verticalVel = jumpSpeed;
          jumpRequested = false;
        }

        verticalVel += gravity * dt;
        proposedPos.y += verticalVel * dt;

        const minY = groundY + eyeHeight;
        if (proposedPos.y <= minY) {
          proposedPos.y = minY;
          verticalVel = 0;
        }

        camera.position = proposedPos;
      };

      tryMove(move);

      const dir = camera.getDirection(new Vector3(0, 0, 1));
      const headingRad = Math.atan2(dir.x, dir.z);
      const heading = ((headingRad * 180) / Math.PI + 360) % 360;
      const delta = Math.abs(((heading - lastHeading + 540) % 360) - 180);
      if (delta > 0.5) {
        lastHeading = heading;
        window.dispatchEvent(new CustomEvent("player-heading", { detail: { heading } }));
      }

    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => {
      engine.resize();
    });

    return () => {
      try { canvasRef.current?.removeEventListener("click", requestLock as any); } catch {}
      try { window.removeEventListener("light-settings", onLightSettings as EventListener); } catch {}
      try { window.removeEventListener("export-glb", onExportGlb as EventListener); } catch {}
      try { window.removeEventListener("performance-settings", onPerfSettings as EventListener); } catch {}
      // Cloud settings handler has been removed (onCloudSettings no longer exists here).
      try { window.removeEventListener("postfx-settings", onPostFxSettings as EventListener); } catch {}
      try { window.removeEventListener("asset-toggles", onAssetToggles as EventListener); } catch {}
      try { window.removeEventListener("atmosphere-props-settings", onAtmosphereProps as EventListener); } catch {}
      try { window.removeEventListener("realism-settings", onRealismSettings as EventListener); } catch {}
      try { window.removeEventListener("walk-input", onWalkInput as EventListener); } catch {}
      try { window.removeEventListener("jump-input", onJumpInput as EventListener); } catch {}
      try { window.removeEventListener("hud-close", onHudClose as EventListener); } catch {}
      try { window.removeEventListener("star-settings", onStarSettings as EventListener); } catch {}
      try { window.removeEventListener("building-settings", onBuildingSettings as EventListener); } catch {}
      try { window.removeEventListener("tree-positions", onTreePositions as EventListener); } catch {}
      try { window.removeEventListener("hud-item-click", onHudItemClick as EventListener); } catch {}
      try { window.removeEventListener("npc-dialogue", onDialogueOpen as EventListener); } catch {}
      try { window.removeEventListener("camera-start-update", onCameraStartUpdate as EventListener); } catch {}
      try { window.removeEventListener("npc-dialogue-open", onNpcOpen as EventListener); } catch {}
      try { window.removeEventListener("npc-dialogue-close", onNpcClose as EventListener); } catch {}
      try { window.removeEventListener("keyup", onKeyUpFallback); } catch {}
      try { window.removeEventListener("blur", onWindowBlur); } catch {}
      try { document.removeEventListener("visibilitychange", onVisibilityChange); } catch {}
      try { document.body.removeChild(debugOverlay); } catch {}
      if (adTimer !== null) {
        try { window.clearInterval(adTimer); } catch {}
      }
      try { currentAdTexture?.dispose(); } catch {}
      try { if (lookZone) document.body.removeChild(lookZone); } catch {}
      try { if (walkZone) document.body.removeChild(walkZone); } catch {}
      try { if (walkLabelZone) document.body.removeChild(walkLabelZone); } catch {}
      try { if (interactZone) document.body.removeChild(interactZone); } catch {}
      hintAnimations.forEach((anim) => {
        try { anim.cancel(); } catch {}
      });
      hintTimers.forEach((timer) => {
        try { window.clearTimeout(timer); } catch {}
      });
      sparkleTimers.forEach((timer) => {
        try { window.clearTimeout(timer); } catch {}
      });
      if (rollerSparkleTimer) {
        try { window.clearTimeout(rollerSparkleTimer); } catch {}
      }
      try { sparkleTexture.dispose(); } catch {}
      try { sparkleAnchor.dispose(); } catch {}
      catRoots.forEach((root) => {
        try { root.dispose(); } catch {}
      });
      if (catContainer) {
        try { catContainer.dispose(); } catch {}
      }
      groundGlowShapes.forEach((shape) => {
        try { shape.material?.dispose(); } catch {}
        try { shape.dispose(); } catch {}
      });
      try { scene.onBeforeRenderObservable.remove(fogObserver);
      scene.onBeforeRenderObservable.remove(lodObserver); } catch {}
      scene.dispose();
      engine.dispose();
      setSceneInstance(null);
    };
  }, []);

  return null;
};

export default WorldSceneController;
