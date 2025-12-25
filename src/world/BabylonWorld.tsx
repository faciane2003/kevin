// File: src/world/BabylonWorld.tsx
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
  PointLight,
  GlowLayer,
  DefaultRenderingPipeline,
  ColorCurves,
  MeshBuilder,
  PBRMaterial,
  StandardMaterial,
  Color3,
  Color4,
  Material,
  Texture,
  DynamicTexture,
  TransformNode,
  SceneLoader,
  ActionManager,
  ExecuteCodeAction,
} from "@babylonjs/core";

const BabylonWorld: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.03, 0.04, 0.08, 1);

    // First-person camera
    const camera = new UniversalCamera("camera", new Vector3(-230.77, 2.18, -4.26), scene);
    camera.setTarget(new Vector3(-191.22, 7.88, -6.19));

    // Attach default controls so mouse drag looks around.
    camera.attachControl(canvasRef.current, true);
    const requestLock = () => {
      canvasRef.current?.requestPointerLock?.();
    };
    canvasRef.current?.addEventListener("click", requestLock);

    const debugOverlay = document.createElement("div");
    debugOverlay.style.position = "fixed";
    debugOverlay.style.top = "12px";
    debugOverlay.style.right = "12px";
    debugOverlay.style.padding = "8px 10px";
    debugOverlay.style.background = "rgba(0,0,0,0.6)";
    debugOverlay.style.color = "#e6f3ff";
    debugOverlay.style.fontFamily = "Consolas, Menlo, monospace";
    debugOverlay.style.fontSize = "12px";
    debugOverlay.style.whiteSpace = "pre";
    debugOverlay.style.pointerEvents = "none";
    debugOverlay.style.zIndex = "20";
    document.body.appendChild(debugOverlay);
    debugOverlay.style.display = "none";
    let showDebugOverlay = false;
    const isTextInputActive = () => {
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName.toLowerCase();
      return tag === "input" || tag === "textarea";
    };
    const onToggleDebugOverlay = (evt: KeyboardEvent) => {
      if (evt.key.toLowerCase() !== "p") return;
      showDebugOverlay = !showDebugOverlay;
      debugOverlay.style.display = showDebugOverlay ? "block" : "none";
    };
    window.addEventListener("keydown", onToggleDebugOverlay);

    const buildingTilingState = { u: 1, v: 2.5 };


    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      try {
        // @ts-ignore - touch input may not be publicly typed in some versions
        if (camera.inputs?.attached?.touch) {
          // Lower values = faster rotation on touch
          // @ts-ignore
          camera.inputs.attached.touch.touchAngularSensibility = 9000;
        }
      } catch {}
    }

    let lookZone: HTMLDivElement | null = null;
    let walkLabelZone: HTMLDivElement | null = null;
    let lookPointerActive = false;
    let lookPointerId: number | null = null;
    let lastLookX = 0;
    let lastLookY = 0;
    let lookInputX = 0;
    let lookInputY = 0;
    const lookSensitivity = 0.004;
    const lookHoldSpeed = 1.6;
    const clampPitch = (value: number) => Math.max(-1.4, Math.min(1.4, value));
    if (isTouchDevice) {
      walkLabelZone = document.createElement("div");
      walkLabelZone.style.position = "fixed";
      walkLabelZone.style.left = "0";
      walkLabelZone.style.top = "0";
      walkLabelZone.style.width = "50vw";
      walkLabelZone.style.height = "100vh";
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
      walkLabelZone.style.paddingTop = "70vh";
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
      lookZone.style.top = "0";
      lookZone.style.width = "50vw";
      lookZone.style.height = "100vh";
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
      lookZone.style.paddingTop = "70vh";
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

      const updateLookInput = (evt: PointerEvent) => {
        if (!lookZone) return;
        const rect = lookZone.getBoundingClientRect();
        const nx = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((evt.clientY - rect.top) / rect.height) * 2 - 1;
        lookInputX = Math.max(-1, Math.min(1, nx));
        lookInputY = Math.max(-1, Math.min(1, ny));
      };

      lookZone.addEventListener("pointerdown", (evt) => {
        lookPointerActive = true;
        lookPointerId = evt.pointerId;
        lastLookX = evt.clientX;
        lastLookY = evt.clientY;
        updateLookInput(evt);
        lookZone?.setPointerCapture(evt.pointerId);
      });

      lookZone.addEventListener("pointermove", (evt) => {
        if (!lookPointerActive || lookPointerId !== evt.pointerId) return;
        const dx = evt.clientX - lastLookX;
        const dy = evt.clientY - lastLookY;
        lastLookX = evt.clientX;
        lastLookY = evt.clientY;
        camera.rotation.y += dx * lookSensitivity;
        camera.rotation.x = clampPitch(camera.rotation.x + dy * lookSensitivity);
        updateLookInput(evt);
      });

      const endLook = (evt: PointerEvent) => {
        if (!lookPointerActive || lookPointerId !== evt.pointerId) return;
        lookPointerActive = false;
        lookPointerId = null;
        lookInputX = 0;
        lookInputY = 0;
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

    const localPlayerId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `player-${Math.random().toString(36).slice(2, 10)}`;
    const localPlayerName = "Frodo";
    const remotePlayers = new Map<string, { mesh: any }>();
    const remotePlayerMat = new StandardMaterial("remotePlayerMat", scene);
    remotePlayerMat.diffuseColor = new Color3(0.2, 0.8, 0.9);
    remotePlayerMat.emissiveColor = new Color3(0.05, 0.15, 0.2);

    const createRemotePlayer = (id: string) => {
      const mesh = MeshBuilder.CreateCylinder(`remote_${id}`, { height: 2.2, diameter: 1 }, scene);
      mesh.material = remotePlayerMat;
      mesh.isPickable = false;
      remotePlayers.set(id, { mesh });
      return mesh;
    };

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const defaultWsUrl =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? `${wsProtocol}://${window.location.hostname}:8080`
        : "wss://kevin-1-8541.onrender.com";
    const wsUrl = (import.meta as any).env?.VITE_WS_URL || defaultWsUrl;
    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(wsUrl);
    } catch {
      socket = null;
    }

    const sendSocketMessage = (payload: any) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify(payload));
    };
    let lastNetworkSend = 0;
    const networkSendIntervalMs = 120;

    const chatPanel = document.createElement("div");
    chatPanel.style.position = "fixed";
    chatPanel.style.left = "12px";
    chatPanel.style.bottom = "120px";
    chatPanel.style.width = "260px";
    chatPanel.style.background = "rgba(0,0,0,0.6)";
    chatPanel.style.color = "#e6f3ff";
    chatPanel.style.fontFamily = "Consolas, Menlo, monospace";
    chatPanel.style.fontSize = "12px";
    chatPanel.style.borderRadius = "6px";
    chatPanel.style.padding = "8px";
    chatPanel.style.zIndex = "20";
    chatPanel.style.pointerEvents = "auto";

    const chatLog = document.createElement("div");
    chatLog.style.maxHeight = "160px";
    chatLog.style.overflowY = "auto";
    chatLog.style.marginBottom = "6px";
    chatLog.style.whiteSpace = "pre-wrap";

    const chatInput = document.createElement("input");
    chatInput.type = "text";
    chatInput.placeholder = "Press Enter to chat";
    chatInput.style.width = "100%";
    chatInput.style.padding = "4px 6px";
    chatInput.style.borderRadius = "4px";
    chatInput.style.border = "1px solid rgba(255,255,255,0.15)";
    chatInput.style.background = "rgba(10,12,20,0.8)";
    chatInput.style.color = "#e6f3ff";

    const appendChatLine = (text: string) => {
      const line = document.createElement("div");
      line.textContent = text;
      chatLog.appendChild(line);
      chatLog.scrollTop = chatLog.scrollHeight;
    };

    chatInput.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        const value = chatInput.value.trim();
        if (value) {
          appendChatLine(`${localPlayerName}: ${value}`);
          sendSocketMessage({ type: "chat", id: localPlayerId, name: localPlayerName, message: value });
        }
        chatInput.value = "";
        chatInput.blur();
      }
      if (evt.key === "Escape") {
        chatInput.value = "";
        chatInput.blur();
      }
    });

    const onChatFocusKey = (evt: KeyboardEvent) => {
      if (evt.key === "Enter" && !isTextInputActive()) {
        chatInput.focus();
        evt.preventDefault();
      }
    };
    window.addEventListener("keydown", onChatFocusKey);

    chatPanel.appendChild(chatLog);
    chatPanel.appendChild(chatInput);
    chatPanel.style.display = "none";
    document.body.appendChild(chatPanel);

    if (socket) {
      socket.addEventListener("open", () => {
        sendSocketMessage({
          type: "join",
          id: localPlayerId,
          name: localPlayerName,
          pos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
          rot: { y: camera.rotation.y },
        });
      });

      socket.addEventListener("message", (event) => {
        let msg: any;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === "init" && Array.isArray(msg.players)) {
          msg.players.forEach((player: any) => {
            if (!player?.id || player.id === localPlayerId) return;
            const mesh = remotePlayers.get(player.id)?.mesh || createRemotePlayer(player.id);
            if (player.pos) {
              mesh.position.set(player.pos.x || 0, player.pos.y || 0, player.pos.z || 0);
            }
          });
          return;
        }

        if (msg.type === "join" && msg.player?.id && msg.player.id !== localPlayerId) {
          const mesh = remotePlayers.get(msg.player.id)?.mesh || createRemotePlayer(msg.player.id);
          if (msg.player.pos) {
            mesh.position.set(msg.player.pos.x || 0, msg.player.pos.y || 0, msg.player.pos.z || 0);
          }
          return;
        }

        if (msg.type === "move" && msg.id && msg.id !== localPlayerId) {
          const mesh = remotePlayers.get(msg.id)?.mesh || createRemotePlayer(msg.id);
          if (msg.pos) {
            mesh.position.set(msg.pos.x || 0, msg.pos.y || 0, msg.pos.z || 0);
          }
          if (msg.rot && typeof msg.rot.y === "number") {
            mesh.rotation.y = msg.rot.y;
          }
          return;
        }

        if (msg.type === "leave" && msg.id) {
          const entry = remotePlayers.get(msg.id);
          if (entry) {
            entry.mesh.dispose();
            remotePlayers.delete(msg.id);
          }
        }

        if (msg.type === "chat" && msg.name && typeof msg.message === "string") {
          appendChatLine(`${msg.name}: ${msg.message}`);
        }
      });
    }

    // Ambient light and neon city glow
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.33;
    hemi.diffuse = new Color3(0.2, 0.45, 0.9);
    hemi.groundColor = new Color3(0.05, 0.05, 0.5);

    const ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.08;
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
    moon.material = moonMat;
    moon.position = new Vector3(700, 450, -130);
    moon.isPickable = false;

    const moonLight = new DirectionalLight("moonLight", new Vector3(0.4, -1, 0.2), scene);
    moonLight.position = moon.position;
    moonLight.intensity = 0.3;
    moonLight.diffuse = new Color3(0.7, 0.8, 1.0);


    moon.scaling.set(2.3, 2.3, 2.3);

    const createHeightMapUrl = () => {
      const tex = new DynamicTexture("heightMap", { width: 512, height: 512 }, scene, false);
      const ctx = tex.getContext() as CanvasRenderingContext2D;
      const size = tex.getSize();
      ctx.fillStyle = "rgb(120,120,120)";
      ctx.fillRect(0, 0, size.width, size.height);
      // Large rolling hills
      for (let i = 0; i < 14; i++) {
        const x = Math.random() * size.width;
        const y = Math.random() * size.height;
        const r = 160 + Math.random() * 240;
        const light = Math.random() > 0.5;
        ctx.fillStyle = light ? "rgba(210,210,210,0.12)" : "rgba(60,60,60,0.12)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // Mid-frequency terrain detail
      for (let i = 0; i < 140; i++) {
        const x = Math.random() * size.width;
        const y = Math.random() * size.height;
        const r = 40 + Math.random() * 120;
        const light = Math.random() > 0.5;
        ctx.fillStyle = light ? "rgba(200,200,200,0.1)" : "rgba(60,60,60,0.1)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // Fine variation
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * size.width;
        const y = Math.random() * size.height;
        const r = 8 + Math.random() * 30;
        const light = Math.random() > 0.5;
        ctx.fillStyle = light ? "rgba(200,200,200,0.12)" : "rgba(60,60,60,0.12)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      tex.update();
      const canvas = (ctx as any).canvas as HTMLCanvasElement;
      return canvas.toDataURL("image/png");
    };

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

    const createPickupTexture = (name: string, label: string, color: string) => {
      const tex = new DynamicTexture(name, { width: 256, height: 256 }, scene, false);
      const ctx = tex.getContext() as CanvasRenderingContext2D;
      const size = tex.getSize();
      ctx.clearRect(0, 0, size.width, size.height);
      ctx.fillStyle = color;
      ctx.font = "bold 72px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.fillText(label, size.width / 2, size.height / 2);
      tex.update();
      tex.hasAlpha = true;
      return tex;
    };

    // Ground (flat black plane)
    const ground = MeshBuilder.CreateGround("ground", { width: 800, height: 800 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.14, 0.14, 0.14);
    groundMat.specularColor = new Color3(0, 0, 0);
    ground.material = groundMat;

    const zRoads = [-260, -180, -100, -20, 60, 140, 220, 300];
    const xRoads = [-300, -220, -140, -60, 20, 100, 180, 260];

    const walkMeshes = new Set([ground.name]);

    // Distant mountains removed for now

    // Sky texture already applied above.
    // Neon haze for atmosphere
    scene.fogMode = Scene.FOGMODE_EXP;
    scene.fogDensity = 0;
    scene.fogColor = new Color3(0.05, 0.08, 0.16);

    // Post-processing: glow, depth of field, motion blur, color grading
    const glowLayer = new GlowLayer("glow", scene, { blurKernelSize: 32 });
    glowLayer.intensity = 0.31;
    glowLayer.addExcludedMesh(moon);

    const pipeline = new DefaultRenderingPipeline(
      "defaultPipeline",
      true,
      scene,
      [camera]
    );
    pipeline.fxaaEnabled = true;
    pipeline.bloomEnabled = false;
    pipeline.depthOfFieldEnabled = false;
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

    // Slightly reduce quality on touch devices
    if (isTouchDevice) {
      pipeline.depthOfFieldBlurLevel = 1;
      glowLayer.intensity = 0.6;
    }

    const onLightSettings = (evt: Event) => {
      const detail = (evt as CustomEvent<any>).detail;
      if (!detail) return;
      if (typeof detail.hemi === "number") hemi.intensity = detail.hemi;
      if (typeof detail.ambient === "number") ambientLight.intensity = detail.ambient;
      if (typeof detail.moon === "number") moonLight.intensity = detail.moon;
      if (typeof detail.glow === "number") glowLayer.intensity = detail.glow;
    };
    window.addEventListener("light-settings", onLightSettings as EventListener);


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
      const winW = 18;
      const winH = 26;
      const gapX = 10;
      const gapY = 14;
      for (let y = 20; y < size.height - winH - 10; y += winH + gapY) {
        for (let x = 16; x < size.width - winW - 10; x += winW + gapX) {
          const lit = rand() > 0.3;
          ctx.fillStyle = lit ? windowOn : windowOff;
          ctx.fillRect(x, y, winW, winH);
        }
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
      (mat as any).metadata = { facadeTex: facade, windowTex: winTex };
      return mat;
    };

    let buildingMeshes: any[] = [];
    let buildingMats: StandardMaterial[] = [];
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

    const rebuildBuildings = (seed: number, count: number) => {
      buildingMeshes.forEach((mesh) => mesh.dispose());
      buildingMeshes = [];
      buildingMats.forEach((mat) => mat.dispose(true, true));
      buildingMats = [];
      const rand = makeRng(seed);
      buildingMats = [
        createBuildingMaterial("buildingMat_brick", "/textures/building_brick.jpg", "#c9c9c9", "#10131a", rand),
        createBuildingMaterial("buildingMat_concrete", "/textures/building_concrete.jpg", "#c9c9c9", "#0a0d12", rand),
        createBuildingMaterial("buildingMat_modern", "/textures/building_facade.jpg", "#c9c9c9", "#0a0d12", rand),
        createBuildingMaterial("buildingMat_sand", "/textures/building_concrete.jpg", "#c9c9c9", "#0a0b10", rand),
      ];
      for (let i = 0; i < count; i++) {
        const w = 8 + rand() * 24;
        const d = 8 + rand() * 24;
        const h = 16 + rand() * 90;
        const b = MeshBuilder.CreateBox(`building_${i}`, { width: w, depth: d, height: h }, scene);
        let x = 0;
        let z = 0;
        let attempts = 0;
        do {
          x = (rand() - 0.5) * 760;
          z = (rand() - 0.5) * 760 - 120;
          attempts += 1;
        } while (isNearRoad(x, z) && attempts < 40);
        b.position = new Vector3(x, h / 2, z);
        b.rotation.y = rand() * Math.PI * 2;
        b.material = buildingMats[Math.floor(rand() * buildingMats.length)];
        b.isPickable = false;
        buildingMeshes.push(b);
      }
      applyBuildingTiling();
    };

    const buildingSeedState = { value: 18 };
    const buildingCountState = { value: 1200 };
    rebuildBuildings(buildingSeedState.value, buildingCountState.value);


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

    // Realistic lamp posts (GLB) with point lights
    const lampPositions = [
      new Vector3(-300, 0, -140),
      new Vector3(-220, 0, -140),
      new Vector3(-140, 0, -140),
      new Vector3(-60, 0, -140),
      new Vector3(20, 0, -140),
      new Vector3(100, 0, -140),
      new Vector3(180, 0, -140),
      new Vector3(260, 0, -140),
      new Vector3(-300, 0, 100),
      new Vector3(-220, 0, 100),
      new Vector3(-140, 0, 100),
      new Vector3(-60, 0, 100),
      new Vector3(20, 0, 100),
      new Vector3(100, 0, 100),
      new Vector3(180, 0, 100),
      new Vector3(260, 0, 100),
    ];
    const loadLampPosts = async () => {
      const container = await SceneLoader.LoadAssetContainerAsync("", "/models/Lantern.glb", scene);
      lampPositions.forEach((pos, idx) => {
        const root = new TransformNode(`lamp_${idx}`, scene);
        root.position = pos.clone();
        const inst = container.instantiateModelsToScene((name) => `${root.name}_${name}`);
        inst.rootNodes.forEach((node) => {
          const tnode = node as TransformNode;
          tnode.parent = root;
          if ((tnode as any).position) tnode.position = new Vector3(0, 0, 0);
          if ((tnode as any).scaling) tnode.scaling = new Vector3(1.9, 1.9, 1.9);
        });
        const lampLight = new PointLight(`lamp_light_${idx}`, new Vector3(pos.x, 8, pos.z), scene);
        lampLight.intensity = 0.6;
        lampLight.diffuse = new Color3(1.0, 0.9, 0.7);
        lampLight.range = 40;
      });
    };
    loadLampPosts();

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
      const spacing = 4;
      let idx = 0;
      for (let x = -halfW; x <= halfW; x += spacing) {
        const top = MeshBuilder.CreateSphere(`${namePrefix}_bulb_top_${idx}`, { diameter: 1.1 }, scene);
        top.material = bulbMat;
        top.parent = sign;
        top.position = new Vector3(x, halfH, zOffset);
        glowLayer.addExcludedMesh(top);
        const bottom = MeshBuilder.CreateSphere(`${namePrefix}_bulb_bottom_${idx}`, { diameter: 1.1 }, scene);
        bottom.material = bulbMat;
        bottom.parent = sign;
        bottom.position = new Vector3(x, -halfH, zOffset);
        glowLayer.addExcludedMesh(bottom);
        idx += 1;
      }
      for (let y = -halfH + spacing; y <= halfH - spacing; y += spacing) {
        const left = MeshBuilder.CreateSphere(`${namePrefix}_bulb_left_${idx}`, { diameter: 1.1 }, scene);
        left.material = bulbMat;
        left.parent = sign;
        left.position = new Vector3(-halfW, y, zOffset);
        glowLayer.addExcludedMesh(left);
        const right = MeshBuilder.CreateSphere(`${namePrefix}_bulb_right_${idx}`, { diameter: 1.1 }, scene);
        right.material = bulbMat;
        right.parent = sign;
        right.position = new Vector3(halfW, y, zOffset);
        glowLayer.addExcludedMesh(right);
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
    const signPoleA = MeshBuilder.CreateCylinder("billboard_pole_a", { height: 26, diameter: 1.6 }, scene);
    signPoleA.position = new Vector3(-120, 13, 20);
    signPoleA.material = metalMat;
    const signAGroup = new TransformNode("billboard_a_group", scene);
    signAGroup.parent = signPoleA;
    signAGroup.position = new Vector3(0, 22, 0);
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
    const signPoleB = MeshBuilder.CreateCylinder("billboard_pole_b", { height: 24, diameter: 1.6 }, scene);
    signPoleB.position = new Vector3(180, 12, 10);
    signPoleB.material = metalMat;
    const signBGroup = new TransformNode("billboard_b_group", scene);
    signBGroup.parent = signPoleB;
    signBGroup.position = new Vector3(0, 20, 0);
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

    // Holo kiosks
    const kioskAds = [
      new Texture("/ads/ad_sunglasses.jpg", scene),
      new Texture("/ads/ad_cyborg.jpg", scene),
      new Texture("/ads/ad_child_apple.jpg", scene),
      new Texture("/ads/ad_mech_goat.jpg", scene),
    ];
    for (let i = 0; i < 5; i++) {
      const base = MeshBuilder.CreateCylinder(`kiosk_base_${i}`, { height: 3, diameter: 4 }, scene);
      base.position = new Vector3(-80 + i * 40, 1.5, -40);
      base.material = metalMat;

      const holo = MeshBuilder.CreatePlane(`kiosk_holo_${i}`, { width: 6, height: 8 }, scene);
      holo.position = new Vector3(-80 + i * 40, 6.8, -40);
      const adTex = kioskAds[i % kioskAds.length];
      const adMat = new StandardMaterial(`kiosk_ad_mat_${i}`, scene);
      adMat.diffuseTexture = adTex;
      adMat.emissiveTexture = adTex;
      adMat.emissiveColor = new Color3(0.25, 0.25, 0.25);
      adMat.backFaceCulling = false;
      holo.material = adMat;
      holo.billboardMode = 7;
    }

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

    // Barriers
    for (let i = 0; i < 8; i++) {
      const barrier = MeshBuilder.CreateBox(`barrier_${i}`, { width: 6, height: 2, depth: 1 }, scene);
      barrier.position = new Vector3(80 + i * 6, 1, -20);
      barrier.material = neonGreen;
    }

    // Street signs
    for (let i = 0; i < 5; i++) {
      const pole = MeshBuilder.CreateCylinder(`sign_pole_${i}`, { height: 6, diameter: 0.6 }, scene);
      pole.position = new Vector3(120, 3, -120 + i * 35);
      pole.material = metalMat;
      const plate = MeshBuilder.CreatePlane(`sign_plate_${i}`, { width: 8, height: 3 }, scene);
      plate.position = new Vector3(120, 6, -120 + i * 35);
      plate.material = neonCyan;
      plate.rotation = new Vector3(0, Math.PI / 2, 0);
    }

    // Vent stacks
    for (let i = 0; i < 6; i++) {
      const vent = MeshBuilder.CreateCylinder(`vent_${i}`, { height: 4, diameter: 2.4 }, scene);
      vent.position = new Vector3(-160 + i * 30, 2, 120);
      vent.material = metalMat;
    }

    // Neon floor beacons
    for (let i = 0; i < 10; i++) {
      const beacon = MeshBuilder.CreateCylinder(`beacon_${i}`, { height: 0.4, diameter: 3 }, scene);
      beacon.position = new Vector3(-140 + i * 28, 0.2, 20);
      beacon.material = neonMagenta;
    }

    // Power pylons
    for (let i = 0; i < 4; i++) {
      const pylon = MeshBuilder.CreateBox(`pylon_${i}`, { width: 4, height: 16, depth: 4 }, scene);
      pylon.position = new Vector3(200, 8, -100 + i * 60);
      pylon.material = metalMat;
      const cap = MeshBuilder.CreateBox(`pylon_cap_${i}`, { width: 6, height: 1, depth: 6 }, scene);
      cap.position = new Vector3(200, 16.5, -100 + i * 60);
      cap.material = neonCyan;
    }

    // Floating pickups (swords, potions, gold)
    const pickupMatSword = new StandardMaterial("pickupSwordMat", scene);
    pickupMatSword.emissiveTexture = createPickupTexture("pickupSwordTex", "S", "#7cffb0");
    pickupMatSword.emissiveTexture.hasAlpha = true;
    pickupMatSword.opacityTexture = pickupMatSword.emissiveTexture;
    pickupMatSword.useAlphaFromDiffuseTexture = true;
    pickupMatSword.disableLighting = true;
    pickupMatSword.alpha = 0.95;
    pickupMatSword.backFaceCulling = false;
    const pickupMatPotion = new StandardMaterial("pickupPotionMat", scene);
    pickupMatPotion.emissiveTexture = createPickupTexture("pickupPotionTex", "P", "#6af6ff");
    pickupMatPotion.emissiveTexture.hasAlpha = true;
    pickupMatPotion.opacityTexture = pickupMatPotion.emissiveTexture;
    pickupMatPotion.useAlphaFromDiffuseTexture = true;
    pickupMatPotion.disableLighting = true;
    pickupMatPotion.alpha = 0.95;
    pickupMatPotion.backFaceCulling = false;
    const pickupMatGold = new StandardMaterial("pickupGoldMat", scene);
    pickupMatGold.emissiveTexture = createPickupTexture("pickupGoldTex", "G", "#ffd16a");
    pickupMatGold.emissiveTexture.hasAlpha = true;
    pickupMatGold.opacityTexture = pickupMatGold.emissiveTexture;
    pickupMatGold.useAlphaFromDiffuseTexture = true;
    pickupMatGold.disableLighting = true;
    pickupMatGold.alpha = 0.95;
    pickupMatGold.backFaceCulling = false;

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
    const pickupDefs = [
      { id: "Sword", mat: pickupMatSword },
      { id: "Potion", mat: pickupMatPotion },
      { id: "Gold", mat: pickupMatGold },
    ];
    for (let i = 0; i < 12; i++) {
      const def = pickupDefs[i % pickupDefs.length];
      const base = new TransformNode(`pickup_${def.id}_${i}`, scene);
      base.position = new Vector3(-60 + i * 12, 3.5, -10 + (i % 3) * 10);

      const badge = MeshBuilder.CreatePlane(`pickup_badge_${def.id}_${i}`, { size: 4 }, scene);
      badge.material = def.mat;
      badge.billboardMode = 7;
      badge.parent = base;
      badge.position.y = 1.2;

      if (def.id === "Sword") {
        const blade = MeshBuilder.CreateBox(`pickup_sword_blade_${i}`, { width: 0.5, height: 4, depth: 0.2 }, scene);
        blade.position = new Vector3(0, 2.2, 0);
        blade.material = neonCyan;
        blade.parent = base;
        blade.isVisible = false;
        const hilt = MeshBuilder.CreateBox(`pickup_sword_hilt_${i}`, { width: 1.4, height: 0.3, depth: 0.4 }, scene);
        hilt.position = new Vector3(0, 0.6, 0);
        hilt.material = metalMat;
        hilt.parent = base;
        hilt.isVisible = false;
      }

      if (def.id === "Potion") {
        const bottle = MeshBuilder.CreateCylinder(`pickup_potion_bottle_${i}`, { height: 2.4, diameter: 1.2 }, scene);
        bottle.position = new Vector3(0, 1.4, 0);
        bottle.material = neonMagenta;
        bottle.parent = base;
        bottle.isVisible = false;
        const cap = MeshBuilder.CreateCylinder(`pickup_potion_cap_${i}`, { height: 0.4, diameter: 0.7 }, scene);
        cap.position = new Vector3(0, 2.8, 0);
        cap.material = metalMat;
        cap.parent = base;
        cap.isVisible = false;
      }

      if (def.id === "Gold") {
        const coin = MeshBuilder.CreateCylinder(`pickup_gold_coin_${i}`, { height: 0.4, diameter: 1.6 }, scene);
        coin.position = new Vector3(0, 1.1, 0);
        coin.material = neonGreen;
        coin.parent = base;
        coin.isVisible = false;
      }

      base.getChildMeshes().forEach((m) => {
        m.isPickable = true;
        m.metadata = { type: "pickup", item: def.id };
      });
      base.metadata = { type: "pickup", item: def.id };
      pickups.push({ mesh: base, baseY: base.position.y, phase: Math.random() * Math.PI * 2 });
    }

    // NPCs with dialogue
    const npcMat = new StandardMaterial("npcMat", scene);
    npcMat.diffuseColor = new Color3(0.18, 0.2, 0.3);
    npcMat.emissiveColor = new Color3(0.2, 0.6, 1.0);
    const npcIds = ["aria", "kade", "mira", "vex", "lux", "zed"];
    const npcWalkers: { mesh: any; angle: number; radius: number; center: Vector3; speed: number }[] = [];
    npcIds.forEach((id, idx) => {
      const npc = MeshBuilder.CreateCylinder(`npc_${id}`, { height: 5, diameter: 2.8 }, scene);
      npc.position = new Vector3(-30 + idx * 12, 2.5, -60 + (idx % 2) * 10);
      npc.material = npcMat;
      npc.isPickable = true;
      npc.metadata = { type: "npc", id };
      npcWalkers.push({
        mesh: npc,
        angle: Math.random() * Math.PI * 2,
        radius: 2.5 + Math.random() * 2.5,
        center: npc.position.clone(),
        speed: 0.2 + Math.random() * 0.4,
      });
    });

    const npcModelUrls = ["/models/RiggedFigure.glb", "/models/CesiumMan.glb"];
    const npcModelScales = [1.8, 1.6];
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
          if ((tnode as any).position) tnode.position = new Vector3(0, -2.5, 0);
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

    // People (glb pedestrians) - circular waypoint movement
    type Pedestrian = { root: any; angle: number; radius: number; center: Vector3; speed: number };
    const people: Pedestrian[] = [];
    for (let i = 0; i < 28; i++) {
      const root = MeshBuilder.CreateCylinder(`person_${i}`, { height: 3, diameter: 1.2 }, scene);
      const center = new Vector3((Math.random() - 0.5) * 420, 0, (Math.random() - 0.5) * 420 - 80);
      const radius = 6 + Math.random() * 26;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 0.9;
      root.position = center.clone();
      root.visibility = 0;
      people.push({ root, angle, radius, center, speed });
    }

    const pedestrianModels = ["/models/RiggedFigure.glb", "/models/CesiumMan.glb"];
    const pedestrianScales = [1.6, 1.4];
    const loadPedestrians = async () => {
      const containers = await Promise.all(
        pedestrianModels.map((url) => SceneLoader.LoadAssetContainerAsync("", url, scene))
      );
      people.forEach((p, idx) => {
        const container = containers[idx % containers.length];
        const scale = pedestrianScales[idx % pedestrianScales.length];
        const inst = container.instantiateModelsToScene((name) => `${p.root.name}_${name}`);
        inst.rootNodes.forEach((node) => {
          const tnode = node as TransformNode;
          tnode.parent = p.root;
          if ((tnode as any).position) tnode.position = new Vector3(0, -1.6, 0);
          if ((tnode as any).scaling) tnode.scaling = new Vector3(scale, scale, scale);
        });
        if (inst.animationGroups && inst.animationGroups.length > 0) {
          inst.animationGroups.forEach((group) => group.start(true));
        }
      });
    };
    loadPedestrians();

    // Drones (flying) - simple circular paths with bobbing
    const drones: { mesh: any; angle: number; radius: number; center: Vector3; speed: number; height: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const d = MeshBuilder.CreateSphere(`drone_${i}`, { diameter: 1.2 }, scene);
      const mat = new StandardMaterial(`droneMat_${i}`, scene);
      mat.emissiveColor = new Color3(0.3, 0.9, 1.0);
      d.material = mat;
      const center = new Vector3((Math.random() - 0.5) * 260, 0, (Math.random() - 0.5) * 260 - 40);
      const radius = 18 + Math.random() * 80;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.9 + Math.random() * 1.3;
      const height = 12 + Math.random() * 30;
      drones.push({ mesh: d, angle, radius, center, speed, height });
    }

    // Airplanes with white trails
    const planeMat = new StandardMaterial("planeMat", scene);
    planeMat.diffuseColor = new Color3(0.9, 0.92, 0.95);
    planeMat.emissiveColor = new Color3(0.1, 0.1, 0.12);
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
    }[] = [];
    for (let i = 0; i < 4; i++) {
      const root = new TransformNode(`plane_${i}`, scene);
      const body = MeshBuilder.CreateBox(`plane_body_${i}`, { width: 6, height: 1.2, depth: 2 }, scene);
      body.material = planeMat;
      body.parent = root;
      const wing = MeshBuilder.CreateBox(`plane_wing_${i}`, { width: 10, height: 0.2, depth: 2.8 }, scene);
      wing.material = planeMat;
      wing.parent = root;
      wing.position = new Vector3(0, 0, 0);
      const tail = MeshBuilder.CreateBox(`plane_tail_${i}`, { width: 2, height: 0.8, depth: 0.2 }, scene);
      tail.material = planeMat;
      tail.parent = root;
      tail.position = new Vector3(-2.8, 0.7, 0);

      const center = new Vector3(
        planeBounds.minX + Math.random() * (planeBounds.maxX - planeBounds.minX),
        0,
        planeBounds.minZ + Math.random() * (planeBounds.maxZ - planeBounds.minZ)
      );
      const radius = 420 + i * 40;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.12 + Math.random() * 0.08;
      const height = 120 + i * 12;
      const driftAngle = Math.random() * Math.PI * 2;
      const driftSpeed = 6 + Math.random() * 8;
      const drift = new Vector3(Math.cos(driftAngle) * driftSpeed, 0, Math.sin(driftAngle) * driftSpeed);
      const trailPoints = Array.from({ length: 18 }, () => new Vector3(0, height, 0));
      const trail = MeshBuilder.CreateLines(
        `plane_trail_${i}`,
        { points: trailPoints, updatable: true },
        scene
      );
      trail.color = new Color3(1, 1, 1);
      trail.alpha = 0.6;
      planes.push({ root, angle, radius, center, speed, height, drift, trail, trailPoints });
    }

    // Cars removed (car1.glb deleted).

    // Trees (procedural clusters)
    const treeTrunkMat = new StandardMaterial("treeTrunkMat", scene);
    treeTrunkMat.diffuseColor = new Color3(0.25, 0.18, 0.1);
    const treeLeafMat = new StandardMaterial("treeLeafMat", scene);
    treeLeafMat.diffuseColor = new Color3(0.08, 0.35, 0.18);
    for (let i = 0; i < 50; i++) {
      const base = new TransformNode(`tree_${i}`, scene);
      const trunk = MeshBuilder.CreateCylinder(`tree_trunk_${i}`, { height: 5, diameter: 1.2 }, scene);
      trunk.material = treeTrunkMat;
      trunk.position = new Vector3(0, 2.5, 0);
      trunk.parent = base;
      const crown = MeshBuilder.CreateSphere(`tree_crown_${i}`, { diameter: 6 }, scene);
      crown.material = treeLeafMat;
      crown.position = new Vector3(0, 6, 0);
      crown.parent = base;
      base.position = new Vector3((Math.random() - 0.5) * 700, 0, (Math.random() - 0.5) * 700 - 100);
    }

    // Animation updates: people, drones, pickups
    scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime() / 1000;
      people.forEach((p) => {
        p.angle += p.speed * dt;
        const px = p.center.x + Math.cos(p.angle) * p.radius;
        const pz = p.center.z + Math.sin(p.angle) * p.radius;
        p.root.position.set(px, 0.9, pz);
        p.root.rotation.y = -p.angle + Math.PI / 2;
      });

      drones.forEach((d) => {
        d.angle += d.speed * dt * 0.6;
        const dx = d.center.x + Math.cos(d.angle) * d.radius;
        const dz = d.center.z + Math.sin(d.angle) * d.radius;
        d.mesh.position.set(dx, d.height + Math.sin(d.angle * 2) * 2.0, dz);
      });

      planes.forEach((p) => {
        p.center.addInPlace(p.drift.scale(dt));
        if (p.center.x > planeBounds.maxX) p.center.x = planeBounds.minX;
        if (p.center.x < planeBounds.minX) p.center.x = planeBounds.maxX;
        if (p.center.z > planeBounds.maxZ) p.center.z = planeBounds.minZ;
        if (p.center.z < planeBounds.minZ) p.center.z = planeBounds.maxZ;

        p.angle += p.speed * dt;
        const px = p.center.x + Math.cos(p.angle) * p.radius;
        const pz = p.center.z + Math.sin(p.angle) * p.radius;
        p.root.position.set(px, p.height, pz);
        p.root.rotation.y = -p.angle + Math.PI / 2;

        p.trailPoints.pop();
        p.trailPoints.unshift(new Vector3(px, p.height, pz));
        MeshBuilder.CreateLines("plane_trail_update", { points: p.trailPoints, instance: p.trail }, scene);
      });

      pickups.forEach((p) => {
        p.mesh.position.y = p.baseY + Math.sin(performance.now() * 0.002 + p.phase) * 0.8;
        p.mesh.rotation.y += dt * 0.8;
      });

      npcWalkers.forEach((n) => {
        n.angle += n.speed * dt;
        const nx = n.center.x + Math.cos(n.angle) * n.radius;
        const nz = n.center.z + Math.sin(n.angle) * n.radius;
        n.mesh.position.set(nx, n.mesh.position.y, nz);
        n.mesh.rotation.y = -n.angle + Math.PI / 2;
      });

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
      debugOverlay.textContent =
        `pos: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})\n` +
        `target: (${target.x.toFixed(2)}, ${target.y.toFixed(2)}, ${target.z.toFixed(2)})`;

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
        if (evt.sourceEvent.code === "Space") {
          inputMap["space"] = false;
        }
      })
    );

    let lastHeading = 0;

    // Movement: W/S move forward/back relative to camera view, A/D strafe left/right
    const moveSpeed = 24; // world units per second (tune as needed)
    scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime() / 1000;
      if (lookPointerActive) {
        camera.rotation.y += lookInputX * lookHoldSpeed * dt;
        camera.rotation.x = clampPitch(camera.rotation.x + lookInputY * lookHoldSpeed * dt);
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

      if (move.lengthSquared() > 0) {
        move.normalize();
        const speed = moveSpeed * (inputMap["shift"] ? 4 : 1);
        move.scaleInPlace(speed * dt);
      }

      // Try to move while preventing going below the ground. We raycast down at the proposed
      // XZ position to find the ground height and then clamp the camera Y to stay above it.
      const tryMove = (delta: Vector3) => {
        const proposedPos = camera.position.add(delta);

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
        proposedPos.y = proposedPos.y + verticalVel * dt;

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

      const now = performance.now();
      if (socket && socket.readyState === WebSocket.OPEN && now - lastNetworkSend > networkSendIntervalMs) {
        lastNetworkSend = now;
        sendSocketMessage({
          type: "move",
          id: localPlayerId,
          pos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
          rot: { y: headingRad },
        });
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
      try { window.removeEventListener("keydown", onToggleDebugOverlay); } catch {}
      try { window.removeEventListener("keydown", onChatFocusKey); } catch {}
      try { document.body.removeChild(debugOverlay); } catch {}
      try { if (lookZone) document.body.removeChild(lookZone); } catch {}
      try { if (walkLabelZone) document.body.removeChild(walkLabelZone); } catch {}
      try { document.body.removeChild(chatPanel); } catch {}
      try { socket?.close(); } catch {}
      remotePlayers.forEach((entry) => entry.mesh.dispose());
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }} />;
};

export default BabylonWorld;





