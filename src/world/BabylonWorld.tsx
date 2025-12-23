// File: src/world/BabylonWorld.tsx
import React, { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
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

    // Try to remove the default pointer input to avoid double-handling. The
    // exact property paths can vary between Babylon versions so guard with try/catch.
    try {
      // @ts-ignore - internal inputs may not be publicly typed in some versions
      if (camera.inputs && camera.inputs.attached && camera.inputs.attached.pointers) {
        // @ts-ignore
        camera.inputs.remove(camera.inputs.attached.pointers);
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
        inputMap[evt.sourceEvent.key.toLowerCase()] = true;
      })
    );

    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = false;
      })
    );

    const speed = 1.2;
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

      if (inputMap["w"]) camera.target.addInPlace(forward.scale(moveSpeed));
      if (inputMap["s"]) camera.target.addInPlace(forward.scale(-moveSpeed));
      if (inputMap["a"]) camera.target.addInPlace(right.scale(moveSpeed));
      if (inputMap["d"]) camera.target.addInPlace(right.scale(-moveSpeed));
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
