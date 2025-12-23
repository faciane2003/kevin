// File: src/world/BabylonWorld.tsx

import React, { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
} from "@babylonjs/core";

const BabylonWorld: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    // Camera
    const camera = new FreeCamera("fpsCamera", new Vector3(0, 2, -5), scene);
    camera.attachControl(canvasRef.current, true);
    camera.speed = 0.5; // movement speed

    // Light
    const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
    light.intensity = 0.9;

    // Ground
    const ground = MeshBuilder.CreateGround("ground", { width: 200, height: 200 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.3, 0.8, 0.3); // green grass
    ground.material = groundMat;

    // Mountains (simple boxes)
    const mountainMat = new StandardMaterial("mountainMat", scene);
    mountainMat.diffuseColor = new Color3(0.5, 0.5, 0.5);

    const mountain1 = MeshBuilder.CreateBox("mountain1", { width: 20, height: 15, depth: 20 }, scene);
    mountain1.position = new Vector3(30, 7.5, 50);
    mountain1.material = mountainMat;

    const mountain2 = MeshBuilder.CreateBox("mountain2", { width: 30, height: 20, depth: 30 }, scene);
    mountain2.position = new Vector3(-40, 10, 80);
    mountain2.material = mountainMat;

    // Sky color
    scene.clearColor = new Color4(0.53, 0.81, 0.92, 1); // light blue sky

    // Enable first-person controls with WASD
    camera.keysUp.push(87); // W
    camera.keysDown.push(83); // S
    camera.keysLeft.push(65); // A
    camera.keysRight.push(68); // D

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => {
      engine.resize();
    });

    return () => {
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }} />;
};

export default BabylonWorld;
