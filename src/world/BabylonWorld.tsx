// File: src/world/BabylonWorld.tsx
import React, { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";

const BabylonWorld: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    // Sky color
    scene.clearColor = new BABYLON.Color3(0.53, 0.81, 0.98);

    // Camera
    const camera = new BABYLON.UniversalCamera(
      "camera",
      new BABYLON.Vector3(0, 2, -5),
      scene
    );
    camera.attachControl(canvas, true);

    // Keyboard controls
    camera.keysUp.push(87); // W
    camera.keysDown.push(83); // S
    camera.keysLeft.push(65); // A
    camera.keysRight.push(68); // D
    camera.speed = 0.2;

    // Light
    const light = new BABYLON.HemisphericLight(
      "hemiLight",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light.intensity = 0.9;

    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: 100, height: 100 },
      scene
    );
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.1, 0.7, 0.2);
    ground.material = groundMat;

    // Mountains
    const mountainMaterial = new BABYLON.StandardMaterial(
      "mountainMat",
      scene
    );
    mountainMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);

    const mountain1 = BABYLON.MeshBuilder.CreateBox(
      "mountain1",
      { width: 10, height: 8, depth: 6 },
      scene
    );
    mountain1.position = new BABYLON.Vector3(15, 4, 20);
    mountain1.material = mountainMaterial;

    const mountain2 = BABYLON.MeshBuilder.CreateBox(
      "mountain2",
      { width: 8, height: 6, depth: 10 },
      scene
    );
    mountain2.position = new BABYLON.Vector3(-20, 3, 30);
    mountain2.material = mountainMaterial;

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => engine.resize());

    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100vh" }} />;
};

export default BabylonWorld;
