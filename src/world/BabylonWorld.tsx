// File: src/world/BabylonWorld.tsx
import React, { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Ray,
  Texture,
  HemisphericLight,
  PointLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  ActionManager,
  ExecuteCodeAction,
} from "@babylonjs/core";

const BabylonWorld: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    // Camera - pulled back to see the environment
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 3.5,
      80,
      new Vector3(0, 5, 0),
      scene
    );

    // Attach default controls but remove the built-in pointer rotation so we can
    // implement a custom pointer drag handler that inverts the Y-axis (move
    // mouse up -> look up).
    camera.attachControl(canvasRef.current, true);

    // Try to remove default camera inputs to avoid double-handling. The
    // exact property paths can vary between Babylon versions so guard with try/catch.
    try {
      // @ts-ignore - internal inputs may not be publicly typed in some versions
      if (camera.inputs && camera.inputs.attached) {
        // Remove pointer-based rotation inputs (we handle rotation via Pointer Lock)
        if (camera.inputs.attached.pointers) {
          // @ts-ignore
          camera.inputs.remove(camera.inputs.attached.pointers);
        }
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

    // Pointer-lock based controls (inverted Y): click to lock pointer to canvas
    // and use the Pointer Lock API so mouse movement drives camera yaw/pitch
    const rotSpeed = 0.0025; // tuning value for movementX/movementY

    // Y-axis set to inverted by default (no toggle). -1 means moving the mouse up looks up.
    const pointerYSign = -1;

    const onMouseMove = (ev: MouseEvent) => {
      // Only react while pointer is locked to our canvas
      if (document.pointerLockElement !== canvasRef.current) return;
      const dx = ev.movementX || 0;
      const dy = ev.movementY || 0;

      camera.alpha -= dx * rotSpeed;
      // Apply pointerYSign so users can invert mapping with a keypress
      camera.beta += dy * rotSpeed * pointerYSign;

      const minBeta = 0.1;
      const maxBeta = Math.PI - 0.1;
      if (camera.beta < minBeta) camera.beta = minBeta;
      if (camera.beta > maxBeta) camera.beta = maxBeta;
    };

    // Wheel handler: temporarily disabled — scroll wheel will not change camera pitch.
    // Re-enable later by restoring the onWheel handler and registration if desired.

    // No pointer-lock overlay handling (overlay removed).

    const requestLock = () => {
      canvasRef.current?.requestPointerLock?.();
    };

    canvasRef.current?.addEventListener("click", requestLock);
    document.addEventListener("mousemove", onMouseMove);

    // ensure we remove the listeners in cleanup below (we'll reference the names there)


    // Ambient light and sun
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.6;
    const sunLight = new PointLight("sunLight", new Vector3(50, 120, -80), scene);
    sunLight.intensity = 1.2;

    // Sky (large inverted sphere)
    const sky = MeshBuilder.CreateSphere("sky", { diameter: 2000, segments: 16 }, scene);
    const skyMat = new StandardMaterial("skyMat", scene);
    skyMat.backFaceCulling = false;
    // Soft gradient sky color
    skyMat.diffuseColor = new Color3(0.53, 0.81, 0.98); // sky blue
    skyMat.specularColor = new Color3(0, 0, 0);
    sky.material = skyMat;
    sky.isPickable = false;

    // Sun (emissive sphere)
    const sun = MeshBuilder.CreateSphere("sun", { diameter: 18 }, scene);
    const sunMat = new StandardMaterial("sunMat", scene);
    sunMat.emissiveColor = new Color3(1, 0.95, 0.6);
    sun.material = sunMat;
    sun.position = new Vector3(120, 120, -180);
    sun.isPickable = false;

    // Ground (large)
    const ground = MeshBuilder.CreateGround("ground", { width: 800, height: 800 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.22, 0.7, 0.28); // grass-like green
    groundMat.specularColor = new Color3(0, 0, 0);
    ground.material = groundMat;

    // Distant mountains (simple shapes)
    const mountainMat = new StandardMaterial("mountainMat", scene);
    mountainMat.diffuseColor = new Color3(0.5, 0.5, 0.5);

    const mountain1 = MeshBuilder.CreateBox(
      "mountain1",
      { width: 200, height: 70, depth: 40 },
      scene
    );
    mountain1.position = new Vector3(-150, 35, -300);
    mountain1.rotation = new Vector3(0, 0.2, 0);
    mountain1.material = mountainMat;

    const mountain2 = MeshBuilder.CreateBox(
      "mountain2",
      { width: 180, height: 60, depth: 40 },
      scene
    );
    mountain2.position = new Vector3(180, 30, -320);
    mountain2.rotation = new Vector3(0, -0.15, 0);
    mountain2.material = mountainMat;

    // Clouds - simple planes with transparency
    const cloudMat = new StandardMaterial("cloudMat", scene);
    cloudMat.diffuseColor = new Color3(1, 1, 1);
    cloudMat.alpha = 0.85;
    cloudMat.specularColor = new Color3(0, 0, 0);

    for (let i = 0; i < 8; i++) {
      const cloud = MeshBuilder.CreatePlane(`cloud_${i}`, { size: 60 }, scene);
      cloud.rotation = new Vector3(0, 0, 0);
      cloud.position = new Vector3((i - 4) * 80 + (Math.random() * 40 - 20), 120 + Math.random() * 20, -100 + Math.random() * 200);
      cloud.material = cloudMat;
      cloud.billboardMode = 7; // face camera
      cloud.isPickable = false;
    }

    // Use a textured sky for more realism (uses existing asset)
    skyMat.diffuseTexture = new Texture('/src/assets/textures/sky.jpg', scene);
    skyMat.specularColor = new Color3(0, 0, 0);
    // Soft exponential fog tuned for large outdoor scenes
    scene.fogMode = Scene.FOGMODE_EXP;
    scene.fogDensity = 0.0009;
    scene.fogColor = new Color3(0.82, 0.91, 1.0);

    // Procedural buildings (simple boxes with varied heights)
    const buildingMat = new StandardMaterial("buildingMat", scene);
    buildingMat.diffuseColor = new Color3(0.72, 0.72, 0.75);
    buildingMat.specularColor = new Color3(0.02, 0.02, 0.02);

    for (let i = 0; i < 40; i++) {
      const w = 8 + Math.random() * 20;
      const d = 8 + Math.random() * 20;
      const h = 10 + Math.random() * 60;
      const b = MeshBuilder.CreateBox(`building_${i}`, { width: w, depth: d, height: h }, scene);
      b.position = new Vector3((Math.random() - 0.5) * 700, h / 2, (Math.random() - 0.5) * 700 - 200);
      b.material = buildingMat;
      b.isPickable = false;
    }

    // Groundcover: grass via instanced planes (low-overhead)
    const grassMat = new StandardMaterial("grassMat", scene);
    grassMat.diffuseTexture = new Texture('/src/assets/textures/grass.jpg', scene);
    grassMat.backFaceCulling = false;
    const baseGrass = MeshBuilder.CreatePlane('grassBase', { size: 1 }, scene);
    baseGrass.material = grassMat;
    baseGrass.billboardMode = 7; // always face camera
    baseGrass.isPickable = false;
    baseGrass.rotation = new Vector3(Math.PI / 2, 0, 0);
    baseGrass.position.y = 0.5;

    for (let x = -300; x <= 300; x += 3) {
      for (let z = -300; z <= 300; z += 3) {
        if (Math.random() < 0.12) {
          const inst = baseGrass.createInstance(`g_${x}_${z}`);
          inst.position = new Vector3(x + (Math.random() - 0.5) * 1.8, 0.5, z + (Math.random() - 0.5) * 1.8);
          inst.scaling = new Vector3(0.8 + Math.random() * 1.2, 0.8 + Math.random() * 1.2, 1);
        }
      }
    }
    baseGrass.setEnabled(false);

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

    // Light shafts (fake volumetric) - additive billboards near sun
    const shaftMat = new StandardMaterial('shaftMat', scene);
    shaftMat.emissiveColor = new Color3(1, 0.95, 0.8);
    shaftMat.alpha = 0.18;
    shaftMat.backFaceCulling = false;
    const shaft = MeshBuilder.CreatePlane('shaft', { width: 160, height: 600 }, scene);
    shaft.material = shaftMat;
    shaft.position = new Vector3(90, 80, -140);
    shaft.billboardMode = 7;
    shaft.isPickable = false;

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

    // Simple trees (trunk + canopy)
    const trunkMat = new StandardMaterial("trunkMat", scene);
    trunkMat.diffuseColor = new Color3(0.42, 0.26, 0.13);

    const leafMat = new StandardMaterial("leafMat", scene);
    leafMat.diffuseColor = new Color3(0.12, 0.6, 0.16);

    for (let x = -300; x <= 300; x += 60) {
      if (Math.abs(x) < 40) continue; // leave center area clear
      const z = -50 + (Math.random() - 0.5) * 120;
      const trunk = MeshBuilder.CreateCylinder(`trunk_${x}`, { diameterTop: 0.8, diameterBottom: 1.2, height: 6 }, scene);
      trunk.position = new Vector3(x + Math.random() * 16, 3, z);
      trunk.material = trunkMat;

      const canopy = MeshBuilder.CreateSphere(`canopy_${x}`, { diameter: 8 }, scene);
      canopy.position = new Vector3(trunk.position.x, 7, trunk.position.z);
      canopy.material = leafMat;
    }

    // Remove player sphere (no red ball in center) and keep camera target on ground
    camera.target = new Vector3(0, 2, 0);

    // WASD movement for camera orbit (optional: move camera target).
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

    // Movement: W/S move forward/back relative to camera view, A/D strafe left/right
    const moveSpeed = 0.6; // world units per frame tick (tune as needed)
    scene.onBeforeRenderObservable.add(() => {
      // forward vector: from camera position to target, flattened to XZ plane
      const forward = camera.target.subtract(camera.position);
      forward.y = 0;
      forward.normalize();
      // right vector (perpendicular on XZ plane)
      const right = Vector3.Cross(forward, Vector3.Up());
      right.normalize();

      // Try to move while preventing going below the ground. We raycast down at the proposed
      // XZ position to find the ground height and then clamp the target Y to stay above it.
      const tryMove = (delta: Vector3) => {
        // clone so we don't mutate camera.target until after checks
        const proposedTarget = camera.target.clone();
        proposedTarget.addInPlace(delta);

        // Raycast down from a high point above the proposed position to find the ground
        const rayOrigin = new Vector3(proposedTarget.x, 50, proposedTarget.z);
        const down = new Vector3(0, -1, 0);
        const ray = new Ray(rayOrigin, down, 200);
        const pick = scene.pickWithRay(ray, (mesh) => mesh === ground);

        if (pick && pick.hit && pick.pickedPoint) {
          const minY = pick.pickedPoint.y + 2; // keep player ~2 units above ground
          if (proposedTarget.y < minY) proposedTarget.y = minY;
        } else {
          // fallback: never go below y = 2
          if (proposedTarget.y < 2) proposedTarget.y = 2;
        }

        camera.target = proposedTarget;
      };

      if (inputMap["w"]) tryMove(forward.scale(moveSpeed));
      if (inputMap["s"]) tryMove(forward.scale(-moveSpeed));
      if (inputMap["a"]) tryMove(right.scale(moveSpeed));
      if (inputMap["d"]) tryMove(right.scale(-moveSpeed));
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => {
      engine.resize();
    });

    return () => {
      // remove pointer-lock related listeners and overlay
      try { canvasRef.current?.removeEventListener("click", requestLock as any); } catch {}
      try { document.removeEventListener("mousemove", onMouseMove as any); } catch {}

      scene.dispose();
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }} />;
};

export default BabylonWorld;
