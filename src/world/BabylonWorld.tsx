// File: src/world/BabylonWorld.tsx
import React, { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  UniversalCamera,
  Vector3,
  Ray,
  HemisphericLight,
  PointLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  DynamicTexture,
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
    const camera = new UniversalCamera("camera", new Vector3(0, 2, 0), scene);
    camera.setTarget(new Vector3(0, 2, 1));

    // Attach default controls so mouse drag looks around.
    camera.attachControl(canvasRef.current, true);
    const requestLock = () => {
      canvasRef.current?.requestPointerLock?.();
    };
    canvasRef.current?.addEventListener("click", requestLock);

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

    // Ambient light and neon city glow
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.25;
    hemi.diffuse = new Color3(0.2, 0.45, 0.9);
    hemi.groundColor = new Color3(0.05, 0.05, 0.1);

    const neonLightA = new PointLight("neonLightA", new Vector3(120, 30, 40), scene);
    neonLightA.diffuse = new Color3(0.1, 0.9, 1.0);
    neonLightA.specular = new Color3(0.1, 0.9, 1.0);
    neonLightA.intensity = 1.1;

    const neonLightB = new PointLight("neonLightB", new Vector3(-140, 28, 60), scene);
    neonLightB.diffuse = new Color3(1.0, 0.2, 0.8);
    neonLightB.specular = new Color3(1.0, 0.2, 0.8);
    neonLightB.intensity = 1.0;

    const createSkyTexture = (name: string) => {
      const tex = new DynamicTexture(name, { width: 1024, height: 1024 }, scene, false);
      const ctx = tex.getContext();
      const size = tex.getSize();
      const grad = ctx.createLinearGradient(0, 0, 0, size.height);
      grad.addColorStop(0, "#0a0d1a");
      grad.addColorStop(0.45, "#0b1124");
      grad.addColorStop(1, "#0f1b36");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size.width, size.height);

      // Star field
      for (let i = 0; i < 900; i++) {
        const x = Math.random() * size.width;
        const y = Math.random() * size.height * 0.75;
        const r = Math.random() * 1.6;
        const a = 0.2 + Math.random() * 0.8;
        ctx.fillStyle = `rgba(220,240,255,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Neon haze near horizon
      const haze = ctx.createLinearGradient(0, size.height * 0.6, 0, size.height);
      haze.addColorStop(0, "rgba(70,120,255,0)");
      haze.addColorStop(1, "rgba(40,80,200,0.45)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, size.height * 0.6, size.width, size.height * 0.4);
      tex.update();
      return tex;
    };

    // Sky (large inverted sphere)
    const sky = MeshBuilder.CreateSphere("sky", { diameter: 2000, segments: 16 }, scene);
    const skyMat = new StandardMaterial("skyMat", scene);
    skyMat.backFaceCulling = false;
    skyMat.emissiveTexture = createSkyTexture("skyTex");
    skyMat.diffuseColor = new Color3(0, 0, 0);
    skyMat.specularColor = new Color3(0, 0, 0);
    skyMat.disableLighting = true;
    sky.material = skyMat;
    sky.isPickable = false;

    const createDirtTexture = (name: string) => {
      const tex = new DynamicTexture(name, { width: 1024, height: 1024 }, scene, false);
      const ctx = tex.getContext();
      const size = tex.getSize();

      // Base asphalt tones
      ctx.fillStyle = "#181a22";
      ctx.fillRect(0, 0, size.width, size.height);

      // Speckled variation
      for (let i = 0; i < 18000; i++) {
        const x = Math.random() * size.width;
        const y = Math.random() * size.height;
        const shade = Math.random();
        const v = Math.floor(30 + shade * 40);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 2, 2);
      }

      // Neon grid accents
      ctx.strokeStyle = "rgba(0, 220, 255, 0.12)";
      ctx.lineWidth = 1;
      for (let x = 0; x < size.width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size.height);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255, 60, 200, 0.08)";
      for (let y = 0; y < size.height; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size.width, y);
        ctx.stroke();
      }

      tex.update();
      return tex;
    };

    // Ground (large)
    const ground = MeshBuilder.CreateGround("ground", { width: 800, height: 800 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    const groundDirtTex = createDirtTexture("groundDirtTex");
    groundDirtTex.uScale = 24;
    groundDirtTex.vScale = 24;
    groundMat.diffuseTexture = groundDirtTex;
    groundMat.specularColor = new Color3(0.05, 0.05, 0.08);
    groundMat.ambientColor = new Color3(0.1, 0.12, 0.2);
    groundMat.emissiveColor = new Color3(0.02, 0.04, 0.08);
    ground.material = groundMat;

    // Distant mountains removed for now

    // Sky texture already applied above.
    // Neon haze for atmosphere
    scene.fogMode = Scene.FOGMODE_EXP;
    scene.fogDensity = 0.0022;
    scene.fogColor = new Color3(0.05, 0.08, 0.16);

    // Procedural buildings (simple boxes with varied heights)
    const createBuildingMaterial = (
      name: string,
      baseColor: string,
      trimColor: string,
      windowOn: string,
      windowOff: string,
      emissiveTint: Color3
    ) => {
      const mat = new StandardMaterial(name, scene);
      const tex = new DynamicTexture(`${name}_tex`, { width: 512, height: 512 }, scene, false);
      const ctx = tex.getContext();
      const size = tex.getSize();

      // Base facade with subtle vertical gradient
      const grad = ctx.createLinearGradient(0, 0, 0, size.height);
      grad.addColorStop(0, baseColor);
      grad.addColorStop(1, "#6f6f6f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size.width, size.height);

      // Trim bands
      ctx.fillStyle = trimColor;
      for (let y = 0; y < size.height; y += 96) {
        ctx.fillRect(0, y + 72, size.width, 6);
      }

      // Window grid
      const winW = 18;
      const winH = 26;
      const gapX = 10;
      const gapY = 14;
      for (let y = 20; y < size.height - winH - 10; y += winH + gapY) {
        for (let x = 16; x < size.width - winW - 10; x += winW + gapX) {
          const lit = Math.random() > 0.55;
          ctx.fillStyle = lit ? windowOn : windowOff;
          ctx.fillRect(x, y, winW, winH);
        }
      }

      // Light grime/noise pass
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      for (let i = 0; i < 220; i++) {
        const x = Math.random() * size.width;
        const y = Math.random() * size.height;
        const w = 20 + Math.random() * 60;
        ctx.fillRect(x, y, w, 2);
      }

      tex.update();
      tex.uScale = 1.0;
      tex.vScale = 2.4;

      mat.diffuseTexture = tex;
      mat.emissiveTexture = tex;
      mat.emissiveColor = emissiveTint;
      mat.specularColor = new Color3(0.04, 0.04, 0.04);
      mat.ambientColor = new Color3(0.08, 0.1, 0.14);
      return mat;
    };

    const buildingMats = [
      createBuildingMaterial("buildingMat_concrete", "#1a1f2b", "#242b3a", "#8ff2ff", "#0a0d12", new Color3(0.2, 0.9, 1.0)),
      createBuildingMaterial("buildingMat_sand", "#1b1c26", "#252632", "#ff7ad9", "#0a0b10", new Color3(1.0, 0.25, 0.8)),
      createBuildingMaterial("buildingMat_brick", "#151824", "#222536", "#7cffb0", "#080a10", new Color3(0.3, 1.0, 0.6)),
      createBuildingMaterial("buildingMat_modern", "#12151f", "#1f2433", "#bba0ff", "#0a0d12", new Color3(0.6, 0.4, 1.0)),
    ];

    for (let i = 0; i < 40; i++) {
      const w = 8 + Math.random() * 20;
      const d = 8 + Math.random() * 20;
      const h = 10 + Math.random() * 60;
      const b = MeshBuilder.CreateBox(`building_${i}`, { width: w, depth: d, height: h }, scene);
      b.position = new Vector3((Math.random() - 0.5) * 700, h / 2, (Math.random() - 0.5) * 700 - 200);
      b.rotation.y = Math.random() * Math.PI * 2;
      b.material = buildingMats[Math.floor(Math.random() * buildingMats.length)];
      b.isPickable = false;
    }

    // Groundcover disabled for neon city vibe

    // People (simple walking NPCs) - circular waypoint movement
    type NPC = { mesh: any; angle: number; radius: number; center: Vector3; speed: number };
    const people: NPC[] = [];
    for (let i = 0; i < 14; i++) {
      const h = 1.8;
      const m = MeshBuilder.CreateBox(`person_${i}`, { width: 0.6, height: h, depth: 0.6 }, scene);
      const mat = new StandardMaterial(`personMat_${i}`, scene);
      mat.diffuseColor = new Color3(Math.random() * 0.8 + 0.2, Math.random() * 0.8 + 0.2, Math.random() * 0.8 + 0.2);
      m.material = mat;
      const center = new Vector3((Math.random() - 0.5) * 300, 0, (Math.random() - 0.5) * 300 - 100);
      const radius = 5 + Math.random() * 30;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 0.8;
      people.push({ mesh: m, angle, radius, center, speed });
    }

    // Birds (flying) - simple circular paths with bobbing
    const birds: { mesh: any; angle: number; radius: number; center: Vector3; speed: number; height: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const b = MeshBuilder.CreateSphere(`bird_${i}`, { diameter: 0.6 }, scene);
      const mat = new StandardMaterial(`birdMat_${i}`, scene);
      mat.emissiveColor = new Color3(0.9, 0.9, 1.0);
      b.material = mat;
      const center = new Vector3((Math.random() - 0.5) * 400, 0, (Math.random() - 0.5) * 400 - 100);
      const radius = 20 + Math.random() * 120;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.6;
      const height = 20 + Math.random() * 40;
      birds.push({ mesh: b, angle, radius, center, speed, height });
    }

    // Animation updates: people and birds
    scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime() / 1000;
      people.forEach((p) => {
        p.angle += p.speed * dt;
        const px = p.center.x + Math.cos(p.angle) * p.radius;
        const pz = p.center.z + Math.sin(p.angle) * p.radius;
        p.mesh.position.set(px, 0.9, pz);
        p.mesh.rotation.y = -p.angle + Math.PI / 2;
      });

      birds.forEach((b) => {
        b.angle += b.speed * dt * 0.6;
        const bx = b.center.x + Math.cos(b.angle) * b.radius;
        const bz = b.center.z + Math.sin(b.angle) * b.radius;
        b.mesh.position.set(bx, b.height + Math.sin(b.angle * 2) * 2.0, bz);
      });
    });

    // First-person camera height above ground
    const eyeHeight = 2;

    // WASD movement for first-person camera.
    const inputMap: { [key: string]: boolean } = {};
    scene.actionManager = new ActionManager(scene);

    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
        const key = evt.sourceEvent.key.toLowerCase();
        // Prevent default browser behavior for movement keys to avoid scrolling
        if (key === "w" || key === "a" || key === "s" || key === "d") {
          try { evt.sourceEvent.preventDefault(); } catch {}
        }
        inputMap[key] = true;
      })
    );

    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = false;
      })
    );

    let lastHeading = 0;

    // Movement: W/S move forward/back relative to camera view, A/D strafe left/right
    const moveSpeed = 12; // world units per second (tune as needed)
    scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime() / 1000;
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
        const speed = moveSpeed * (inputMap["shift"] ? 2 : 1);
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
        const pick = scene.pickWithRay(ray, (mesh) => mesh === ground);

        if (pick && pick.hit && pick.pickedPoint) {
          proposedPos.y = pick.pickedPoint.y + eyeHeight;
        } else {
          // fallback: never go below eye height
          proposedPos.y = eyeHeight;
        }

        camera.position = proposedPos;
      };

      tryMove(move);

      const dir = camera.getDirection(new Vector3(0, 0, 1));
      const heading = ((Math.atan2(dir.x, dir.z) * 180) / Math.PI + 360) % 360;
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
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }} />;
};

export default BabylonWorld;

