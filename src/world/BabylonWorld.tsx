// File: src/world/BabylonWorld.tsx
import React, { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  SceneLoader,
  FreeCamera,
} from "@babylonjs/core";

const BabylonWorld: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    // First-person camera
    const camera = new FreeCamera("fpsCamera", new Vector3(0, 2, -10), scene);
    camera.attachControl(canvasRef.current, true);
    camera.speed = 0.2;

    // Lights
    const light = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
    light.intensity = 0.9;

    // Ground (grass)
    const ground = MeshBuilder.CreateGround("ground", { width: 200, height: 200 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.3, 0.8, 0.3);
    ground.material = groundMat;

    // Mountains (gray boxes for simplicity)
    const mountainMat = new StandardMaterial("mountainMat", scene);
    mountainMat.diffuseColor = new Color3(0.5, 0.5, 0.5);

    for (let i = 0; i < 5; i++) {
      const mountain = MeshBuilder.CreateBox(`mountain${i}`, { width: 20, height: 10, depth: 20 }, scene);
      mountain.position = new Vector3(-50 + i * 25, 5, 50 + i * -30);
      mountain.material = mountainMat;
    }

    // Sky (simple blue)
    scene.clearColor = new Color4(0.53, 0.81, 0.98, 1); // light blue sky

    // Handle WASD movement
    const keys = {
      w: false,
      a: false,
      s: false,
      d: false,
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (keys.hasOwnProperty(k)) keys[k as keyof typeof keys] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (keys.hasOwnProperty(k)) keys[k as keyof typeof keys] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    scene.onBeforeRenderObservable.add(() => {
      const speed = 0.2;
      if (keys.w) camera.position.addInPlace(camera.getDirection(Vector3.Forward()).scale(speed));
      if (keys.s) camera.position.addInPlace(camera.getDirection(Vector3.Forward()).scale(-speed));
      if (keys.a) camera.position.addInPlace(camera.getDirection(Vector3.Right()).scale(-speed));
      if (keys.d) camera.position.addInPlace(camera.getDirection(Vector3.Right()).scale(speed));
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => {
      engine.resize();
    });

    return () => {
      engine.dispose();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }} />;
};

export default BabylonWorld;
