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
  SceneLoader,
  Mesh,
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
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      try {
        // @ts-ignore - touch input may not be publicly typed in some versions
        if (camera.inputs?.attached?.touch) {
          // Lower values = faster rotation on touch
          // @ts-ignore
          camera.inputs.attached.touch.touchAngularSensibility = 1200;
        }
      } catch {}
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
      const ctx = tex.getContext() as any;
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
      const ctx = tex.getContext() as any;
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

    const createNeonSignTexture = (name: string, label: string, glow: string) => {
      const tex = new DynamicTexture(name, { width: 512, height: 256 }, scene, false);
      const ctx = tex.getContext() as CanvasRenderingContext2D;
      const size = tex.getSize();
      ctx.fillStyle = "rgba(5,8,16,1)";
      ctx.fillRect(0, 0, size.width, size.height);
      ctx.fillStyle = glow;
      ctx.font = "bold 64px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = glow;
      ctx.shadowBlur = 18;
      ctx.fillText(label, size.width / 2, size.height / 2);
      tex.update();
      return tex;
    };

    const createPickupTexture = (name: string, label: string, color: string) => {
      const tex = new DynamicTexture(name, { width: 256, height: 256 }, scene, false);
      const ctx = tex.getContext() as CanvasRenderingContext2D;
      const size = tex.getSize();
      ctx.fillStyle = "rgba(8,10,14,1)";
      ctx.fillRect(0, 0, size.width, size.height);
      ctx.fillStyle = color;
      ctx.font = "bold 72px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.fillText(label, size.width / 2, size.height / 2);
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

    // Street props and neon set dressing
    const metalMat = new StandardMaterial("metalMat", scene);
    metalMat.diffuseColor = new Color3(0.16, 0.18, 0.26);
    metalMat.specularColor = new Color3(0.3, 0.3, 0.4);

    const neonCyan = new StandardMaterial("neonCyan", scene);
    neonCyan.emissiveColor = new Color3(0.1, 0.9, 1.0);
    neonCyan.diffuseColor = new Color3(0.1, 0.6, 0.7);

    const neonMagenta = new StandardMaterial("neonMagenta", scene);
    neonMagenta.emissiveColor = new Color3(1.0, 0.25, 0.8);
    neonMagenta.diffuseColor = new Color3(0.6, 0.1, 0.5);

    const neonGreen = new StandardMaterial("neonGreen", scene);
    neonGreen.emissiveColor = new Color3(0.3, 1.0, 0.6);
    neonGreen.diffuseColor = new Color3(0.1, 0.5, 0.3);

    // Neon street lamps
    for (let i = -3; i <= 3; i++) {
      const pole = MeshBuilder.CreateCylinder(`lamp_pole_${i}`, { height: 12, diameter: 1.2 }, scene);
      pole.position = new Vector3(i * 70, 6, 40);
      pole.material = metalMat;

      const ring = MeshBuilder.CreateTorus(`lamp_ring_${i}`, { diameter: 5, thickness: 0.5 }, scene);
      ring.position = new Vector3(i * 70, 12, 40);
      ring.material = neonCyan;
      ring.rotation = new Vector3(Math.PI / 2, 0, 0);
    }

    // Neon billboards
    const signMatA = new StandardMaterial("signMatA", scene);
    signMatA.emissiveTexture = createNeonSignTexture("signTexA", "ARCADIA", "#6af6ff");
    signMatA.emissiveColor = new Color3(0.4, 0.8, 1.0);
    signMatA.disableLighting = true;
    const signA = MeshBuilder.CreatePlane("billboard_a", { width: 50, height: 18 }, scene);
    signA.position = new Vector3(-120, 28, 20);
    signA.rotation = new Vector3(0, Math.PI / 6, 0);
    signA.material = signMatA;

    const signMatB = new StandardMaterial("signMatB", scene);
    signMatB.emissiveTexture = createNeonSignTexture("signTexB", "SPLICE", "#ff6bd6");
    signMatB.emissiveColor = new Color3(1.0, 0.35, 0.8);
    signMatB.disableLighting = true;
    const signB = MeshBuilder.CreatePlane("billboard_b", { width: 46, height: 16 }, scene);
    signB.position = new Vector3(140, 24, 10);
    signB.rotation = new Vector3(0, -Math.PI / 5, 0);
    signB.material = signMatB;

    // Holo kiosks
    for (let i = 0; i < 5; i++) {
      const base = MeshBuilder.CreateCylinder(`kiosk_base_${i}`, { height: 3, diameter: 4 }, scene);
      base.position = new Vector3(-80 + i * 40, 1.5, -40);
      base.material = metalMat;

      const holo = MeshBuilder.CreatePlane(`kiosk_holo_${i}`, { width: 6, height: 8 }, scene);
      holo.position = new Vector3(-80 + i * 40, 6, -40);
      holo.material = neonMagenta;
      holo.billboardMode = 7;
    }

    // Benches
    for (let i = 0; i < 6; i++) {
      const bench = MeshBuilder.CreateBox(`bench_${i}`, { width: 8, height: 1, depth: 2 }, scene);
      bench.position = new Vector3(-120 + i * 40, 0.6, -90);
      bench.material = metalMat;
    }

    // Crates
    for (let i = 0; i < 8; i++) {
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
    pickupMatSword.disableLighting = true;
    const pickupMatPotion = new StandardMaterial("pickupPotionMat", scene);
    pickupMatPotion.emissiveTexture = createPickupTexture("pickupPotionTex", "P", "#6af6ff");
    pickupMatPotion.disableLighting = true;
    const pickupMatGold = new StandardMaterial("pickupGoldMat", scene);
    pickupMatGold.emissiveTexture = createPickupTexture("pickupGoldTex", "G", "#ffd16a");
    pickupMatGold.disableLighting = true;

    const pickups: { mesh: any; baseY: number; phase: number }[] = [];
    const flickerMats: { mat: StandardMaterial; base: Color3 }[] = [
      { mat: neonCyan, base: new Color3(0.1, 0.9, 1.0) },
      { mat: neonMagenta, base: new Color3(1.0, 0.25, 0.8) },
      { mat: neonGreen, base: new Color3(0.3, 1.0, 0.6) },
      { mat: signMatA, base: new Color3(0.4, 0.8, 1.0) },
      { mat: signMatB, base: new Color3(1.0, 0.35, 0.8) },
    ];
    const pickupDefs = [
      { id: "Sword", mat: pickupMatSword },
      { id: "Potion", mat: pickupMatPotion },
      { id: "Gold", mat: pickupMatGold },
    ];
    for (let i = 0; i < 12; i++) {
      const def = pickupDefs[i % pickupDefs.length];
      const base = new Mesh(`pickup_${def.id}_${i}`, scene);
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
        const hilt = MeshBuilder.CreateBox(`pickup_sword_hilt_${i}`, { width: 1.4, height: 0.3, depth: 0.4 }, scene);
        hilt.position = new Vector3(0, 0.6, 0);
        hilt.material = metalMat;
        hilt.parent = base;
      }

      if (def.id === "Potion") {
        const bottle = MeshBuilder.CreateCylinder(`pickup_potion_bottle_${i}`, { height: 2.4, diameter: 1.2 }, scene);
        bottle.position = new Vector3(0, 1.4, 0);
        bottle.material = neonMagenta;
        bottle.parent = base;
        const cap = MeshBuilder.CreateCylinder(`pickup_potion_cap_${i}`, { height: 0.4, diameter: 0.7 }, scene);
        cap.position = new Vector3(0, 2.8, 0);
        cap.material = metalMat;
        cap.parent = base;
      }

      if (def.id === "Gold") {
        const coin = MeshBuilder.CreateCylinder(`pickup_gold_coin_${i}`, { height: 0.4, diameter: 1.6 }, scene);
        coin.position = new Vector3(0, 1.1, 0);
        coin.material = neonGreen;
        coin.parent = base;
      }

      base.getChildMeshes().forEach((m) => {
        m.isPickable = true;
        m.metadata = { type: "pickup", item: def.id };
      });
      base.isPickable = true;
      base.metadata = { type: "pickup", item: def.id };
      pickups.push({ mesh: base, baseY: base.position.y, phase: Math.random() * Math.PI * 2 });
    }

    // NPCs with dialogue
    const npcMat = new StandardMaterial("npcMat", scene);
    npcMat.diffuseColor = new Color3(0.18, 0.2, 0.3);
    npcMat.emissiveColor = new Color3(0.2, 0.6, 1.0);
    const npcIds = ["aria", "kade", "mira", "vex", "lux", "zed"];
    npcIds.forEach((id, idx) => {
      const npc = MeshBuilder.CreateCylinder(`npc_${id}`, { height: 5, diameter: 2.8 }, scene);
      npc.position = new Vector3(-30 + idx * 12, 2.5, -60 + (idx % 2) * 10);
      npc.material = npcMat;
      npc.isPickable = true;
      npc.metadata = { type: "npc", id };
    });

    // Simple imported models (free assets)
    SceneLoader.ImportMeshAsync("", "https://assets.babylonjs.com/meshes/", "robot.glb", scene)
      .then((result) => {
        result.meshes.forEach((m) => {
          if (m instanceof Mesh) {
            m.position = new Vector3(40, 0, -30);
            m.scaling = new Vector3(4, 4, 4);
          }
          m.isPickable = false;
        });
      })
      .catch(() => {});
    SceneLoader.ImportMeshAsync("", "https://assets.babylonjs.com/meshes/", "Dude.glb", scene)
      .then((result) => {
        result.meshes.forEach((m) => {
          if (m instanceof Mesh) {
            m.position = new Vector3(-70, 0, -20);
            m.scaling = new Vector3(3.5, 3.5, 3.5);
          }
          m.isPickable = false;
        });
      })
      .catch(() => {});

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

    // Animation updates: people, drones, pickups
    scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime() / 1000;
      people.forEach((p) => {
        p.angle += p.speed * dt;
        const px = p.center.x + Math.cos(p.angle) * p.radius;
        const pz = p.center.z + Math.sin(p.angle) * p.radius;
        p.mesh.position.set(px, 0.9, pz);
        p.mesh.rotation.y = -p.angle + Math.PI / 2;
      });

      drones.forEach((d) => {
        d.angle += d.speed * dt * 0.6;
        const dx = d.center.x + Math.cos(d.angle) * d.radius;
        const dz = d.center.z + Math.sin(d.angle) * d.radius;
        d.mesh.position.set(dx, d.height + Math.sin(d.angle * 2) * 2.0, dz);
      });

      pickups.forEach((p) => {
        p.mesh.position.y = p.baseY + Math.sin(performance.now() * 0.002 + p.phase) * 0.8;
        p.mesh.rotation.y += dt * 0.8;
      });

      const t = performance.now() * 0.002;
      flickerMats.forEach((f, i) => {
        const pulse = 0.6 + Math.sin(t + i) * 0.2 + Math.sin(t * 2.3 + i) * 0.1;
        f.mat.emissiveColor = f.base.scale(pulse);
      });
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
        inputMap[evt.sourceEvent.key.toLowerCase()] = false;
        if (evt.sourceEvent.code === "Space") {
          inputMap["space"] = false;
        }
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

