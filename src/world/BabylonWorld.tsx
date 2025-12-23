import React, { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  Vector3,
  UniversalCamera,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  SceneLoader,
} from "@babylonjs/core";

const BabylonWorld: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);

    // Camera (first-person)
    const camera = new UniversalCamera("camera", new Vector3(0, 2, -10), scene);
    camera.attachControl(canvas, true);
    camera.speed = 0.2;
    camera.inertia = 0.1;

    // Light
    const light = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
    light.intensity = 0.9;

    // Ground
    const ground = MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.1, 0.7, 0.1); // green grass
    ground.material = groundMat;

    // Mountains (simple boxes as placeholder)
    for (let i = 0; i < 5; i++) {
      const mountain = MeshBuilder.CreateBox(
        `mountain${i}`,
        { width: 5, height: 3 + Math.random() * 3, depth: 5 },
        scene
      );
      mountain.position = new Vector3(
        Math.random() * 40 - 20,
        (3 + Math.random() * 3) / 2,
        Math.random() * 40 - 20
      );
      const mat = new StandardMaterial(`mountMat${i}`, scene);
      mat.diffuseColor = new Color3(0.5, 0.5, 0.5); // grey
      mountain.material = mat;
    }

    // Skybox (simple blue)
    const skybox = MeshBuilder.CreateBox("skyBox", { size: 500 }, scene);
    const skyboxMaterial = new StandardMaterial("skyMat", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.diffuseColor = new Color3(0.53, 0.81, 0.98); // light blue
    skyboxMaterial.specularColor = new Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    // Enable WASD movement for camera
    camera.keysUp.push(87); // W
    camera.keysDown.push(83); // S
    camera.keysLeft.push(65); // A
    camera.keysRight.push(68); // D

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle resize
    window.addEventListener("resize", () => {
      engine.resize();
    });

    return () => {
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
};

export default BabylonWorld;
