// File: src/world/BabylonWorld.tsx
import React, { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  UniversalCamera,
  Vector3,
  Ray,
  Texture,
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
    scene.clearColor = new Color4(0.7, 0.85, 0.98, 1);

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

    // Ambient light and sun
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.6;
    const sunLight = new PointLight("sunLight", new Vector3(50, 120, -80), scene);
    sunLight.intensity = 1.2;

    const createSkyTexture = (name: string) => {
      const tex = new DynamicTexture(name, { width: 1024, height: 1024 }, scene, false);
      const ctx = tex.getContext();
      const size = tex.getSize();
      const grad = ctx.createLinearGradient(0, 0, 0, size.height);
      grad.addColorStop(0, "#7fb8ff");
      grad.addColorStop(0.6, "#a9d6ff");
      grad.addColorStop(1, "#d7efff");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size.width, size.height);
      for (let i = 0; i < 300; i++) {
        const x = Math.random() * size.width;
        const y = Math.random() * size.height * 0.7;
        const r = 1 + Math.random() * 2.5;
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      tex.update();
      return tex;
    };

    // Sky (large inverted sphere) - disabled for visibility debugging
    const sky = MeshBuilder.CreateSphere("sky", { diameter: 2000, segments: 16 }, scene);
    const skyMat = new StandardMaterial("skyMat", scene);
    skyMat.backFaceCulling = false;
    skyMat.diffuseTexture = createSkyTexture("skyTex");
    skyMat.specularColor = new Color3(0, 0, 0);
    sky.material = skyMat;
    sky.isPickable = false;
    sky.setEnabled(false);

    // Sun (emissive sphere)
    const sun = MeshBuilder.CreateSphere("sun", { diameter: 18 }, scene);
    const sunMat = new StandardMaterial("sunMat", scene);
    sunMat.emissiveColor = new Color3(1, 0.95, 0.6);
    sun.material = sunMat;
    sun.position = new Vector3(120, 120, -180);
    sun.isPickable = false;

    const createGrassTexture = (name: string) => {
      const tex = new DynamicTexture(name, { width: 1024, height: 1024 }, scene, false);
      const ctx = tex.getContext();
      const size = tex.getSize();

      // Base grass tones
      ctx.fillStyle = "#3f7b3b";
      ctx.fillRect(0, 0, size.width, size.height);

      // Layered noise for variation
      for (let i = 0; i < 16000; i++) {
        const x = Math.random() * size.width;
        const y = Math.random() * size.height;
        const shade = Math.random();
        const g = Math.floor(85 + shade * 80);
        const r = Math.floor(40 + shade * 40);
        const b = Math.floor(30 + shade * 35);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 2, 2);
      }

      // Soft directional blades
      ctx.strokeStyle = "rgba(200, 230, 190, 0.12)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 1400; i++) {
        const x = Math.random() * size.width;
        const y = Math.random() * size.height;
        const len = 4 + Math.random() * 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() * 2 - 1), y + len);
        ctx.stroke();
      }

      tex.update();
      return tex;
    };

    const createRockTexture = (name: string) => {
      const tex = new DynamicTexture(name, { width: 1024, height: 1024 }, scene, false);
      const ctx = tex.getContext();
      const size = tex.getSize();

      ctx.fillStyle = "#6e6e6e";
      ctx.fillRect(0, 0, size.width, size.height);

      for (let i = 0; i < 14000; i++) {
        const x = Math.random() * size.width;
        const y = Math.random() * size.height;
        const shade = Math.random();
        const v = Math.floor(90 + shade * 90);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 2, 2);
      }

      ctx.fillStyle = "rgba(40,40,40,0.3)";
      for (let i = 0; i < 1200; i++) {
        const x = Math.random() * size.width;
        const y = Math.random() * size.height;
        const w = 10 + Math.random() * 80;
        const h = 6 + Math.random() * 40;
        ctx.fillRect(x, y, w, h);
      }

      tex.update();
      return tex;
    };

    const createDirtTexture = (name: string) => {
      const tex = new DynamicTexture(name, { width: 1024, height: 1024 }, scene, false);
      const ctx = tex.getContext();
      const size = tex.getSize();

      // Base dirt tones
      ctx.fillStyle = "#6b5a46";
      ctx.fillRect(0, 0, size.width, size.height);

      // Speckled variation
      for (let i = 0; i < 18000; i++) {
        const x = Math.random() * size.width;
        const y = Math.random() * size.height;
        const shade = Math.random();
        const r = Math.floor(80 + shade * 60);
        const g = Math.floor(60 + shade * 50);
        const b = Math.floor(45 + shade * 40);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 2, 2);
      }

      // Subtle darker clumps
      ctx.fillStyle = "rgba(40, 30, 20, 0.18)";
      for (let i = 0; i < 900; i++) {
        const x = Math.random() * size.width;
        const y = Math.random() * size.height;
        const w = 10 + Math.random() * 80;
        const h = 6 + Math.random() * 30;
        ctx.fillRect(x, y, w, h);
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
    groundMat.specularColor = new Color3(0.02, 0.02, 0.02);
    groundMat.ambientColor = new Color3(0.25, 0.35, 0.22);
    ground.material = groundMat;

    // Distant mountains (simple shapes)
    const mountainMat = new StandardMaterial("mountainMat", scene);
    const rockTex = createRockTexture("mountainRockTex");
    rockTex.uScale = 2;
    rockTex.vScale = 2;
    mountainMat.diffuseTexture = rockTex;
    mountainMat.specularColor = new Color3(0.02, 0.02, 0.02);
    const mountainTints = [
      new Color3(0.62, 0.62, 0.62),
      new Color3(0.55, 0.6, 0.58),
      new Color3(0.58, 0.54, 0.5),
      new Color3(0.5, 0.56, 0.62),
    ];
    const makeMountainMat = (name: string, tint: Color3) => {
      const mat = mountainMat.clone(name) as StandardMaterial;
      mat.diffuseColor = tint;
      return mat;
    };

    const mountain1 = MeshBuilder.CreateBox(
      "mountain1",
      { width: 200, height: 45, depth: 40 },
      scene
    );
    mountain1.position = new Vector3(-150, 35, 300);
    mountain1.rotation = new Vector3(0, 0.2, 0);
    mountain1.material = makeMountainMat("mountainMat_1", mountainTints[0]);

    const mountain2 = MeshBuilder.CreateBox(
      "mountain2",
      { width: 180, height: 40, depth: 40 },
      scene
    );
    mountain2.position = new Vector3(180, 30, 320);
    mountain2.rotation = new Vector3(0, -0.15, 0);
    mountain2.material = makeMountainMat("mountainMat_2", mountainTints[1]);

    const mountain3 = MeshBuilder.CreateBox(
      "mountain3",
      { width: 160, height: 38, depth: 40 },
      scene
    );
    mountain3.position = new Vector3(20, 26, 340);
    mountain3.rotation = new Vector3(0, 0.05, 0);
    mountain3.material = makeMountainMat("mountainMat_3", mountainTints[2]);

    // 3D clouds - clustered spheres
    const cloudMat = new StandardMaterial("cloudMat", scene);
    cloudMat.diffuseColor = new Color3(1, 1, 1);
    cloudMat.emissiveColor = new Color3(0.9, 0.9, 0.9);
    cloudMat.alpha = 0.75;
    cloudMat.specularColor = new Color3(0, 0, 0);

    const createCloudCluster = (name: string, center: Vector3) => {
      const count = 6 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const puff = MeshBuilder.CreateSphere(`${name}_puff_${i}`, { diameter: 18 + Math.random() * 22, segments: 8 }, scene);
        puff.position = new Vector3(
          center.x + (Math.random() - 0.5) * 40,
          center.y + (Math.random() - 0.5) * 10,
          center.z + (Math.random() - 0.5) * 40
        );
        puff.material = cloudMat;
        puff.isPickable = false;
      }
    };

    for (let i = 0; i < 6; i++) {
      const center = new Vector3((i - 3) * 140 + (Math.random() * 50 - 25), 130 + Math.random() * 30, -120 + Math.random() * 200);
      createCloudCluster(`cloud_${i}`, center);
    }

    // Sky texture already applied above.
    // Fog disabled for visibility debugging
    scene.fogMode = Scene.FOGMODE_NONE;

    // Procedural buildings (simple boxes with varied heights)
    const createBuildingMaterial = (
      name: string,
      baseColor: string,
      trimColor: string,
      windowOn: string,
      windowOff: string
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
      mat.specularColor = new Color3(0.04, 0.04, 0.04);
      mat.ambientColor = new Color3(0.2, 0.2, 0.2);
      return mat;
    };

    const buildingMats = [
      createBuildingMaterial("buildingMat_concrete", "#b6b6b6", "#9a9a9a", "#ffd9a8", "#262626"),
      createBuildingMaterial("buildingMat_sand", "#c7b49a", "#a8927a", "#ffe3b5", "#2a2a2a"),
      createBuildingMaterial("buildingMat_brick", "#b07a6c", "#8a5d52", "#ffd2a1", "#292421"),
      createBuildingMaterial("buildingMat_modern", "#9aa7b5", "#7a8794", "#d9ecff", "#1f2328"),
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

    // Groundcover: grass via instanced planes (low-overhead)
    const grassMat = new StandardMaterial("grassMat", scene);
    const tuftGrassTex = createGrassTexture("tuftGrassTex");
    tuftGrassTex.uScale = 3;
    tuftGrassTex.vScale = 3;
    grassMat.diffuseTexture = tuftGrassTex;
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

